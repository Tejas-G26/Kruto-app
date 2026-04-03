import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Share,
  Alert,
  TextInput,
  Modal,
  AppState,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Icons from "@react-native-vector-icons/ionicons";
import HomeScreenUserProfile from "../component/HomeScreenUserProfile";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");
const LIMIT = 5;

const HomeScreen = ({ navigation }) => {
  const [postData, setPostData] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState({});
  const [followersProfiles, setFollowersProfiles] = useState([]);
  const [loadingFollowers, setLoadingFollowers] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Search states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [userId, setUserId] = useState(null);

  const onEndReachedCalledDuringMomentum = useRef(false);

  // 🔹 Get user + listen auth
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUserId(data?.session?.user?.id || null);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id || null);
      },
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // 🔹 Handle online/offline
  useEffect(() => {
    if (!userId) return;

    const updateStatus = async (isOnline) => {
      await supabase
        .from("users")
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq("user_id", userId);
    };

    updateStatus(true);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        updateStatus(true);
      } else {
        updateStatus(false);
      }
    });

    return () => {
      sub.remove();
      updateStatus(false);
    };
  }, [userId]);

  // 🔥 FORMAT DATE
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format count for likes/comments (K, M)
  const formatCount = (count) => {
    if (!count) return "0";
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // 🔥 GET CURRENT USER
  const getCurrentUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return null;
    }
    return user;
  };

  // 🔥 FETCH FOLLOWERS PROFILES FROM user_follows TABLE
  const fetchFollowersProfiles = async (userId) => {
    try {
      setLoadingFollowers(true);

      const { data, error } = await supabase
        .from("user_follows")
        .select(
          `
          following_id,
          users!user_follows_following_id_fkey (
            user_id,
            username,
            full_name,
            profile_image_url,
            bio
          )
        `,
        )
        .eq("follower_id", userId);

      if (error) {
        console.log("Error:", error);
        setFollowersProfiles([]);
        return;
      }

      const formatted = data
        .map((item) => item.users)
        .filter((user) => user !== null)
        .map((user) => ({
          id: user.user_id,
          name: user.full_name || user.username || "User",
          username: user.username,
          image: user.profile_image_url
            ? { uri: user.profile_image_url }
            : require("../../assets/images/default-avatar.jpg"),
          color: "#3897f0",
          bio: user.bio || "",
        }));

      setFollowersProfiles(formatted);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingFollowers(false);
    }
  };

  // 🔥 REFRESH FUNCTION - Load new posts from the top
  const refreshPosts = async () => {
    setRefreshing(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          users (
            user_id,
            full_name,
            username,
            profile_image_url
          )
        `,
        )
        .order("created_at", { ascending: false })
        .range(0, LIMIT - 1);

      if (error) {
        console.log("Error refreshing posts:", error);
      } else if (data && data.length > 0) {
        const postsWithCounts = await Promise.all(
          data.map(async (post) => {
            const { count: likesCount } = await supabase
              .from("post_likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.post_id);

            const { count: commentsCount } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.post_id);

            const { data: likeData } = await supabase
              .from("post_likes")
              .select("*")
              .eq("post_id", post.post_id)
              .eq("user_id", currentUser?.id);

            return {
              ...post,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              is_liked: likeData && likeData.length > 0,
            };
          }),
        );

        setPostData(postsWithCounts);

        const likedState = {};
        postsWithCounts.forEach((post) => {
          if (post.is_liked) {
            likedState[post.post_id] = true;
          }
        });
        setLikedPosts(likedState);

        setPage(1);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Error", "Failed to refresh posts");
    } finally {
      setRefreshing(false);
    }
  };

  // 🔥 INITIAL FETCH with user data and likes/comments count
  const FetchPost = async () => {
    setLoading(true);
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users (
          user_id,
          full_name,
          username,
          profile_image_url
        )
      `,
      )
      .order("created_at", { ascending: false })
      .range(0, LIMIT - 1);

    if (error) {
      console.log("Error:", error);
    } else {
      const postsWithCounts = await Promise.all(
        data.map(async (post) => {
          const { count: likesCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.post_id);

          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.post_id);

          const { data: likeData } = await supabase
            .from("post_likes")
            .select("*")
            .eq("post_id", post.post_id)
            .eq("user_id", currentUser?.id);

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: likeData && likeData.length > 0,
          };
        }),
      );

      setPostData(postsWithCounts);

      const likedState = {};
      postsWithCounts.forEach((post) => {
        if (post.is_liked) {
          likedState[post.post_id] = true;
        }
      });
      setLikedPosts(likedState);

      setPage(1);
    }
    setLoading(false);
  };

  // 🔥 LOAD MORE with user data and counts
  const loadMorePosts = async () => {
    if (loadingMore) return;

    setLoadingMore(true);

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const from = page * LIMIT;
    const to = from + LIMIT - 1;

    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        *,
        users (
          user_id,
          full_name,
          username,
          profile_image_url
        )
      `,
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error && data && data.length > 0) {
      const postsWithCounts = await Promise.all(
        data.map(async (post) => {
          const { count: likesCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.post_id);

          const { count: commentsCount } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.post_id);

          const { data: likeData } = await supabase
            .from("post_likes")
            .select("*")
            .eq("post_id", post.post_id)
            .eq("user_id", currentUser?.id);

          return {
            ...post,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: likeData && likeData.length > 0,
          };
        }),
      );

      setPostData((prev) => {
        const newData = postsWithCounts.filter(
          (newItem) => !prev.some((item) => item.post_id === newItem.post_id),
        );

        const newLikedState = { ...likedPosts };
        postsWithCounts.forEach((post) => {
          if (post.is_liked) {
            newLikedState[post.post_id] = true;
          }
        });
        setLikedPosts(newLikedState);

        return [...prev, ...newData];
      });

      setPage((prev) => prev + 1);
    }

    setLoadingMore(false);
  };

  // 🔥 SEARCH POSTS BY TITLE
  const searchPosts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("posts")
        .select(
          `
          *,
          users (
            user_id,
            full_name,
            username,
            profile_image_url
          )
        `,
        )
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Search error:", error);
        setSearchResults([]);
      } else if (data && data.length > 0) {
        const postsWithCounts = await Promise.all(
          data.map(async (post) => {
            const { count: likesCount } = await supabase
              .from("post_likes")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.post_id);

            const { count: commentsCount } = await supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("post_id", post.post_id);

            const { data: likeData } = await supabase
              .from("post_likes")
              .select("*")
              .eq("post_id", post.post_id)
              .eq("user_id", currentUser?.id);

            return {
              ...post,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              is_liked: likeData && likeData.length > 0,
            };
          }),
        );
        setSearchResults(postsWithCounts);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isSearchOpen && searchQuery) {
        searchPosts(searchQuery);
      } else if (!searchQuery) {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isSearchOpen]);

  const openSearch = () => {
    setIsSearchOpen(true);
    setSearchQuery("");
    setSearchResults([]);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // 🔥 LIKE POST
  const toggleLike = async (postId, currentLikeStatus, currentLikesCount) => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) return;

    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !currentLikeStatus,
    }));

    setPostData((prevPosts) =>
      prevPosts.map((post) =>
        post.post_id === postId
          ? {
              ...post,
              likes_count: currentLikeStatus
                ? currentLikesCount - 1
                : currentLikesCount + 1,
              is_liked: !currentLikeStatus,
            }
          : post,
      ),
    );

    setSearchResults((prevResults) =>
      prevResults.map((post) =>
        post.post_id === postId
          ? {
              ...post,
              likes_count: currentLikeStatus
                ? currentLikesCount - 1
                : currentLikesCount + 1,
              is_liked: !currentLikeStatus,
            }
          : post,
      ),
    );

    if (currentLikeStatus) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUser.id);
    } else {
      await supabase.from("post_likes").insert([
        {
          post_id: postId,
          user_id: currentUser.id,
          created_at: new Date(),
        },
      ]);
    }
  };

  const sharePost = async (post_id) => {
    const link = `https://kruto-app.netlify.app/post/${post_id}`;

    await Share.share({
      message: "Kruto post : " + link,
    });
  };

  const Notification_Alert = () => {
    Alert.alert("Notification Feature are not working");
  };

  useEffect(() => {
    const initialize = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        await fetchFollowersProfiles(user.id);

        const channel = supabase.channel("user_follows_changes");

        channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_follows",
            filter: `following_id=eq.${user.id}`,
          },
          () => {
            fetchFollowersProfiles(user.id);
          },
        );

        const subscription = channel.subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    initialize();
    FetchPost();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        fetchFollowersProfiles(currentUserId);
      }
    }, [currentUserId]),
  );

  // Render each post
  const renderPost = ({ item }) => {
    const isLiked = likedPosts[item.post_id] || item.is_liked || false;
    const likesCount = item.likes_count || 0;
    const commentsCount = item.comments_count || 0;
    const hasImage = item.image_url && item.image_url.trim() !== "";

    return (
      <View style={styles.card}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.profileSection}
            onPress={() =>
              navigation.navigate("oup", { user_id: item.user_id })
            }
          >
            <Image
              style={styles.profileImg}
              source={{
                uri:
                  item.users?.profile_image_url ||
                  "https://iili.io/BoNMnj4.md.png",
              }}
            />
            <View style={styles.profileTextSection}>
              <Text adjustsFontSizeToFit style={styles.username}>
                {item.users?.full_name || "User"}
              </Text>
              <Text adjustsFontSizeToFit style={styles.userHandle}>
                @{item.users?.username || "user"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Post Image - Only show if image_url exists */}
        <TouchableOpacity
          onPress={() => navigation.navigate("pfv", { post_id: item.post_id })}
          activeOpacity={0.9}
        >
          {hasImage && (
            <Image
              style={styles.postImage}
              resizeMode="cover"
              source={{ uri: item.image_url }}
            />
          )}

          {/* Title - Always show */}
          <Text
           
            numberOfLines={1}
            style={[styles.title, !hasImage && styles.titleNoImage]}
          >
            {item.title}
          </Text>

          {/* Description - Always show */}
          <Text numberOfLines={3} style={styles.desc}>
            {item.description}
          </Text>
        </TouchableOpacity>

        {/* Engagement Stats */}
        <View style={styles.engagementStats}>
          <View style={styles.statItem}>
            <Icons
              name={isLiked ? "heart" : "heart-outline"}
              size={14}
              color={isLiked ? "#ff6b6b" : "#878787"}
            />
            <Text
              adjustsFontSizeToFit
              style={[styles.statText, isLiked && styles.likedStatText]}
            >
              {formatCount(likesCount)} likes
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Icons name="chatbubble-outline" size={14} color="#878787" />
            <Text adjustsFontSizeToFit style={styles.statText}>
              {formatCount(commentsCount)} comments
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Icons name="time-outline" size={14} color="#878787" />
            <Text adjustsFontSizeToFit style={styles.statText}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <View style={styles.iconRow}>
            <TouchableOpacity
              onPress={() => toggleLike(item.post_id, isLiked, likesCount)}
              style={[styles.iconBtn, isLiked && styles.likedBtn]}
            >
              <Icons
                name={isLiked ? "heart" : "heart-outline"}
                size={20}
                color={isLiked ? "#ff6b6b" : "#fff"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("pfv", { post_id: item.post_id })
              }
              style={styles.iconBtn}
            >
              <Icons name="chatbubble-outline" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => sharePost(item.post_id)}
              style={styles.iconBtn}
            >
              <Icons name="share-social-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && postData.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3897f0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header2}>
        <View style={styles.profileRow}>
          {!isSearchOpen ? (
            <>
              <Text adjustsFontSizeToFit style={styles.headertitlekruto}>
                Kruto
              </Text>
              <View style={styles.headerIcons}>
                <TouchableOpacity
                  onPress={openSearch}
                  style={styles.iconCircleSearch}
                >
                  <Icons name="search" size={20} color="#3897f0" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.searchContainer}>
                <Icons
                  name="search"
                  size={20}
                  color="#878787"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by title..."
                  placeholderTextColor="#878787"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery("")}
                    style={styles.clearButton}
                  >
                    <Icons name="close-circle" size={20} color="#878787" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={closeSearch}
                style={styles.closeButton}
              >
                <Icons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Stories - Showing Followers */}
      <View style={styles.storySection}>
        <View style={{ alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("cp")}
            style={styles.addStory}
          >
            <Icons name="add" size={30} color="#3897f0" />
          </TouchableOpacity>
          <Text adjustsFontSizeToFit style={{ fontSize: 12, color: "#fff" }}>
            Create
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {loadingFollowers ? (
            <View style={styles.loadingStories}>
              <ActivityIndicator size="small" color="#00ff51" />
            </View>
          ) : followersProfiles.length > 0 ? (
            followersProfiles.map((profile) => (
              <HomeScreenUserProfile
                key={profile.id}
                image={profile.image}
                color={profile.color}
                userId={profile.id}
                userName={profile.name}
              />
            ))
          ) : (
            <View style={styles.emptyStories}>
              <Text adjustsFontSizeToFit style={styles.emptyStoriesText}>
                No followers yet
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Title */}
      <Text adjustsFontSizeToFit style={styles.postHeading}>
        {isSearchOpen
          ? searchResults.length > 0
            ? `Search Results (${searchResults.length})`
            : "Search Results"
          : "Posts"}
      </Text>

      {/* Feed with Pull-to-Refresh */}
      <FlatList
        data={isSearchOpen ? searchResults : postData}
        keyExtractor={(item) => item.post_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 5 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshPosts}
            colors={["#3897f0"]}
            tintColor="#3897f0"
            title="Pull to refresh"
            titleColor="#3897f0"
          />
        }
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        onEndReached={() => {
          if (!isSearchOpen && !onEndReachedCalledDuringMomentum.current) {
            loadMorePosts();
            onEndReachedCalledDuringMomentum.current = true;
          }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          isSearchOpen && !isSearching && searchQuery.length >= 0 ? (
            <View style={styles.emptySearchContainer}>
              <Icons name="search-outline" size={50} color="#3897f0" />
              <Text adjustsFontSizeToFit style={styles.emptySearchText}>
                No posts found
              </Text>
              <Text adjustsFontSizeToFit style={styles.emptySearchSubText}>
                Try searching with different keywords{" "}
              </Text>
            </View>
          ) : isSearchOpen && isSearching ? (
            <View style={styles.searchingContainer}>
              <ActivityIndicator size="small" color="#3897f0" />
              <Text adjustsFontSizeToFit style={styles.searchingText}>
                Searching...
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          !isSearchOpen && loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#3897f0" />
              <Text
                adjustsFontSizeToFit
                style={{ color: "#878787", marginLeft: 10 }}
              >
                Loading more...
              </Text>
            </View>
          ) : null
        }
        renderItem={renderPost}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F0F",
  },
  header2: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  username: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },
  headerIcons: {
    flexDirection: "row",
  },
  iconCircle: {
    backgroundColor: "#2a2a2a",
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  iconCircleSearch: {
    backgroundColor: "#2a2a2a",
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  storySection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  addStory: {
    width: 50,
    height: 50,
    borderRadius: 50,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingStories: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStories: {
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStoriesText: {
    color: "#878787",
    fontSize: 12,
  },
  postHeading: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 12,
    fontWeight: "900",
    marginBottom: 5,
  },
  card: {
    backgroundColor: "#1C1C1E",
    width: "95%",
    alignSelf: "center",
    borderRadius: 20,
    padding: 12,
    marginVertical: 10,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImg: {
    width: 45,
    height: 45,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#424242",
  },
  profileTextSection: {
    marginLeft: 12,
    flex: 1,
  },
  userHandle: {
    color: "#878787",
    fontSize: 12,
    marginTop: 2,
  },
  menuBtn: {
    padding: 5,
  },
  postImage: {
    width: "100%",
    height: 170,
    borderRadius: 15,
    backgroundColor: "#2a2a2a",
  },
  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 10,
  },
  titleNoImage: {
    marginTop: 0, // Less top margin when there's no image
  },
  desc: {
    color: "#9a9a9a",
    fontSize: 13,
    marginTop: 5,
  },
  engagementStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2f2f2f",
    borderRadius: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statText: {
    color: "#878787",
    fontSize: 11,
    fontWeight: "500",
  },
  likedStatText: {
    color: "#ff6b6b",
  },
  statDivider: {
    width: 1,
    height: 15,
    backgroundColor: "#2f2f2f",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  iconRow: {
    flexDirection: "row",
    gap: 10,
  },
  iconBtn: {
    backgroundColor: "#2f2f2f",
    width: 38,
    height: 38,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  likedBtn: {
    backgroundColor: "#2f2f2f",
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 5,
  },
  closeButton: {
    padding: 5,
  },
  emptySearchContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptySearchText: {
    color: "#878787",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 10,
  },
  emptySearchSubText: {
    color: "#878787",
    fontSize: 14,
    marginTop: 5,
  },
  searchingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  searchingText: {
    color: "#878787",
    fontSize: 14,
    marginTop: 10,
  },
  headertitlekruto: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
});

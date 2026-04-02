import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Share,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from "@/lib/supabase";
import PostFullDetailCard from "../component/PostFullDetailCard";
import { RefreshControl } from "react-native";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;

const OtherUserProfileScreen = ({ route, navigation }) => {
  const { user_id } = route.params;

  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const [currentuserid, setCurrentuserid] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 GET CURRENT USER
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentuserid(user.id);
    return user;
  };

  const sharePost = async (profile_id) => {
    const link = `https://kruto-app.netlify.app/profile/${profile_id}`; // ✅ correct

    await Share.share({
      message: "Kruto profile : " + link,
    });
  };

  const formatDOB = (isoDate) => {
    const date = new Date(isoDate);

    const day = date.getDate();
    const year = date.getFullYear();

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const month = monthNames[date.getMonth()];

    return `${day}-${month} ${year}`;
  };

  const onRefresh = async () => {
  setRefreshing(true);
  await fetchProfile();
  setRefreshing(false);
};

  // 🔥 FETCH PROFILE
  const fetchProfile = async () => {
    setLoading(true);

    const current = await getCurrentUser();
    setCurrentUser(current);

    // USER DATA
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", user_id)
      .single();

    setUser(userData);

    // POSTS
    // ✅ FIXED POSTS FETCH
const { data: postData } = await supabase
  .from("posts")
  .select(`
    *,
    post_likes!left(user_id),
    comments(count)
  `)
  .eq("user_id", user_id)
  .order("created_at", { ascending: false });

if (!postData) {
  setPosts([]);
  return;
}

const formattedPosts = postData.map(post => {
  const likes = post.post_likes || [];

  return {
    ...post,
    likes_count: likes.length,
    comments_count: post.comments?.[0]?.count || 0,
    user_has_liked: likes.some(like => like.user_id === current.id)
  };
});

setPosts(formattedPosts);
    // FOLLOWERS COUNT
    const { count: followersCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", user_id);

    setFollowers(followersCount || 0);

    // FOLLOWING COUNT
    const { count: followingCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", user_id);

    setFollowing(followingCount || 0);

    // CHECK FOLLOW STATUS
    const { data: followData } = await supabase
      .from("user_follows")
      .select("*")
      .eq("follower_id", current.id)
      .eq("following_id", user_id)
      .single();

    setIsFollowing(!!followData);

    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Add this function in your OtherUserProfileScreen component (before the return statement)
  const handlePostDelete = (deletedPostId) => {
    // Remove the deleted post from the posts state
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post.post_id !== deletedPostId),
    );

    // Optional: Show a success message
    Alert.alert("Success", "Post deleted successfully");
  };

  // 🔥 FOLLOW / UNFOLLOW
  const handleFollow = async () => {
    if (!currentUser) return;

    if (isFollowing) {
      // UNFOLLOW
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", user_id);

      setIsFollowing(false);
      setFollowers((prev) => prev - 1);
    } else {
      // FOLLOW
      await supabase.from("user_follows").insert({
        follower_id: currentUser.id,
        following_id: user_id,
      });

      setIsFollowing(true);
      setFollowers((prev) => prev + 1);
    }
  };

  const getJoinedDate = () => {
    if (!user?.created_at) return "Recently";
    const date = new Date(user.created_at);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3897f0" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Text adjustsFontSizeToFit style={styles.Nav_text}>
            Profile
          </Text>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => sharePost(user.user_id)}
              style={styles.iconCircle}
            >
              <Icons name="share-social-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={["#3897f0"]}
      tintColor="#3897f0"
    />
  }
>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <Image
              style={styles.avatar}
              source={{ uri: user.profile_image_url }}
              resizeMode="cover"
            />
            <View style={styles.verifiedBadge}>
              <Icons name="checkmark-circle" size={20} color="#3897f0" />
            </View>
          </View>

          <View style={styles.nameContainer}>
            <Text adjustsFontSizeToFit style={styles.name}>
              {user.full_name}
            </Text>
            <Text adjustsFontSizeToFit style={styles.username}>
              @{user.username}
            </Text>
          </View>

          {/* Bio with Show More */}
          {user.bio && (
            <View style={styles.bioContainer}>
              <Text adjustsFontSizeToFit style={styles.bio}>
                {showMore
                  ? user.bio
                  : user.bio.length > 100
                    ? `${user.bio.substring(0, 100)}...`
                    : user.bio}
              </Text>
              {user.bio.length > 100 && (
                <TouchableOpacity
                  style={styles.moreLink}
                  onPress={() => setShowMore(!showMore)}
                >
                  <Text adjustsFontSizeToFit style={styles.moreText}>
                    {showMore ? "Show less" : "Show more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Quick Info Chips */}
          <View style={styles.quickInfoContainer}>
            {user.location && (
              <View style={styles.infoChip}>
                <Icons name="location-outline" size={14} color="#8E8E93" />
                <Text adjustsFontSizeToFit style={styles.infoChipText}>
                  {user.location}
                </Text>
              </View>
            )}

            <View style={styles.infoChip}>
              <Icons name="calendar-outline" size={14} color="#8E8E93" />
              <Text adjustsFontSizeToFit style={styles.infoChipText}>
                Joined {getJoinedDate()}
              </Text>
            </View>
          </View>

          {/* More Details Button */}
          <TouchableOpacity
            style={styles.moreDetailsBtn}
            onPress={() => setShowMore(!showMore)}
          >
            <Text adjustsFontSizeToFit style={styles.moreDetailsText}>
              {showMore ? "Hide Details" : "View Full Details"}
            </Text>
            <Icons
              name={showMore ? "chevron-up" : "chevron-down"}
              size={16}
              color="#3897f0"
            />
          </TouchableOpacity>

          {/* Extra Info - Full Details */}
          {showMore && (
            <View style={styles.moreInfoContainer}>
              <View style={styles.moreInfoHeader}>
                <Icons name="person-circle-outline" size={20} color="#3897f0" />
                <Text adjustsFontSizeToFit style={styles.moreInfoTitle}>
                  Personal Information
                </Text>
              </View>

              {user.email && (
                <View style={styles.moreInfoItem}>
                  <View style={styles.moreInfoIcon}>
                    <Icons name="mail-outline" size={16} color="#3897f0" />
                  </View>
                  <View style={styles.moreInfoContent}>
                    <Text adjustsFontSizeToFit style={styles.moreInfoLabel}>
                      Email
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.moreInfoText}>
                      {user.email}
                    </Text>
                  </View>
                </View>
              )}

              {user.phone_number && (
                <View style={styles.moreInfoItem}>
                  <View style={styles.moreInfoIcon}>
                    <Icons name="call-outline" size={16} color="#3897f0" />
                  </View>
                  <View style={styles.moreInfoContent}>
                    <Text adjustsFontSizeToFit style={styles.moreInfoLabel}>
                      Phone
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.moreInfoText}>
                      {user.phone_number}
                    </Text>
                  </View>
                </View>
              )}

              {user.date_of_birth && (
                <View style={styles.moreInfoItem}>
                  <View style={styles.moreInfoIcon}>
                    <Icons name="calendar" size={16} color="#3897f0" />
                  </View>
                  <View style={styles.moreInfoContent}>
                    <Text adjustsFontSizeToFit style={styles.moreInfoLabel}>
                      Birthday
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.moreInfoText}>
                      {formatDOB(user.date_of_birth)}
                    </Text>
                  </View>
                </View>
              )}

              {user.gender && (
                <View style={styles.moreInfoItem}>
                  <View style={styles.moreInfoIcon}>
                    <Icons
                      name="male-female-outline"
                      size={16}
                      color="#3897f0"
                    />
                  </View>
                  <View style={styles.moreInfoContent}>
                    <Text adjustsFontSizeToFit style={styles.moreInfoLabel}>
                      Gender
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.moreInfoText}>
                      {user.gender}
                    </Text>
                  </View>
                </View>
              )}

              {user.occupation && (
                <View style={styles.moreInfoItem}>
                  <View style={styles.moreInfoIcon}>
                    <Icons name="briefcase-outline" size={16} color="#3897f0" />
                  </View>
                  <View style={styles.moreInfoContent}>
                    <Text adjustsFontSizeToFit style={styles.moreInfoLabel}>
                      Occupation
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.moreInfoText}>
                      {user.occupation}
                    </Text>
                  </View>
                </View>
              )}

              {user.relationship_status && (
                <View style={styles.moreInfoItem}>
                  <View style={styles.moreInfoIcon}>
                    <Icons name="heart-outline" size={16} color="#3897f0" />
                  </View>
                  <View style={styles.moreInfoContent}>
                    <Text adjustsFontSizeToFit style={styles.moreInfoLabel}>
                      Relationship
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.moreInfoText}>
                      {user.relationship_status}
                    </Text>
                  </View>
                </View>
              )}

              {user.website_link && (
                <View style={styles.moreInfoItem}>
                  <View style={styles.moreInfoIcon}>
                    <Icons name="globe-outline" size={16} color="#3897f0" />
                  </View>
                  <View style={styles.moreInfoContent}>
                    <Text adjustsFontSizeToFit style={styles.moreInfoLabel}>
                      Website
                    </Text>
                    <Text adjustsFontSizeToFit style={styles.moreInfoText}>
                      {user.website_link}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text adjustsFontSizeToFit style={styles.statNumber}>
              {posts.length}
            </Text>
            <Text adjustsFontSizeToFit style={styles.statLabel}>
              Posts
            </Text>
            <View style={styles.statIcon}>
              <Icons name="images-outline" size={16} color="#3897f0" />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{followers}</Text>
            <Text adjustsFontSizeToFit style={styles.statLabel}>
              Followers
            </Text>
            <View style={styles.statIcon}>
              <Icons name="people-outline" size={16} color="#3897f0" />
            </View>
          </View>

          <View style={styles.statCard}>
            <Text adjustsFontSizeToFit style={styles.statNumber}>
              {following}
            </Text>
            <Text adjustsFontSizeToFit style={styles.statLabel}>
              Following
            </Text>
            <View style={styles.statIcon}>
              <Icons name="person-add-outline" size={16} color="#3897f0" />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            onPress={handleFollow}
            style={[
              styles.followBtn,
              { backgroundColor: isFollowing ? "#2f2f2f" : "#3897f0" },
            ]}
          >
            <Icons
              name={isFollowing ? "checkmark" : "person-add"}
              size={20}
              color={isFollowing ? "#fff" : "#fff"}
            />
            <Text adjustsFontSizeToFit style={styles.followBtnText}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => {
              navigation.navigate("chat", {
                currentUserId: currentuserid,
                otherUserId: user_id,
              });
            }}
          >
            <Icons name="chatbubble-outline" size={20} color="#fff" />
            <Text adjustsFontSizeToFit style={styles.messageBtnText}>
              Message
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts Header */}
        <View style={styles.postsHeader}>
          <View style={styles.postsHeaderLeft}>
            <Icons name="grid-outline" size={20} color="#3897f0" />
            <Text adjustsFontSizeToFit style={styles.postsTitle}>
              Posts
            </Text>
          </View>
          {posts.length > 0 && (
            <View style={styles.postsCountBadge}>
              <Text adjustsFontSizeToFit style={styles.postsCount}>
                {posts.length}
              </Text>
            </View>
          )}
        </View>

        {/* Feed */}
        <View style={styles.feed}>
          {posts.length === 0 ? (
            <View style={styles.emptyPostsContainer}>
              <View style={styles.emptyIconContainer}>
                <Icons name="images-outline" size={60} color="#2f2f2f" />
              </View>
              <Text adjustsFontSizeToFit style={styles.emptyPostsTitle}>
                No posts yet
              </Text>
              <Text adjustsFontSizeToFit style={styles.emptyPostsSubtitle}>
                {user.full_name} hasn't posted anything yet
              </Text>
            </View>
          ) : (
            posts.map((item) => (
              <PostFullDetailCard
                key={item.post_id}
                post_id={item.post_id}
                user_id={item.user_id}
                image={{ uri: item.image_url }}
                proimg={{ uri: user.profile_image_url }}
                name={user.full_name}
                username={user.username}
                title={item.title}
                des={item.description}
                time={item.created_at}
                initialLikesCount={item.likes_count || 0}
                initialCommentsCount={item.comments_count || 0}
                initialIsLiked={item.user_has_liked || false}
                onLikeUpdate={(postId, isLiked, newCount) => {
                  // Update likes count in the posts state
                  setPosts((prevPosts) =>
                    prevPosts.map((post) =>
                      post.post_id === postId
                        ? { ...post, likes_count: newCount }
                        : post,
                    ),
                  );
                }}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OtherUserProfileScreen;

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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
    backgroundColor: "#0F0F0F",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2f2f2f",
  },
  Nav_text: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    backgroundColor: "#2f2f2f",
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
  },
  avatarWrapper: {
    marginBottom: 16,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#0F0F0F",
    backgroundColor: "#1C1C1E",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#0F0F0F",
    borderRadius: 12,
    padding: 2,
  },
  nameContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    color: "#FFFFFF",
    fontSize: isSmallDevice ? 22 : 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  username: {
    color: "#8E8E93",
    fontSize: isSmallDevice ? 13 : 14,
  },
  bioContainer: {
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  bio: {
    color: "#AAAAAA",
    fontSize: isSmallDevice ? 13 : 14,
    textAlign: "center",
    lineHeight: 20,
  },
  quickInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  infoChipText: {
    color: "#8E8E93",
    fontSize: 12,
  },
  moreDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 12,
  },
  moreDetailsText: {
    color: "#3897f0",
    fontSize: 13,
    fontWeight: "600",
  },
  moreLink: {
    marginTop: 4,
  },
  moreText: {
    color: "#3897f0",
    fontSize: 12,
    fontWeight: "500",
  },
  moreInfoContainer: {
    marginTop: 8,
    width: "100%",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  moreInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
  },
  moreInfoTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  moreInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  moreInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
  },
  moreInfoContent: {
    flex: 1,
  },
  moreInfoLabel: {
    color: "#8E8E93",
    fontSize: 11,
    marginBottom: 2,
  },
  moreInfoText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 20,
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 16,
    position: "relative",
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: isSmallDevice ? 22 : 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "#8E8E93",
    fontSize: isSmallDevice ? 9 : 10,
    marginBottom: 8,
  },
  statIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    opacity: 0.3,
  },
  actionContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  followBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  followBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  messageBtn: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  messageBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  postsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#2f2f2f",
  },
  postsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postsTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  postsCountBadge: {
    backgroundColor: "#3897f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  postsCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  feed: {
    paddingBottom: 20,
  },
  emptyPostsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyPostsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  emptyPostsSubtitle: {
    color: "#878787",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
});

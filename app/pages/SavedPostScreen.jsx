import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import PostFullDetailCard from "../component/PostFullDetailCard";

const { width } = Dimensions.get("window");

const SavedPostScreen = ({ navigation }) => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Fetch current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      return user.id;
    }
    return null;
  };

  // Fetch likes count for a specific post
  const fetchLikesCount = async (postId) => {
    const { count, error } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    
    if (error) {
      console.error("Error fetching likes count:", error);
      return 0;
    }
    return count || 0;
  };

  // Fetch comments count for a specific post
  const fetchCommentsCount = async (postId) => {
    const { count, error } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);
    
    if (error) {
      console.error("Error fetching comments count:", error);
      return 0;
    }
    return count || 0;
  };

  // Check if current user liked a specific post
  const checkUserLiked = async (postId, userId) => {
    const { data, error } = await supabase
      .from("post_likes")
      .select("*")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();
    
    if (error && error.code !== "PGRST116") { // PGRST116 means no rows returned
      console.error("Error checking like status:", error);
      return false;
    }
    return !!data;
  };

  // Fetch user details
  const fetchUserDetails = async (userId) => {
    const { data, error } = await supabase
      .from("users")
      .select("full_name, username, profile_image_url")
      .eq("user_id", userId)
      .single();
    
    if (error) {
      console.error("Error fetching user details:", error);
      return null;
    }
    return data;
  };

  // Fetch saved posts
  const fetchSavedPosts = async () => {
    try {
      const userId = await getCurrentUser();
      if (!userId) {
        setLoading(false);
        return;
      }

      // First, get saved posts with post basic info
      const { data: savedData, error: savedError } = await supabase
        .from("saved_posts")
        .select(`
          save_id,
          created_at,
          post_id
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (savedError) {
        console.error("Error fetching saved posts:", savedError);
        setLoading(false);
        return;
      }

      if (!savedData || savedData.length === 0) {
        setSavedPosts([]);
        setLoading(false);
        return;
      }

      // Fetch full post details for each saved post
      const postsWithDetails = await Promise.all(
        savedData.map(async (savedItem) => {
          try {
            // Fetch post details
            const { data: postData, error: postError } = await supabase
              .from("posts")
              .select("*")
              .eq("post_id", savedItem.post_id)
              .single();

            if (postError || !postData) {
              console.error("Error fetching post details:", postError);
              return null;
            }

            // Fetch user details for the post author
            const userDetails = await fetchUserDetails(postData.user_id);
            
            // Fetch counts and like status in parallel
            const [likesCount, commentsCount, isLiked] = await Promise.all([
              fetchLikesCount(savedItem.post_id),
              fetchCommentsCount(savedItem.post_id),
              checkUserLiked(savedItem.post_id, userId)
            ]);

            return {
              save_id: savedItem.save_id,
              saved_at: savedItem.created_at,
              post: {
                ...postData,
                likes_count: likesCount,
                comments_count: commentsCount,
                user_has_liked: isLiked,
                author_name: userDetails?.full_name || "Unknown User",
                author_username: userDetails?.username || "unknown",
                author_profile_image: userDetails?.profile_image_url || null
              }
            };
          } catch (error) {
            console.error("Error processing saved post:", error);
            return null;
          }
        })
      );

      // Filter out any null values and set state
      const validPosts = postsWithDetails.filter(item => item !== null);
      setSavedPosts(validPosts);
    } catch (error) {
      console.error("Error in fetchSavedPosts:", error);
      Alert.alert("Error", "Failed to load saved posts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle post deletion from saved posts
  const handlePostDelete = (deletedPostId) => {
    setSavedPosts(prevPosts => 
      prevPosts.filter(item => item.post.post_id !== deletedPostId)
    );
    Alert.alert("Success", "Post removed from saved");
  };

  // Handle unsave post
  const handleUnsavePost = async (saveId, postId) => {
    Alert.alert(
      "Remove Saved Post",
      "Are you sure you want to remove this post from your saved items?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("saved_posts")
                .delete()
                .eq("save_id", saveId);

              if (error) {
                throw error;
              }

              // Remove from local state
              setSavedPosts(prevPosts => 
                prevPosts.filter(item => item.save_id !== saveId)
              );
              
              Alert.alert("Success", "Post removed from saved items");
            } catch (error) {
              console.error("Error unsaving post:", error);
              Alert.alert("Error", "Failed to remove saved post");
            }
          }
        }
      ]
    );
  };

  // Handle like update
  const handleLikeUpdate = async (postId, isLiked, newCount) => {
    // Update local state immediately for UI responsiveness
    setSavedPosts(prevPosts =>
      prevPosts.map(item =>
        item.post.post_id === postId
          ? {
              ...item,
              post: {
                ...item.post,
                likes_count: newCount,
                user_has_liked: isLiked
              }
            }
          : item
      )
    );
  };

  // Handle comment update (if needed)
  const handleCommentUpdate = (postId, newCount) => {
    setSavedPosts(prevPosts =>
      prevPosts.map(item =>
        item.post.post_id === postId
          ? {
              ...item,
              post: {
                ...item.post,
                comments_count: newCount
              }
            }
          : item
      )
    );
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSavedPosts();
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      fetchSavedPosts();
    }, [])
  );

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Icons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text adjustsFontSizeToFit style={styles.headerTitle}>Saved Posts</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3897f0" />
          <Text adjustsFontSizeToFit style={styles.loadingText}>Loading saved posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <Text adjustsFontSizeToFit style={styles.headerTitle}>Saved Posts</Text>

        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={() => Alert.alert("Info", "Posts you save will appear here")}
        >
          <Icons name="information-circle-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3897f0"
            colors={["#3897f0"]}
          />
        }
      >
        {savedPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icons name="bookmark-outline" size={60} color="#2f2f2f" />
            </View>
            <Text adjustsFontSizeToFit style={styles.emptyTitle}>No saved posts yet</Text>
            <Text adjustsFontSizeToFit style={styles.emptySubtitle}>
              Posts you save will appear here
            </Text>
          </View>
        ) : (
          <>
            {/* Saved posts count */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Icons name="bookmark" size={20} color="#3897f0" />
                <Text adjustsFontSizeToFit style={styles.statNumber}>{savedPosts.length}</Text>
                <Text adjustsFontSizeToFit style={styles.statLabel}>Saved Items</Text>
              </View>
            </View>

            {/* Saved posts list */}
            <View style={styles.feed}>
              {savedPosts.map((item) => (
                <View key={item.save_id} style={styles.postContainer}>
                  <PostFullDetailCard
                    post_id={item.post.post_id}
                    user_id={item.post.user_id}
                    image={{ uri: item.post.image_url }}
                    proimg={{ uri: item.post.author_profile_image }}
                    name={item.post.author_name}
                    username={item.post.author_username}
                    title={item.post.title}
                    des={item.post.description}
                    time={item.post.created_at}
                    initialLikesCount={item.post.likes_count || 0}
                    initialCommentsCount={item.post.comments_count || 0}
                    initialIsLiked={item.post.user_has_liked || false}
                    onLikeUpdate={handleLikeUpdate}
                    onPostDelete={handlePostDelete}
                    onCommentUpdate={handleCommentUpdate}
                  />
                  
                  {/* Unsave button */}
                  <TouchableOpacity 
                    style={styles.unsaveButton}
                    onPress={() => handleUnsavePost(item.save_id, item.post.post_id)}
                  >
                    <Icons name="bookmark" size={20} color="#3897f0" />
                    <Text adjustsFontSizeToFit style={styles.unsaveText}>Saved</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SavedPostScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
    backgroundColor: "#0F0F0F",
  },
  backButton: {
    backgroundColor: "#2f2f2f",
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
  },
  statCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    color: "#8E8E93",
    fontSize: 14,
  },
  feed: {
    paddingBottom: 20,
  },
  postContainer: {
    marginBottom: 16,
    position: "relative",
  },
  unsaveButton: {
    position: "absolute",
    bottom: 20,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    zIndex: 1,
  },
  unsaveText: {
    color: "#3897f0",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
    gap: 16,
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
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#8E8E93",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  exploreButton: {
    backgroundColor: "#3897f0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Share, KeyboardAvoidingView, Platform } from "react-native";
import React, { useEffect, useState } from "react";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

const PostFullDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const { post_id } = route.params;

  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLikes, setCommentLikes] = useState({});

  // 🔥 FORMAT DATE
  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format count for likes/comments (K, M)
  const formatCount = (count) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

  // 🔥 FETCH ALL DATA
  const fetchPostDetails = async () => {
    setLoading(true);
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // post
    const { data: postData } = await supabase
      .from("posts")
      .select("*")
      .eq("post_id", post_id)
      .single();

    setPost(postData);

    // user
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", postData.user_id)
      .single();

    setUser(userData);

    // likes count
    const { count } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", post_id);

    setLikesCount(count);

    // liked check
    const { data: likeData } = await supabase
      .from("post_likes")
      .select("*")
      .eq("post_id", post_id)
      .eq("user_id", currentUser.id);

    setLiked(likeData.length > 0);

    // saved check
    const { data: saveData } = await supabase
      .from("saved_posts")
      .select("*")
      .eq("post_id", post_id)
      .eq("user_id", currentUser.id);

    setSaved(saveData.length > 0);

    // comments with user details and likes count
    const { data: commentData } = await supabase
      .from("comments")
      .select(`
        *,
        users(full_name, username, profile_image_url),
        comment_likes(count)
      `)
      .eq("post_id", post_id)
      .order("created_at", { ascending: false });

    // Fetch comment likes for current user
    const commentIds = commentData?.map(c => c.comment_id) || [];
    if (commentIds.length > 0) {
      const { data: userCommentLikes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds)
        .eq("user_id", currentUser.id);

      const likedComments = {};
      userCommentLikes?.forEach(like => {
        likedComments[like.comment_id] = true;
      });
      setCommentLikes(likedComments);
    }

    setComments(commentData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPostDetails();
  }, []);

  // 🔥 LIKE POST
  const toggleLike = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (liked) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post_id)
        .eq("user_id", currentUser.id);

      setLikesCount((prev) => prev - 1);
    } else {
      await supabase.from("post_likes").insert([
        {
          post_id,
          user_id: currentUser.id,
          created_at: new Date(),
        },
      ]);

      setLikesCount((prev) => prev + 1);
    }

    setLiked(!liked);
  };

  // 🔥 SAVE POST
  const toggleSave = async () => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (saved) {
      await supabase
        .from("saved_posts")
        .delete()
        .eq("post_id", post_id)
        .eq("user_id", currentUser.id);
    } else {
      await supabase.from("saved_posts").insert([
        {
          post_id,
          user_id: currentUser.id,
          created_at: new Date(),
        },
      ]);
    }

    setSaved(!saved);
  };

  // 🔥 ADD COMMENT
  const addComment = async () => {
    if (!comment.trim()) return;

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const { data: newComment, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id,
          user_id: currentUser.id,
          comment_text: comment,
          created_at: new Date(),
        },
      ])
      .select(`
        *,
        users(full_name, username, profile_image_url)
      `)
      .single();

    if (!error && newComment) {
      setComments([newComment, ...comments]);
      setComment("");
    } else {
      fetchPostDetails();
    }
  };

  const sharePost = async () => {
    const link = `https://kruto-app.netlify.app/post/${post_id}`;
    await Share.share({
      message: 'Kruto post : ' + link,
    });
  };

  // 🔥 LIKE COMMENT
  const toggleCommentLike = async (commentId, currentLikeStatus) => {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentLikeStatus) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", currentUser.id);

      setCommentLikes(prev => ({
        ...prev,
        [commentId]: false
      }));

      setComments(prevComments =>
        prevComments.map(comment =>
          comment.comment_id === commentId
            ? { ...comment, comment_likes: [{ count: (comment.comment_likes?.[0]?.count || 1) - 1 }] }
            : comment
        )
      );
    } else {
      await supabase
        .from("comment_likes")
        .insert([
          {
            comment_id: commentId,
            user_id: currentUser.id,
            created_at: new Date(),
          },
        ]);

      setCommentLikes(prev => ({
        ...prev,
        [commentId]: true
      }));

      setComments(prevComments =>
        prevComments.map(comment =>
          comment.comment_id === commentId
            ? { ...comment, comment_likes: [{ count: (comment.comment_likes?.[0]?.count || 0) + 1 }] }
            : comment
        )
      );
    }
  };

  // Get comment like count
  const getCommentLikeCount = (comment) => {
    return comment.comment_likes?.[0]?.count || 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3897f0" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post || !user) return null;

  // Comment component with like functionality
  const CommentItem = ({ item }) => {
    const isLiked = commentLikes[item.comment_id] || false;
    const likeCount = getCommentLikeCount(item);

    return (
      <View style={styles.commentContainer}>
        <Image 
          style={styles.commentProfileImg} 
          source={{ uri: item.users?.profile_image_url || 'https://via.placeholder.com/40' }} 
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text adjustsFontSizeToFit style={styles.commentName}>{item.users?.full_name || 'User'}</Text>
            <Text adjustsFontSizeToFit style={styles.commentUsername}>@{item.users?.username || 'user'}</Text>
            <Text adjustsFontSizeToFit style={styles.commentTime}>• {formatDate(item.created_at)}</Text>
          </View>
          <Text adjustsFontSizeToFit style={styles.commentText}>{item.comment_text}</Text>
          <View style={styles.commentActions}>
            <TouchableOpacity 
              onPress={() => toggleCommentLike(item.comment_id, isLiked)} 
              style={styles.commentActionBtn}>
              <Icons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={14} 
                color={isLiked ? "#ff6b6b" : "#878787"} 
              />
              {likeCount > 0 && (
                <Text adjustsFontSizeToFit style={[styles.commentActionText, isLiked && styles.likedCommentText]}>
                  {formatCount(likeCount)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}>
        
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text adjustsFontSizeToFit style={styles.headerTitle}>Post</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            
            {/* Post Card */}
            <View style={styles.postCard}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <TouchableOpacity 
                 onPress={() => {
                navigation.navigate("oup", {
              user_id: user.user_id,
                  });
                  }}
                style={styles.profileSection}>
                  <Image style={styles.profileImg} source={{ uri: user.profile_image_url }} />
                  <View style={styles.profileTextSection}>
                    <Text adjustsFontSizeToFit style={styles.username}>{user.full_name}</Text>
                    <Text adjustsFontSizeToFit style={styles.userHandle}>@{user.username}</Text>
                  </View>
                </TouchableOpacity>
                
              </View>

              {/* Post Image */}
              <Image style={styles.postImage} source={{ uri: post.image_url }} />

              {/* Title */}
              <Text adjustsFontSizeToFit style={styles.title}>{post.title}</Text>

              {/* Description */}
              <Text adjustsFontSizeToFit style={styles.desc}>{post.description}</Text>

              {/* Engagement Stats */}
              <View style={styles.engagementStats}>
                <View style={styles.statItem}>
                  <Icons 
                    name={liked ? "heart" : "heart-outline"} 
                    size={16} 
                    color={liked ? "#ff6b6b" : "#878787"} 
                  />
                  <Text adjustsFontSizeToFit style={[styles.statText, liked && styles.likedStatText]}>
                    {formatCount(likesCount)} likes
                  </Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Icons name="chatbubble-outline" size={16} color="#878787" />
                  <Text adjustsFontSizeToFit style={styles.statText}>
                    {formatCount(comments.length)} comments
                  </Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Icons name="time-outline" size={16} color="#878787" />
                  <Text adjustsFontSizeToFit style={styles.statText}>{formatDate(post.created_at)}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <View style={styles.iconRow}>
                  <TouchableOpacity 
                    onPress={toggleLike}
                    style={[styles.iconBtn, liked && styles.likedBtn]}>
                    <Icons 
                      name={liked ? "heart" : "heart-outline"} 
                      size={22} 
                      color={liked ? "#ff6b6b" : "#fff"} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.iconBtn} onPress={sharePost}>
                    <Icons name="share-social-outline" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={toggleSave}
                  style={[styles.iconBtn, saved && styles.savedBtn]}>
                  <Icons 
                    name={saved ? "bookmark" : "bookmark-outline"} 
                    size={22} 
                    color={saved ? "#ffd700" : "#fff"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments Section Header */}
            <View style={styles.commentsHeader}>
              <Text adjustsFontSizeToFit style={styles.commentsTitle}>Comments</Text>
              <Text adjustsFontSizeToFit style={styles.commentCount}>{formatCount(comments.length)}</Text>
            </View>

            {/* Comments List */}
            <View style={styles.commentsList}>
              {comments.length > 0 ? (
                comments.map((item) => (
                  <CommentItem key={item.comment_id} item={item} />
                ))
              ) : (
                <View style={styles.noCommentsContainer}>
                  <Icons name="chatbubble-outline" size={48} color="#2f2f2f" />
                  <Text adjustsFontSizeToFit style={styles.noCommentsText}>No comments yet</Text>
                  <Text adjustsFontSizeToFit style={styles.noCommentsSubtext}>Be the first to share your thoughts!</Text>
                </View>
              )}
            </View>

            {/* Bottom Padding */}
            <View style={{ height: 80 }} />
          </ScrollView>

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <Image 
              style={styles.inputProfileImg} 
              source={{ uri: user?.profile_image_url || 'https://via.placeholder.com/40' }} 
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#878787"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            {comment.length > 0 && (
              <TouchableOpacity onPress={addComment} style={styles.sendBtn}>
                <Icons name="send" size={22} color="#3897f0" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PostFullDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  flex: {
    flex: 1,
  },
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#0F0F0F",
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
  },
  backBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#2f2f2f",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: "#0F0F0F",
    padding: 16,
    marginBottom: 10,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
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
    borderColor: "#3897f0",
  },
  profileTextSection: {
    marginLeft: 12,
    flex: 1,
  },
  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  userHandle: {
    color: "#878787",
    fontSize: 13,
    marginTop: 2,
  },
  followBtn: {
    borderWidth: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  followText: {
    color: "#000000",
    fontWeight: "600",
    fontSize: 12,
  },
  postImage: {
    width: "100%",
    height: 300,
    borderRadius: 20,
    marginBottom: 15,
    backgroundColor: "#1a1a1a",
  },
  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
    marginBottom: 8,
  },
  desc: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  engagementStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2f2f2f",
    marginBottom: 15,
    backgroundColor: "#0F0F0F",
    borderRadius: 12,
    marginHorizontal: -8,
    paddingHorizontal: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    color: "#878787",
    fontSize: 10,
    fontWeight: "500",
  },
  likedStatText: {
    color: "#ff6b6b",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#2f2f2f",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    gap: 12,
  },
  iconBtn: {
    backgroundColor: "#2f2f2f",
    width: 45,
    height: 45,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  likedBtn: {
    backgroundColor: "#2f2f2f",
  },
  savedBtn: {
    backgroundColor: "#2f2f2f",
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#2f2f2f",
    marginTop: 8,
  },
  commentsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  commentCount: {
    color: "#cdcdcd",
    fontSize: 14,
    fontWeight: "500",
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  commentsList: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  commentContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  commentProfileImg: {
    width: 40,
    height: 40,
    borderRadius: 40,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#3897f0",
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
    gap: 4,
  },
  commentName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  commentUsername: {
    color: "#878787",
    fontSize: 12,
  },
  commentTime: {
    color: "#878787",
    fontSize: 11,
  },
  commentText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  commentActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentActionText: {
    color: "#878787",
    fontSize: 12,
  },
  likedCommentText: {
    color: "#ff6b6b",
  },
  noCommentsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  noCommentsText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  noCommentsSubtext: {
    color: "#878787",
    fontSize: 14,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1C1C1E",
    borderTopWidth: 1,
    borderTopColor: "#2f2f2f",
  },
  inputProfileImg: {
    width: 40,
    height: 40,
    borderRadius: 40,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "#3897f0",
  },
  commentInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    maxHeight: 100,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#2f2f2f",
    borderRadius: 25,
  },
  sendBtn: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 25,
  },
});
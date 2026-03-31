import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Modal, ActivityIndicator,Share } from "react-native";
import React, { useState, useEffect } from "react";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";

const PostFullDetailCard = ({ 
  image, 
  proimg, 
  name, 
  username, 
  title, 
  des, 
  time, 
  post_id, 
  user_id,  // This is the post creator's user_id
  initialLikesCount = 0,
  initialCommentsCount = 0,
  initialIsLiked = false,
  onLikeUpdate,
  onPostDelete
}) => {
  const navigation = useNavigation();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
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
    if (!count) return '0';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

   const sharePost = async (post_id) => {
      const link = `kruto://post/${post_id}`; // ✅ correct
    
      await Share.share({
        message:'Kruto post : '+ link,
      });
    };
  

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // Check if current user owns this post
  const isPostOwner = () => {
    if (!currentUser || !user_id) return false;
    return currentUser.id === user_id;
  };

  // Toggle like with proper error handling
  const toggleLike = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'Please login to like posts');
      return;
    }

    if (!post_id) {
      console.error('Cannot toggle like: post_id is missing or null');
      Alert.alert('Error', 'Unable to like this post. Post ID is missing.');
      return;
    }

    const newLikedStatus = !isLiked;
    const newLikesCount = newLikedStatus ? likesCount + 1 : likesCount - 1;

    // Optimistic update
    setIsLiked(newLikedStatus);
    setLikesCount(newLikesCount);

    if (onLikeUpdate) {
      onLikeUpdate(post_id, newLikedStatus, newLikesCount);
    }

    try {
      if (newLikedStatus) {
        // Insert like
        const { error } = await supabase
          .from("post_likes")
          .insert([
            {
              post_id: post_id,
              user_id: currentUser.id,
              created_at: new Date().toISOString(),
            },
          ]);

        if (error) {
          console.error('Supabase insert error:', error);
          // Rollback optimistic update
          setIsLiked(!newLikedStatus);
          setLikesCount(likesCount);
          
          if (onLikeUpdate) {
            onLikeUpdate(post_id, !newLikedStatus, likesCount);
          }
          
          if (error.code === '23505') {
            Alert.alert('Already Liked', 'You have already liked this post');
          } else {
            Alert.alert('Error', 'Failed to like post. Please try again.');
          }
        }
      } else {
        // Remove like
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post_id)
          .eq("user_id", currentUser.id);

        if (error) {
          console.error('Supabase delete error:', error);
          // Rollback optimistic update
          setIsLiked(!newLikedStatus);
          setLikesCount(likesCount);
          
          if (onLikeUpdate) {
            onLikeUpdate(post_id, !newLikedStatus, likesCount);
          }
          
          Alert.alert('Error', 'Failed to unlike post. Please try again.');
        }
      }
    } catch (error) {
      console.error('Unexpected error in toggleLike:', error);
      // Rollback optimistic update
      setIsLiked(!newLikedStatus);
      setLikesCount(likesCount);
      
      if (onLikeUpdate) {
        onLikeUpdate(post_id, !newLikedStatus, likesCount);
      }
      
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!post_id) {
      Alert.alert('Error', 'Cannot delete post: Post ID is missing');
      return;
    }

    setIsDeleting(true);
    
    try {
      // First, delete all likes associated with this post
      const { error: likesError } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post_id);
      
      if (likesError) {
        console.error('Error deleting likes:', likesError);
      }

      // Delete all comments associated with this post
      const { error: commentsError } = await supabase
        .from("comments")
        .delete()
        .eq("post_id", post_id);
      
      if (commentsError) {
        console.error('Error deleting comments:', commentsError);
      }

      // Finally, delete the post
      const { error: postError } = await supabase
        .from("posts")
        .delete()
        .eq("post_id", post_id);

      if (postError) {
        console.error('Error deleting post:', postError);
        Alert.alert('Error', 'Failed to delete post. Please try again.');
        return;
      }

      Alert.alert('Success', 'Post deleted successfully');
      
      // Call the onPostDelete callback to update parent component
      if (onPostDelete) {
        onPostDelete(post_id);
      }
      
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Unexpected error in deletePost:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigate to full post view
  const handlePostPress = () => {
    if (!post_id) {
      console.error('Cannot navigate: post_id is missing');
      return;
    }
    navigation.navigate('pfv', { 
      post_id: post_id,
      user_id: user_id
    });
  };

  // Navigate to user profile
  const handleProfilePress = () => {
    if (user_id) {
      navigation.navigate('oup', { user_id: user_id });
    }
  };

  // Handle menu press - only show options if user owns the post
  const handleMenuPress = () => {
    if (isPostOwner()) {
      setShowDeleteModal(true);
    }
  };

  // Debug log to check ownership
  useEffect(() => {
    if (currentUser && user_id) {
      console.log('Post ownership check:', {
        post_id: post_id,
        post_owner_id: user_id,
        current_user_id: currentUser.id,
        isOwner: currentUser.id === user_id
      });
    }
  }, [currentUser, user_id, post_id]);

  return (
    <>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={handlePostPress}
        style={styles.card}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.profileSection}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            <Image style={styles.profileImg} source={proimg} />
            <View style={styles.profileTextSection}>
              <Text adjustsFontSizeToFit style={styles.username}>{name}</Text>
              {username && <Text adjustsFontSizeToFit style={styles.userHandle}>@{username}</Text>}
            </View>
          </TouchableOpacity>

          {/* Only show menu button if user owns the post */}
          {isPostOwner() && (
            <TouchableOpacity 
              style={styles.menuBtn}
              onPress={handleMenuPress}
            >
              <Icons name='ellipsis-vertical' size={20} color={'#fff'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Image */}
        <Image 
          style={styles.postImage} 
          source={image} 
          resizeMode="cover"
        />

        {/* Title */}
        {title && (
          <Text adjustsFontSizeToFit style={styles.title}>
            {title}
          </Text>
        )}

        {/* Description */}
        {des && (
          <Text adjustsFontSizeToFit numberOfLines={2} style={styles.desc}>
            {des}
          </Text>
        )}

        {/* Engagement Stats */}
        <View style={styles.engagementStats}>
          <View style={styles.statItem}>
            <Icons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={14} 
              color={isLiked ? "#ff6b6b" : "#878787"} 
            />
            <Text adjustsFontSizeToFit style={[styles.statText, isLiked && styles.likedStatText]}>
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
            <Text adjustsFontSizeToFit style={styles.statText}>{formatDate(time)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <View style={styles.iconRow}>
            <TouchableOpacity
              onPress={toggleLike}
              style={[styles.iconBtn, isLiked && styles.likedBtn]}>
              <Icons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={20} 
                color={isLiked ? "#ff6b6b" : "#fff"} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handlePostPress}
              style={styles.iconBtn}>
              <Icons name="chatbubble-outline" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity 
            onPress={()=>sharePost(post_id)}
            style={styles.iconBtn}>
              <Icons name="share-social-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIcon}>
              <Icons name="trash-outline" size={50} color="#ff6b6b" />
            </View>
            
            <Text adjustsFontSizeToFit style={styles.modalTitle}>Delete Post</Text>
            <Text adjustsFontSizeToFit style={styles.modalMessage}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text adjustsFontSizeToFit style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeletePost}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text adjustsFontSizeToFit style={styles.deleteButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default PostFullDetailCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1C1C1E",
    width: "95%",
    alignSelf: "center",
    borderRadius: 20,
    padding: 12,
    marginVertical: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  header: {
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

  profileTextSection: {
    marginLeft: 10,
    flex: 1,
  },

  profileImg: {
    width: 45,
    height: 45,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#424242",
  },

  username: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
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
    height: 250,
    borderRadius: 15,
    marginTop: 5,
    backgroundColor: "#2a2a2a",
  },

  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 12,
  },

  desc: {
    color: "#9a9a9a",
    fontSize: 13,
    marginTop: 5,
    lineHeight: 18,
  },

  engagementStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 12,
    marginTop: 12,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    padding: 24,
    width: "85%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalMessage: {
    color: "#878787",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#2f2f2f",
  },
  deleteButton: {
    backgroundColor: "#ff6b6b",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
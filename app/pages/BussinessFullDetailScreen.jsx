import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Share,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

const BussinessFullDetailScreen = (props) => {
  const { route } = props;
 const  businessId =
    props?. businessId || route?.params?.businessId;
  const navigation = useNavigation();
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userData, setUserData] = useState(null);
  const flatListRef = useRef(null);

  // Get business ID from route params
 
  const passedData = route?.params?.data;

  // Fetch current user
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUser(user);
    return user;
  };

  // Parse images from string or array
  const parseImages = (imagesData) => {
    if (!imagesData) return [];

    // If it's already an array
    if (Array.isArray(imagesData)) return imagesData;

    // If it's a string
    if (typeof imagesData === "string") {
      // Check if it's a JSON string
      try {
        const parsed = JSON.parse(imagesData);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Not JSON, split by comma
        if (imagesData.includes(",")) {
          return imagesData
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url);
        }
        // Single URL
        return [imagesData];
      }
    }

    return [];
  };

  // Fetch user data by user_id
  const fetchUserData = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("username, full_name, profile_image_url")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set fallback user data
      setUserData({
        username: listing?.title?.substring(0, 20) || "Equipment Seller",
        full_name: listing?.title?.substring(0, 20) || "Equipment Seller",
        profile_image_url: null,
      });
    }
  };

  const sharePost = async (business_id) => {
    const link = `https://kruto-app.netlify.app/business/${business_id}`; // ✅ correct

    await Share.share({
      message: "Kruto Business : " + link,
    });
  };

  // Fetch business listing details
  const fetchListingDetails = async () => {
    try {
      if (passedData) {
        // Use passed data if available
        const parsedData = {
          ...passedData,
          images: parseImages(passedData.images_url),
        };
        setListing(parsedData);

        // Fetch user data for the seller
        if (parsedData.created_user_id) {
          await fetchUserData(parsedData.created_user_id);
        }

        setLoading(false);
        return;
      }

      if (businessId) {
        if (!businessId && !passedData) {
  console.log("❌ businessId missing");
  setLoading(false);
  return;
}

        const { data, error } = await supabase
          .from("business_listings")
          .select("*")
          .eq("business_id", businessId)
          .single();

        if (error) throw error;

        const parsedData = {
          ...data,
          images: parseImages(data.images_url),
        };
        setListing(parsedData);

        // Fetch user data for the seller
        if (parsedData.created_user_id) {
          await fetchUserData(parsedData.created_user_id);
        }

        // Fetch comments for this listing
        await fetchComments(businessId);
      }
    } catch (error) {
      console.error("Error fetching listing:", error);
      Alert.alert("Error", "Failed to load listing details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async (postId) => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          users:user_id (
            username,
            full_name,
            profile_image_url
          )
        `,
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Add comment
  const addComment = async () => {
    if (!comment.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    if (!currentUser) {
      Alert.alert("Error", "Please login to comment");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([
          {
            post_id: businessId,
            user_id: currentUser.id,
            comment_text: comment.trim(),
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;

      // Refresh comments
      await fetchComments(businessId);
      setComment("");

      Alert.alert("Success", "Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  // Like/Unlike post
  const toggleLike = async () => {
    if (!currentUser) {
      Alert.alert("Error", "Please login to like");
      return;
    }

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", businessId)
          .eq("user_id", currentUser.id);

        if (error) throw error;
        setLiked(false);
      } else {
        // Like
        const { error } = await supabase.from("post_likes").insert([
          {
            post_id: businessId,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        setLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      Alert.alert("Error", "Failed to update like");
    }
  };

  // Save/Unsave post
  const toggleSave = async () => {
    if (!currentUser) {
      Alert.alert("Error", "Please login to save");
      return;
    }

    try {
      if (saved) {
        // Unsave
        const { error } = await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", businessId)
          .eq("user_id", currentUser.id);

        if (error) throw error;
        setSaved(false);
      } else {
        // Save
        const { error } = await supabase.from("saved_posts").insert([
          {
            post_id: businessId,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        setSaved(true);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      Alert.alert("Error", "Failed to update save");
    }
  };

  // Follow/Unfollow user
  const toggleFollow = async () => {
    if (!currentUser) {
      Alert.alert("Error", "Please login to follow");
      return;
    }

    if (!listing?.created_user_id) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUser.id)
          .eq("following_id", listing.created_user_id);

        if (error) throw error;
        setIsFollowing(false);
      } else {
        // Follow
        const { error } = await supabase.from("user_follows").insert([
          {
            follower_id: currentUser.id,
            following_id: listing.created_user_id,
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", "Failed to update follow");
    }
  };

  // Check if user has liked the post
  const checkLikeStatus = async () => {
    if (!currentUser || !businessId) return;

    try {
      const { data, error } = await supabase
        .from("post_likes")
        .select("*")
        .eq("post_id", businessId)
        .eq("user_id", currentUser.id)
        .single();

      if (!error && data) {
        setLiked(true);
      }
    } catch (error) {
      // User hasn't liked the post
      setLiked(false);
    }
  };

  // Check if user has saved the post
  const checkSaveStatus = async () => {
    if (!currentUser || !businessId) return;

    try {
      const { data, error } = await supabase
        .from("saved_posts")
        .select("*")
        .eq("post_id", businessId)
        .eq("user_id", currentUser.id)
        .single();

      if (!error && data) {
        setSaved(true);
      }
    } catch (error) {
      setSaved(false);
    }
  };

  // Check if user is following the seller
  const checkFollowStatus = async () => {
    if (!currentUser || !listing?.created_user_id) return;

    try {
      const { data, error } = await supabase
        .from("user_follows")
        .select("*")
        .eq("follower_id", currentUser.id)
        .eq("following_id", listing.created_user_id)
        .single();

      if (!error && data) {
        setIsFollowing(true);
      }
    } catch (error) {
      setIsFollowing(false);
    }
  };

  // Format price display
  const formatPrice = () => {
    if (listing?.price_per_hour) return `₹${listing.price_per_hour}/hr`;
    if (listing?.price_per_day) return `₹${listing.price_per_day}/day`;
    if (listing?.price_per_week) return `₹${listing.price_per_week}/week`;
    return "Price on request";
  };

  // Get condition color
  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case "new":
        return "#4CAF50";
      case "like new":
        return "#8BC34A";
      case "excellent":
        return "#CDDC39";
      case "good":
        return "#FFC107";
      case "fair":
        return "#FF9800";
      case "acceptable":
        return "#FF5722";
      default:
        return "#FFD700";
    }
  };

  // Get availability color
  const getAvailabilityColor = (status) => {
    return status === "Available" ? "#4CAF50" : "#ff6b6b";
  };

  const getAvailabilityColor_type = (status) => {
    return status === "Sell" ? "#166dbd" : "#4CAF50";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle scroll to next image
  const scrollToNextImage = () => {
    if (listing?.images && currentImageIndex < listing.images.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentImageIndex + 1,
        animated: true,
      });
    }
  };

  // Handle scroll to previous image
  const scrollToPrevImage = () => {
    if (currentImageIndex > 0) {
      flatListRef.current.scrollToIndex({
        index: currentImageIndex - 1,
        animated: true,
      });
    }
  };

  // Render image item for FlatList
  const renderImageItem = ({ item }) => {
    // Check if the image URL is valid
    if (!item || item === "") {
      return (
        <View style={[styles.postImage, styles.noImageContainer]}>
          <Icons name="image-outline" size={60} color="#878787" />
        </View>
      );
    }

    return (
      <Image
        style={styles.postImage}
        source={{ uri: item }}
        onError={(error) =>
          console.log("Image load error:", item, error.nativeEvent.error)
        }
        defaultSource={require("../../assets/images/default-avatar.png")}
      />
    );
  };

  // Handle scroll view event to update current image index
  const onScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const width = event.nativeEvent.layoutMeasurement.width;
    if (width > 0) {
      const index = Math.round(contentOffsetX / width);
      setCurrentImageIndex(index);
    }
  };

  useEffect(() => {
  if (!businessId) return;

  getCurrentUser();
  fetchListingDetails();
}, [businessId]);

  useEffect(() => {
    if (listing && currentUser) {
      checkLikeStatus();
      checkSaveStatus();
      checkFollowStatus();
    }
  }, [listing, currentUser]);

  // Log images for debugging
  useEffect(() => {
    if (listing?.images) {
      console.log("Images array:", listing.images);
    }
  }, [listing]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3897f0" />
          <Text adjustsFontSizeToFit style={styles.loadingText}>
            Loading details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Icons name="alert-circle-outline" size={80} color="#878787" />
          <Text adjustsFontSizeToFit style={styles.errorTitle}>
            Listing not found
          </Text>
          <TouchableOpacity
            style={styles.errorBtn}
            onPress={() => navigation.goBack()}
          >
            <Text adjustsFontSizeToFit style={styles.errorBtnText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Icons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <TouchableOpacity>

          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image Gallery with Swipe */}
          <View style={styles.imageContainer}>
            {listing.images && listing.images.length > 0 ? (
              <>
                <FlatList
                  ref={flatListRef}
                  data={listing.images}
                  renderItem={renderImageItem}
                  keyExtractor={(item, index) => `image_${index}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onScroll}
                  scrollEventThrottle={16}
                  style={styles.imageSlider}
                  onScrollToIndexFailed={(info) => {
                    const wait = new Promise((resolve) =>
                      setTimeout(resolve, 500),
                    );
                    wait.then(() => {
                      flatListRef.current?.scrollToIndex({
                        index: info.index,
                        animated: true,
                      });
                    });
                  }}
                />

                {/* Image Navigation Buttons */}
                {listing.images.length > 1 && (
                  <>
                    {currentImageIndex > 0 && (
                      <TouchableOpacity
                        style={[styles.navButton, styles.prevButton]}
                        onPress={scrollToPrevImage}
                      >
                        <Icons name="chevron-back" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                    {currentImageIndex < listing.images.length - 1 && (
                      <TouchableOpacity
                        style={[styles.navButton, styles.nextButton]}
                        onPress={scrollToNextImage}
                      >
                        <Icons name="chevron-forward" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {/* Image Counter */}
                <View style={styles.imageCounter}>
                  <Text adjustsFontSizeToFit style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {listing.images.length}
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.noImageContainer}>
                <Icons name="image-outline" size={60} color="#878787" />
                <Text adjustsFontSizeToFit style={styles.noImageText}>
                  No image available
                </Text>
              </View>
            )}
          </View>

          {/* Main Content Card */}
          <View style={styles.contentCard}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("oup", {
                    user_id: listing.created_user_id,
                  });
                }}
                style={styles.profileSection}
              >
                <Image
                  style={styles.profileImg}
                  source={
                    userData?.profile_image_url
                      ? { uri: userData.profile_image_url }
                      : require("../../assets/images/default-avatar.png")
                  }
                />
                <View style={styles.profileTextSection}>
                  <Text adjustsFontSizeToFit style={styles.username}>
                    {userData?.full_name ||
                      listing?.title?.substring(0, 20) ||
                      "Equipment Seller"}
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.userHandle}>
                    @
                    {userData?.username ||
                      listing?.created_user_id?.substring(0, 8) ||
                      "seller"}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followingBtn]}
                onPress={toggleFollow}
              >
                <Text
                  adjustsFontSizeToFit
                  style={[
                    styles.followText,
                    isFollowing && styles.followingText,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Price and Availability Row */}
            <View style={styles.priceRow}>
              <View>
                <Text adjustsFontSizeToFit style={styles.priceLabel}>
                  Rental Price
                </Text>
                <Text adjustsFontSizeToFit style={styles.price}>
                  {formatPrice()}
                </Text>
              </View>
              <View
                style={[
                  styles.availabilityBadge,
                  {
                    backgroundColor: getAvailabilityColor(listing.is_available),
                  },
                ]}
              >
                <Icons
                  name={
                    listing.is_available === "Available"
                      ? "checkmark-circle"
                      : "time"
                  }
                  size={16}
                  color="#fff"
                />
                <Text adjustsFontSizeToFit style={styles.availabilityText}>
                  {listing.is_available || "Available"}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.availabilityBadge_type,
                { backgroundColor: getAvailabilityColor_type(listing.type) },
              ]}
            >
              <Icons
                name={
                  listing.is_available === "Sell" ? "checkmark-circle" : "time"
                }
                size={16}
                color="#fff"
              />
              <Text adjustsFontSizeToFit style={styles.availabilityText_type}>
                {listing.type || "sell"}
              </Text>
            </View>

            {/* Title and Description */}
            <Text adjustsFontSizeToFit style={styles.title}>
              {listing.title}
            </Text>
            <Text adjustsFontSizeToFit style={styles.desc}>
              {listing.description || "No description available"}
            </Text>

            {/* Key Details Grid */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Icons name="pricetag" size={18} color="#3897f0" />
                <View>
                  <Text adjustsFontSizeToFit style={styles.detailLabel}>
                    Category
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.detailValue}>
                    {listing.category || "General"}
                  </Text>
                </View>
              </View>

              {/*} <View style={styles.detailItem}>
                <Icons name="star" size={18} color="#FFD700" />
                <View>
                  <Text adjustsFontSizeToFit style={styles.detailLabel}>Rating</Text>
                  <Text adjustsFontSizeToFit style={styles.detailValue}>4.5/5.0</Text>
                </View>
              </View>*/}

              <View style={styles.detailItem}>
                <Icons name="location" size={18} color="#ff6b6b" />
                <View>
                  <Text style={styles.detailLabel}>
                    Location
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.detailValue}>
                    {listing.city || "Location"}{" "}
                    {listing.state ? `, ${listing.state}` : ""}
                  </Text>
                </View>
              </View>

          


              <View style={styles.detailItem}>
                <Icons
                  name="checkbox"
                  size={18}
                  color={getConditionColor(listing.condition)}
                />
                <View>
                  <Text adjustsFontSizeToFit style={styles.detailLabel}>
                    Condition
                  </Text>
                  <Text
                    adjustsFontSizeToFit
                    style={[
                      styles.detailValue,
                      { color: getConditionColor(listing.condition) },
                    ]}
                  >
                    {listing.condition || "Not specified"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Specifications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specifications</Text>
              {listing.brand && (
                <View style={styles.specRow}>
                  <Text adjustsFontSizeToFit style={styles.specLabel}>
                    Brand
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.specValue}>
                    {listing.brand}
                  </Text>
                </View>
              )}
              {listing.model && (
                <View style={styles.specRow}>
                  <Text adjustsFontSizeToFit style={styles.specLabel}>
                    Model
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.specValue}>
                    {listing.model}
                  </Text>
                </View>
              )}
              {listing.year && (
                <View style={styles.specRow}>
                  <Text adjustsFontSizeToFit style={styles.specLabel}>
                    Year
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.specValue}>
                    {listing.year}
                  </Text>
                </View>
              )}
              {listing.security_deposit && (
                <View style={styles.specRow}>
                  <Text adjustsFontSizeToFit style={styles.specLabel}>
                    Security Deposit
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.specValue}>
                    ₹{listing.security_deposit}
                  </Text>
                </View>
              )}
              {listing.minimum_rental_period && (
                <View style={styles.specRow}>
                  <Text adjustsFontSizeToFit style={styles.specLabel}>
                    Min. Rental Period
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.specValue}>
                    {listing.minimum_rental_period}
                  </Text>
                </View>
              )}
              {listing.serial_number && (
                <View style={styles.specRow}>
                  <Text adjustsFontSizeToFit style={styles.specLabel}>
                    Serial Number
                  </Text>
                  <Text adjustsFontSizeToFit style={styles.specValue}>
                    {listing.serial_number}
                  </Text>
                </View>
              )}
            </View>

            {/* Condition Notes */}
            {listing.condition_note && (
              <View style={styles.section}>
                <Text adjustsFontSizeToFit style={styles.sectionTitle}>
                  Condition Notes
                </Text>
                <Text adjustsFontSizeToFit style={styles.conditionNote}>
                  {listing.condition_note}
                </Text>
              </View>
            )}

            {/* Special Instructions */}
            {listing.special_instruction && (
              <View style={styles.section}>
                <Text adjustsFontSizeToFit style={styles.sectionTitle}>
                  Special Instructions
                </Text>
                <Text adjustsFontSizeToFit style={styles.specialInstruction}>
                  {listing.special_instruction}
                </Text>
              </View>
            )}

            {/* Terms & Conditions */}
            {listing.terms_condition && (
              <View style={styles.section}>
                <Text adjustsFontSizeToFit style={styles.sectionTitle}>
                  Terms & Conditions
                </Text>
                <Text adjustsFontSizeToFit style={styles.termsText}>
                  {listing.terms_condition}
                </Text>
              </View>
            )}

            {/* Contact Information (Collapsible) */}
            <TouchableOpacity
              style={styles.contactHeader}
              onPress={() => setShowContactInfo(!showContactInfo)}
            >
              <View style={styles.contactHeaderLeft}>
                <Icons name="call" size={20} color="#3897f0" />
                <Text adjustsFontSizeToFit style={styles.contactHeaderText}>
                  Contact Information
                </Text>
              </View>
              <Icons
                name={showContactInfo ? "chevron-up" : "chevron-down"}
                size={20}
                color="#878787"
              />
            </TouchableOpacity>

            {showContactInfo && (
              <View style={styles.contactInfo}>
                {listing.phone_number && (
                  <TouchableOpacity style={styles.contactRow}>
                    <Icons name="call-outline" size={18} color="#3897f0" />
                    <Text adjustsFontSizeToFit style={styles.contactText}>
                      {listing.phone_number}
                    </Text>
                  </TouchableOpacity>
                )}
                {listing.email && (
                  <TouchableOpacity style={styles.contactRow}>
                    <Icons name="mail-outline" size={18} color="#3897f0" />
                    <Text adjustsFontSizeToFit style={styles.contactText}>
                      {listing.email}
                    </Text>
                  </TouchableOpacity>
                )}
                {listing.full_address && (
                  <View style={styles.contactRow}>
                    <Icons name="location-outline" size={18} color="#3897f0" />
                    <Text adjustsFontSizeToFit style={styles.contactText}>
                      {listing.full_address}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <View style={styles.iconRow}>
                <TouchableOpacity
                  onPress={() => sharePost(listing.business_id)}
                  style={styles.iconBtn}
                >
                  <Icons
                    name="share-social-outline"
                    size={24}
                    color="#878787"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Rental CTA */}
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("oup", { user_id: listing.created_user_id })
              }
              style={styles.rentNowBtn}
            >
              <Text adjustsFontSizeToFit style={styles.rentNowText}>
                Seller Profile
              </Text>
              <Icons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default BussinessFullDetailScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#878787",
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 24,
  },
  errorBtn: {
    backgroundColor: "#3897f0",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  errorBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#1C1C1E",
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    position: "relative",
    backgroundColor: "#1C1C1E",
  },
  imageSlider: {
    width: "100%",
    height: "100%",
  },
  postImage: {
    width: width,
    height: 300,
    resizeMode: "cover",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  prevButton: {
    left: 10,
  },
  nextButton: {
    right: 10,
  },
  imageCounter: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  noImageContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#878787",
    marginTop: 12,
  },
  contentCard: {
    backgroundColor: "#1C1C1E",
    padding: 16,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  profileHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3897f0",
  },
  followingBtn: {
    backgroundColor: "#3897f0",
  },
  followText: {
    color: "#3897f0",
    fontSize: 13,
    fontWeight: "600",
  },
  followingText: {
    color: "#fff",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
  },
  priceLabel: {
    color: "#878787",
    fontSize: 12,
    marginBottom: 4,
  },
  price: {
    color: "#4CAF50",
    fontSize: 28,
    fontWeight: "700",
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  availabilityBadge_type: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 10,
  },
  availabilityText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  availabilityText_type: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 22,
    marginBottom: 8,
  },
  desc: {
    color: "#e0e0e0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  detailLabel: {
    color: "#878787",
    fontSize: 11,
  },
  detailValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a3a",
  },
  specLabel: {
    color: "#878787",
    fontSize: 13,
  },
  specValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  conditionNote: {
    color: "#e0e0e0",
    fontSize: 13,
    lineHeight: 18,
  },
  specialInstruction: {
    color: "#e0e0e0",
    fontSize: 13,
    lineHeight: 18,
  },
  termsText: {
    color: "#e0e0e0",
    fontSize: 13,
    lineHeight: 18,
  },
  contactHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    marginBottom: 12,
  },
  contactHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactHeaderText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  contactInfo: {
    padding: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    color: "#3897f0",
    fontSize: 14,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  iconRow: {
    flexDirection: "row",
    gap: 20,
  },
  iconBtn: {
    backgroundColor: "#2f2f2f",
    width: 285,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  likedBtn: {
    backgroundColor: "#ff6b6b20",
  },
  savedBtn: {
    backgroundColor: "#FFD70020",
  },
  rentNowBtn: {
    backgroundColor: "#3897f0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    marginBottom: 20,
  },
  rentNowText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  commentsSection: {
    padding: 16,
    backgroundColor: "#1C1C1E",
    marginTop: 10,
    borderRadius: 24,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  commentsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  commentCount: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  commentCountText: {
    color: "#3897f0",
    fontSize: 12,
    fontWeight: "500",
  },
  commentContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentProfileImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  commentTime: {
    color: "#878787",
    fontSize: 11,
  },
  commentText: {
    color: "#e0e0e0",
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#2f2f2f",
    borderRadius: 25,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
  },
});

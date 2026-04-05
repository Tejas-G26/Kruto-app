import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Share,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

// Use existing images from your project
const DEFAULT_PRODUCT_IMAGE = {
  uri: "https://iili.io/BzziePs.md.png",
};

const BussinessListedScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Get current user
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setUserId(user.id);
    return user;
  };

  // Fetch user's business listings
  const fetchUserListings = async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from("business_listings")
        .select("*")
        .eq("created_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsedData = data.map((item) => ({
        ...item,
        images: item.images_url ? item.images_url.split(",") : [],
      }));

      setListings(parsedData);
    } catch (error) {
      console.error("Error fetching user listings:", error);
      Alert.alert("Error", "Failed to load your listings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserListings();
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserListings();
  }, [userId]);

  // Handle edit listing
  const handleEdit = (listing) => {
    setShowOptionsModal(false);
    // Navigate to edit form with listing data
    navigation.navigate("business-form", {
      editMode: true,
      listingData: listing,
    });
  };

  const sharePost = async (business_id) => {
    const link = `https://kruto-app.netlify.app/business/${business_id}`; // ✅ correct

    await Share.share({
      message: "Kruto Business : " + link,
    });
  };

  // Handle delete listing
  const handleDelete = async (listing) => {
    Alert.alert(
      "Delete Listing",
      `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Verify user is the creator
              if (listing.created_user_id !== userId) {
                Alert.alert(
                  "Error",
                  "You don't have permission to delete this listing",
                );
                return;
              }

              // Delete from database
              const { error } = await supabase
                .from("business_listings")
                .delete()
                .eq("business_id", listing.business_id)
                .eq("created_user_id", userId); // Extra security check

              if (error) throw error;

              // Update local state
              setListings((prevListings) =>
                prevListings.filter(
                  (item) => item.business_id !== listing.business_id,
                ),
              );

              //Alert.alert("Success", "Listing deleted successfully");
              setShowOptionsModal(false);
            } catch (error) {
              console.error("Error deleting listing:", error);
              Alert.alert(
                "Error",
                "Failed to delete listing. Please try again.",
              );
            }
          },
        },
      ],
    );
  };

  // Get primary price display
  const getPrimaryPrice = (item) => {
    const type = item?.type?.toLowerCase()?.trim();

    const selling = Number(item?.selling_price);
    const hour = Number(item?.price_per_hour);
    const day = Number(item?.price_per_day);
    const week = Number(item?.price_per_week);

    // ✅ SELL
    if (type === "sell") {
      if (selling > 0) {
        return { value: selling, unit: null };
      }
      return { value: "None", unit: null }; // ✅ show None
    }

    // ✅ RENT
    if (type === "rent") {
      if (hour > 0) return { value: hour, unit: "hr" };
      if (day > 0) return { value: day, unit: "day" };
      if (week > 0) return { value: week, unit: "week" };

      return { value: "None", unit: null }; // ✅ show None
    }

    return { value: "None", unit: null };
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
      default:
        return "#FFD700";
    }
  };

  // Get availability status with color
  const getAvailabilityStatus = (status) => {
    const isAvailable = status === "Available";
    return {
      text: isAvailable ? "Available" : "Booked",
      color: isAvailable ? "#4CAF50" : "#FF6B6B",
      icon: isAvailable ? "checkmark-circle" : "time",
    };
  };

  // Business Card Component with Ellipsis Menu
  const BusinessCard = ({ item }) => {
    const primaryPrice = getPrimaryPrice(item);
    const availability = getAvailabilityStatus(item.is_available);
    const conditionColor = getConditionColor(item.condition);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate("BusinessDetails", {
            businessId: item.business_id,
            data: item,
          })
        }
        activeOpacity={0.95}
      >
        {/* Image Section with Overlay */}
        <View style={styles.imageContainer}>
          <Image
            style={styles.mainImage}
            source={
              item.images?.[0] ? { uri: item.images[0] } : DEFAULT_PRODUCT_IMAGE
            }
            resizeMode="cover"
          />

          {/* Availability Badge Overlay */}
          <View
            style={[
              styles.availabilityOverlay,
              { backgroundColor: availability.color },
            ]}
          >
            <Icons name={availability.icon} size={12} color="#fff" />
            <Text adjustsFontSizeToFit style={styles.availabilityOverlayText}>
              {availability.text}
            </Text>
          </View>

          <View style={styles.priceContainer}>
            {primaryPrice && (
              <View style={styles.priceTag}>
                {primaryPrice.value !== "₹None" && (
                  <Text style={styles.priceTagCurrency}>₹</Text>
                )}

                <Text adjustsFontSizeToFit style={styles.priceTagValue}>
                  {primaryPrice.value}
                </Text>

                {primaryPrice.unit && primaryPrice.value !== "₹None" && (
                  <Text adjustsFontSizeToFit style={styles.priceTagUnit}>
                    /{primaryPrice.unit}
                  </Text>
                )}
              </View>
            )}

            {primaryPrice && (
              <View>
                {item.type && (
                  <View style={styles.priceTag_type}>
                    <Text style={styles.priceTagValue}>{item.type}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Ellipsis Menu Button - Top Right Corner */}
          <TouchableOpacity
            style={styles.ellipsisButton}
            onPress={() => {
              setSelectedListing(item);
              setShowOptionsModal(true);
            }}
          >
            <Icons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text adjustsFontSizeToFit style={styles.title} numberOfLines={1}>
                {item.title}
              </Text>
              {item.condition && (
                <View
                  style={[
                    styles.conditionBadge,
                    { backgroundColor: conditionColor + "20" },
                  ]}
                >
                  <Icons
                    name="checkbox-outline"
                    size={12}
                    color={conditionColor}
                  />
                  <Text
                    adjustsFontSizeToFit
                    style={[styles.conditionText, { color: conditionColor }]}
                  >
                    {item.condition}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {item.description || "No description available"}
          </Text>

          {/* Location & Category */}
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <Icons name="location-outline" size={14} color="#3897f0" />
              <Text adjustsFontSizeToFit style={styles.infoChipText}>
                {item.city || "Location"} {item.state ? `, ${item.state}` : ""}
              </Text>
            </View>

            {item.category && (
              <View style={styles.infoChip}>
                <Icons name="pricetag-outline" size={14} color="#3897f0" />
                <Text adjustsFontSizeToFit style={styles.infoChipText}>
                  {item.category}
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <Icons name="time-outline" size={12} color="#878787" />
              <Text adjustsFontSizeToFit style={styles.timeText}>
                {item.created_at
                  ? new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Recently"}
              </Text>
            </View>

            <View style={styles.footerRight}>
              <TouchableOpacity
                onPress={() => sharePost(item.business_id)}
                style={styles.iconButton}
              >
                <Icons name="share-social-outline" size={16} color="#878787" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading Screen
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color="#3897f0" />
          <Text adjustsFontSizeToFit style={styles.loadingText}>
            Loading your listings...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.logoSection}>
            <View>
              <Text adjustsFontSizeToFit style={styles.headerTitle}>
                My Listings
              </Text>
              <Text adjustsFontSizeToFit style={styles.headerSubtitle}>
                {listings.length} {listings.length === 1 ? "item" : "items"}{" "}
                posted
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate("BusinessForm")}
            style={styles.addButton}
          >
            <Icons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Listings */}
      <ScrollView
        style={styles.feed}
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
        {listings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Icons name="cube-outline" size={80} color="#2f2f2f" />
            </View>
            <Text adjustsFontSizeToFit style={styles.emptyTitle}>
              No listings yet
            </Text>
            <Text adjustsFontSizeToFit style={styles.emptyText}>
              You haven't posted any listings. Start by creating your first
              listing!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate("BusinessForm")}
            >
              <Text adjustsFontSizeToFit style={styles.emptyButtonText}>
                Create Listing
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.resultHeader}>
              <Text adjustsFontSizeToFit style={styles.resultCount}>
                Your listings
              </Text>
            </View>
            {listings.map((item) => (
              <BusinessCard key={item.business_id} item={item} />
            ))}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Options Modal */}
      <Modal
        transparent={true}
        visible={showOptionsModal}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowOptionsModal(false); // ✅ CLOSE FIRST
                navigation.navigate("EditBusiness", {
                  businessId: selectedListing.business_id,
                  listingData: selectedListing,
                });
              }}
            >
              <Icons name="create-outline" size={24} color="#3897f0" />
              <Text adjustsFontSizeToFit style={styles.modalOptionText}>
                Edit Listing
              </Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity
              style={[styles.modalOption, styles.deleteOption]}
              onPress={() => selectedListing && handleDelete(selectedListing)}
            >
              <Icons name="trash-outline" size={24} color="#FF6B6B" />
              <Text
                adjustsFontSizeToFit
                style={[styles.modalOptionText, styles.deleteText]}
              >
                Delete Listing
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

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
  loadingContent: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#878787",
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3897f0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    color: "#878787",
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  feed: {
    flex: 1,
  },
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    color: "#878787",
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  availabilityOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  availabilityOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  ellipsisButton: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  priceTag: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceTagCurrency: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 2,
  },
  priceTagValue: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "800",
  },
  priceTagUnit: {
    color: "#878787",
    fontSize: 12,
    marginLeft: 2,
  },
  contentSection: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 8,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  conditionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  description: {
    color: "#9a9a9a",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  infoChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(56,151,240,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 5,
  },
  infoChipText: {
    color: "#3897f0",
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  timeText: {
    color: "#878787",
    fontSize: 11,
  },
  footerRight: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyText: {
    color: "#878787",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#3897f0",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 80,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    width: width - 80,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  modalOptionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteOption: {
    // No additional styles needed
  },
  deleteText: {
    color: "#FF6B6B",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  priceContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  priceTag: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceTag_type: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
});

export default BussinessListedScreen;

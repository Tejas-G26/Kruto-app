import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, TextInput, RefreshControl, ActivityIndicator,Share } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get("window");

// Use existing images from your project
const DEFAULT_PRODUCT_IMAGE = { uri: "https://iili.io/BoNMnj4.png" };

const BussinessHomeScreen = ({ navigation }) => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [user, setUser] = useState(null);
  const [userid, setUserid] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
   

  // Categories for filter
  const categories = ["All", "Rent", "Sell"];

  // Get current user
  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setUserid(user.id);
    return user;
  };

  const sharePost = async (business_id) => {
      const link = `https://kruto-app.netlify.app/business/${business_id}`; // ✅ correct
    
      await Share.share({
        message:'Kruto Business : '+ link,
      });
    };

  // Fetch business listings
  const fetchListings = async () => {
    try {
      let query = supabase
        .from('business_listings')
        .select('*')
        .order('created_at', { ascending: false });

        

      if (selectedCategory !== "All") {
        query = query.eq('type', selectedCategory);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const parsedData = data.map(item => ({
        ...item,
        images: item.images_url ? item.images_url.split(',') : []
      }));
       
      setListings(parsedData);
     
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCategoryLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
    fetchListings();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchListings();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedCategory, searchQuery]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchListings();
  }, []);

  const handleCategoryChange = (category) => {
  setSelectedCategory(category);
  setCategoryLoading(true);
};

  // Get primary price display
  const getPrimaryPrice = (item) => {
    if (item.price_per_hour) return { value: item.price_per_hour, unit: 'hour' };
    if (item.price_per_day) return { value: item.price_per_day, unit: 'day' };
    if (item.price_per_week) return { value: item.price_per_week, unit: 'week' };
    return null;
  };

  // Get condition color
  const getConditionColor = (condition) => {
    switch(condition?.toLowerCase()) {
      case 'new': return '#4CAF50';
      case 'like new': return '#8BC34A';
      case 'excellent': return '#CDDC39';
      case 'good': return '#FFC107';
      case 'fair': return '#FF9800';
      default: return '#FFD700';
    }
  };

  // Get availability status with color
  const getAvailabilityStatus = (status) => {
    const isAvailable = status === "Available";
    return {
      text: isAvailable ? "Available" : "Booked",
      color: isAvailable ? "#4CAF50" : "#FF6B6B",
      icon: isAvailable ? "checkmark-circle" : "time"
    };
  };

  // Modern Business Card Component
  const BusinessCard = ({ item }) => {
    const primaryPrice = getPrimaryPrice(item);
    const availability = getAvailabilityStatus(item.is_available);
    const conditionColor = getConditionColor(item.condition);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('bfv', { businessId: item.business_id, data: item })}
        activeOpacity={0.95}>
        
        {/* Image Section with Overlay */}
        <View style={styles.imageContainer}>
          <Image 
            style={styles.mainImage} 
            source={item.images?.[0] ? { uri: item.images[0] } : DEFAULT_PRODUCT_IMAGE}
            resizeMode="cover"
          />
          
          {/* Availability Badge Overlay */}
          <View style={[styles.availabilityOverlay, { backgroundColor: availability.color }]}>
            <Icons name={availability.icon} size={12} color="#fff" />
            <Text adjustsFontSizeToFit style={styles.availabilityOverlayText}>{availability.text}</Text>
          </View>
          

        {/* Replace the absolute positioned price tags with a row */}
<View style={styles.priceContainer}>
  {primaryPrice && (
    <View style={styles.priceTag}>
      <Text adjustsFontSizeToFit style={styles.priceTagCurrency}>₹</Text>
      <Text adjustsFontSizeToFit style={styles.priceTagValue}>{primaryPrice.value}</Text>
      <Text adjustsFontSizeToFit style={styles.priceTagUnit}>/{primaryPrice.unit}</Text>
    </View>
  )}
  
  {primaryPrice && (
    <View style={styles.priceTag_type}>
      <Text adjustsFontSizeToFit style={styles.priceTagValue}>{item.type}</Text>
    </View>
  )}
</View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
              {item.condition && (
                
                <View style={[styles.conditionBadge, { backgroundColor: conditionColor + '20' }]}>
                  <Icons name="checkbox-outline" size={12} color={conditionColor} />
                  <Text adjustsFontSizeToFit style={[styles.conditionText, { color: conditionColor }]}>
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
                {item.city || "Location"} {item.state ? `, ${item.state}` : ''}
              </Text>
            </View>
            
            {item.category && (
              <View style={styles.infoChip}>
                <Icons name="pricetag-outline" size={14} color="#3897f0" />
                <Text adjustsFontSizeToFit style={styles.infoChipText}>{item.category}</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
           

            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => navigation.navigate('bfv', { businessId: item.business_id, data: item })}>
              <Text adjustsFontSizeToFit style={styles.detailsButtonText}>View Details</Text>
              <Icons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              <Icons name="time-outline" size={12} color="#878787" />
              <Text adjustsFontSizeToFit style={styles.timeText}>
                {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recently'}
              </Text>
            </View>
            
            <View style={styles.footerRight}>
             
              <TouchableOpacity
              onPress={()=>sharePost(item.business_id)}
              style={styles.iconButton}>
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
          <Text adjustsFontSizeToFit style={styles.loadingText}>Loading listings...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            
            <View>
              <Text adjustsFontSizeToFit style={styles.headerTitle}>Business Hub</Text>
              <Text adjustsFontSizeToFit style={styles.headerSubtitle}>Find what you need</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('bu')} 
              style={styles.headerButton}>
              <Icons name="add" size={22} color="#fff" />
            </TouchableOpacity>

            {/*<TouchableOpacity 
              onPress={() => navigation.navigate('notifications')}
              style={styles.headerButton}>
              <Icons name="notifications-outline" size={22} color="#fff" />
            </TouchableOpacity>*/}
          </View>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Icons name="search" size={20} color="#878787" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search equipment, location..."
            placeholderTextColor="#878787"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
              <Icons name="close-circle" size={18} color="#878787" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive
            ]}
            onPress={() => handleCategoryChange(category)}>
            <Text adjustsFontSizeToFit style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {categoryLoading && (
  <View style={styles.categoryLoadingContainer}>
    <ActivityIndicator size="small" color="#3897f0" />
    <Text adjustsFontSizeToFit style={styles.categoryLoadingText}>Loading {selectedCategory} listings...</Text>
  </View>
)}

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
        }>
        
        {listings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Icons name="cube-outline" size={80} color="#2f2f2f" />
            </View>
            <Text adjustsFontSizeToFit style={styles.emptyTitle}>No listings found</Text>
            <Text adjustsFontSizeToFit style={styles.emptyText}>
              {searchQuery ? "Try a different search term" : "Be the first to list equipment"}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('business-form')}>
              <Text adjustsFontSizeToFit style={styles.emptyButtonText}>List Equipment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.resultHeader}>
              <Text adjustsFontSizeToFit style={styles.resultCount}>{listings.length} items found</Text>
            </View>
            {listings.map((item) => (
              <BusinessCard key={item.business_id} item={item} />
            ))}
          </>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default BussinessHomeScreen;

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
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(56,151,240,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#878787",
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    marginLeft: 12,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  categoriesScroll: {
    maxHeight: 52,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 39,
    paddingVertical: 8,
    borderRadius: 30,
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    height:40
  },
  categoryChipActive: {
    backgroundColor: "#ffffff",
    borderColor: "#fff",
    height:40
  },
  categoryText: {
    color: "#878787",
    fontSize: 14,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: "#000000",
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
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  availabilityOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
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
  priceTag_type: {
  position: "absolute",
  bottom: 12,
  left: "40%", // Or use a percentage that works for your layout
  flexDirection: "row",
  alignItems: "baseline",
  backgroundColor: "rgba(0,0,0,0.85)",
  paddingHorizontal: 12,
  paddingVertical: 1,
  borderRadius: 20,
  maxWidth: "50%", // Prevent overflow
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
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(56,151,240,0.1)",
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(56,151,240,0.3)",
  },
  messageButtonText: {
    color: "#3897f0",
    fontSize: 14,
    fontWeight: "600",
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3897f0",
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
categoryLoadingContainer: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 12,
  gap: 10,
  backgroundColor: "#1C1C1E",
  marginHorizontal: 16,
  marginVertical: 8,
  borderRadius: 12,
},
categoryLoadingText: {
  color: "#3897f0",
  fontSize: 13,
  fontWeight: "500",
},
// Remove these styles:
// priceTag_type: { position: "absolute", left: 253, ... }
});
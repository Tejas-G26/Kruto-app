import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

const CommunityHomeScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [followingIds, setFollowingIds] = useState([]);
  const [followersIds, setFollowersIds] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const[currentuserid,setCurrentuserid]=useState('');

  // 🔥 GET CURRENT USER
  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentuserid(user.id);
    return user;
    
  };



  // 🔥 FETCH USERS
  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("users").select("*");
    setUsers(data || []);
    setLoading(false);
  };

  // 🔥 FETCH FOLLOW DATA
  const fetchFollowData = async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    // following
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUser.id);

    setFollowingIds(following?.map((f) => f.following_id) || []);

    // followers
    const { data: followers } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("following_id", currentUser.id);

    setFollowersIds(followers?.map((f) => f.follower_id) || []);
  };

  useEffect(() => {
    fetchUsers();
    fetchFollowData();
  }, []);

  // 🔥 FOLLOW / UNFOLLOW
  const toggleFollow = async (userId) => {
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    if (followingIds.includes(userId)) {
      // unfollow
      await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUser.id)
        .eq("following_id", userId);

      setFollowingIds((prev) => prev.filter((id) => id !== userId));
    } else {
      // follow
      await supabase.from("user_follows").insert([
        {
          follower_id: currentUser.id,
          following_id: userId,
          created_at: new Date(),
        },
      ]);

      setFollowingIds((prev) => [...prev, userId]);
    }
  };

  // 🔥 FILTER LOGIC
  const getFilteredUsers = () => {
    let filteredUsers = users;
    
    // Apply follow filter
    if (filter === "following") {
      filteredUsers = users.filter((u) => followingIds.includes(u.user_id));
    } else if (filter === "followers") {
      filteredUsers = users.filter((u) => followersIds.includes(u.user_id));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      filteredUsers = filteredUsers.filter((u) =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Remove current user from list
    const currentUser = getCurrentUser();
    return filteredUsers.filter((u) => u.user_id !== currentUser?.id);
  };

 const renderUser = async({ item }) => {
  const isFollowing = followingIds.includes(item.user_id);
  const isFollower = followersIds.includes(item.user_id);
  

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
       navigation.navigate("oup", {
  user_id: item.user_id,
});
      }}
    >
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Image
            style={styles.userAvatar}
            source={{
              uri: item.profile_image_url || "https://via.placeholder.com/50",
            }}
          />

          <View style={styles.userDetails}>
            <Text adjustsFontSizeToFit style={styles.userName}>
              {item.full_name || item.username}
            </Text>

            <Text adjustsFontSizeToFit style={styles.userUsername}>
              @{item.username}
            </Text>

            {isFollower && !isFollowing && (
              <View style={styles.followerBadge}>
                <Text adjustsFontSizeToFit style={styles.followerBadgeText}>
                  Follows you
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* FOLLOW BUTTON */}
       
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation(); // prevents chat opening
            toggleFollow(item.user_id);
          }}
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
          ]}
        >
          <Text
          adjustsFontSizeToFit
            style={[
              styles.followButtonText,
              isFollowing && styles.followingButtonText,
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

  const getStats = () => {
    return {
      totalUsers: users.length - 1, // excluding current user
      following: followingIds.length,
      followers: followersIds.length,
    };
  };

  const stats = getStats();

  if (loading) {
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
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Text adjustsFontSizeToFit style={styles.username}>Community</Text>

          <View style={styles.headerIcons}>
            {/*<TouchableOpacity style={styles.iconCircle}>
              <Icons name="people-outline" size={20} color="#fff" />
            </TouchableOpacity>*/}

            <TouchableOpacity
              onPress={() => navigation.navigate("cc")}
              style={styles.iconCircle}>
              <Icons name="repeat" size={20} color="#fff" />
              <Text adjustsFontSizeToFit style={{color:'#fff',fontSize:10}}>Conversions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text adjustsFontSizeToFit style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text adjustsFontSizeToFit style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text adjustsFontSizeToFit style={styles.statNumber}>{stats.following}</Text>
          <Text adjustsFontSizeToFit style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statCard}>
          <Text adjustsFontSizeToFit style={styles.statNumber}>{stats.followers}</Text>
          <Text adjustsFontSizeToFit style={styles.statLabel}>Followers</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icons name="search-outline" size={20} color="#878787" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#878787"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icons name="close-circle" size={18} color="#878787" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}>
          <TouchableOpacity
            onPress={() => setFilter("all")}
            style={[styles.filterBtn, filter === "all" && styles.activeFilterBtn]}>
            <Text adjustsFontSizeToFit style={[styles.filterText, filter === "all" && styles.activeFilterText]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter("following")}
            style={[styles.filterBtn, filter === "following" && styles.activeFilterBtn]}>
            <Text adjustsFontSizeToFit style={[styles.filterText, filter === "following" && styles.activeFilterText]}>
              Following
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setFilter("followers")}
            style={[styles.filterBtn, filter === "followers" && styles.activeFilterBtn]}>
            <Text adjustsFontSizeToFit style={[styles.filterText, filter === "followers" && styles.activeFilterText]}>
              Followers
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Users List */}
      {getFilteredUsers().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icons name="people-outline" size={64} color="#2f2f2f" />
          <Text adjustsFontSizeToFit style={styles.emptyTitle}>No users found</Text>
          <Text adjustsFontSizeToFit style={styles.emptySubtitle}>
            {searchQuery ? "Try a different search term" : "No users to display"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredUsers()}
          keyExtractor={(item) => item.user_id}
          renderItem={renderUser}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.usersList}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
};

export default CommunityHomeScreen;

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
    backgroundColor: "#0F0F0F",
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  username: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    backgroundColor: "#2f2f2f",
    width: 100,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#1C1C1E",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  statCard: {
    alignItems: "center",
  },
  statNumber: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  statLabel: {
    color: "#878787",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterScrollContent: {
    gap: 12,
  },
  filterBtn: {
    paddingHorizontal: 26,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  activeFilterBtn: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  filterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  activeFilterText: {
    color: "#000",
  },
  usersList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 100,
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#3897f0",
    backgroundColor: "#2f2f2f",
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  userUsername: {
    color: "#878787",
    fontSize: 13,
    marginTop: 2,
  },
  followerBadge: {
    backgroundColor: "#2f2f2f",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  followerBadgeText: {
    color: "#878787",
    fontSize: 10,
    fontWeight: "500",
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#3897f0",
    minWidth: 90,
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: "#2f2f2f",
    borderWidth: 1,
    borderColor: "#3897f0",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#3897f0",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#878787",
    fontSize: 14,
    marginTop: 8,
  },
});
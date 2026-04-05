import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  TextInput,
  Animated,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { supabase } from "../../lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import CryptoJS from "crypto-js";

const { width } = Dimensions.get("window");

const SECRET_KEY = process.env.EXPO_PUBLIC_SECRET_KEY;

const ChatsConversion = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const isMountedRef = useRef(true);
  const fetchTimeoutRef = useRef(null);

  // Get current user
  const getCurrentUser = useCallback(async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }, []);

  // 🔐 DECRYPT FUNCTION
  const decryptMessage = useCallback((cipherText) => {
    if (!cipherText) return "";
    try {
      const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || cipherText;
    } catch (e) {
      console.log("Decrypt error:", e);
      return cipherText;
    }
  }, []);

  // Format time
  const formatChatTime = useCallback((timestamp) => {
    if (!timestamp) return "";

    let d;

    try {
      if (typeof timestamp === "string") {
        const iso = timestamp.replace(" ", "T");
        d = new Date(iso + "Z");
      } else {
        d = new Date(timestamp);
      }

      if (isNaN(d.getTime())) return "";

      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;

      if (diffHours < 24 && d.toDateString() === now.toDateString()) {
        return `${diffHours}h ago`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      if (d.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }

      if (diffDays < 7) return `${diffDays}d ago`;

      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  }, []);

  // Fetch chats with improved error handling
  const fetchChats = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const user = await getCurrentUser();
      if (!user?.id) {
        if (isMountedRef.current) {
          setChats([]);
          setFilteredChats([]);
          setIsLoading(false);
        }
        return;
      }

      const currentUserIdValue = user.id;
      setCurrentUserId(currentUserIdValue);

      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `user1_id.eq.${currentUserIdValue},user2_id.eq.${currentUserIdValue}`,
        );

      if (convError) {
        console.error("Error fetching conversations:", convError);
        if (isMountedRef.current) {
          setChats([]);
          setFilteredChats([]);
        }
        return;
      }

      if (!conversations?.length) {
        if (isMountedRef.current) {
          setChats([]);
          setFilteredChats([]);
        }
        return;
      }

      // Process conversations in batches to avoid overwhelming the system
      const batchSize = 10;
      const chatList = [];

      for (let i = 0; i < conversations.length; i += batchSize) {
        const batch = conversations.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map(async (conv) => {
            const otherUserId =
              conv.user1_id === currentUserIdValue
                ? conv.user2_id
                : conv.user1_id;

            const [userResult, messageResult] = await Promise.allSettled([
              supabase
                .from("users")
                .select(
                  "full_name, username, profile_image_url, is_online, last_seen",
                )
                .eq("user_id", otherUserId)
                .single(),
              supabase
                .from("messages")
                .select("message_text, created_at")
                .eq("conversation_id", conv.conversation_id)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
            ]);

            const userData =
              userResult.status === "fulfilled" ? userResult.value.data : null;
            const messageData =
              messageResult.status === "fulfilled"
                ? messageResult.value.data
                : null;

            return {
              conversationId: conv.conversation_id,
              userId: otherUserId,
              user: userData,
              lastMessage: messageData?.message_text
                ? decryptMessage(messageData.message_text)
                : "",
              lastTime: messageData?.created_at || conv.created_at,
            };
          }),
        );

        const validResults = batchResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value)
          .filter((chat) => chat.user !== null);

        chatList.push(...validResults);
      }

      // Sort chats by last message time
      const validChats = chatList.sort(
        (a, b) => new Date(b.lastTime) - new Date(a.lastTime),
      );

      if (isMountedRef.current) {
        setChats(validChats);
        setFilteredChats(validChats);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
      if (isMountedRef.current) {
        Alert.alert("Error", "Failed to load conversations. Please try again.");
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, [getCurrentUser, decryptMessage]);

  // Setup realtime subscription with proper error handling
  const setupRealtimeSubscription = useCallback(() => {
    if (!currentUserId) return;

    // Clean up existing subscription if any
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    try {
      // Create and subscribe to the channel with proper order
      const channel = supabase.channel("chat-list");

      // Add postgres_changes before subscribing
      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${currentUserId}`,
          },
          (payload) => {
            if (!isMountedRef.current) return;

            // Debounce fetch to avoid multiple rapid updates
            if (fetchTimeoutRef.current) {
              clearTimeout(fetchTimeoutRef.current);
            }
            fetchTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                fetchChats();
              }
            }, 500);
          },
        )
        .subscribe((status, err) => {
          if (err) {
            console.error("Realtime subscription error:", err);
          } else if (status === "SUBSCRIBED") {
            console.log("Realtime subscription established");
          }
        });

      realtimeChannelRef.current = channel;
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
    }
  }, [currentUserId, fetchChats]);

  // Fetch on focus
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats]),
  );

  // Setup realtime subscription when currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      setupRealtimeSubscription();
    }

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [currentUserId, setupRealtimeSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Search filter with memoization
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = chats.filter(
        (chat) =>
          chat.user?.full_name?.toLowerCase().includes(query) ||
          chat.user?.username?.toLowerCase().includes(query),
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  // Toggle search
  const toggleSearch = useCallback(() => {
    if (isSearchVisible) {
      Animated.timing(searchAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        setIsSearchVisible(false);
        setSearchQuery("");
      });
    } else {
      setIsSearchVisible(true);
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        inputRef.current?.focus();
      });
    }
  }, [isSearchVisible, searchAnim]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, []);

  // Check if user is online
  const isOnline = (user) => {
    if (!user) return false;

    // If explicitly online
    if (user.is_online) return true;

    // Check last seen (fallback)
    if (!user.last_seen) return false;

    const diff = (Date.now() - new Date(user.last_seen)) / 1000;

    return diff < 120; // 2 min = still "online"
  };

  const getLastSeenText = (user) => {
    if (!user?.last_seen) return "";

    if (user.is_online) return "Active now";

    const diff = Math.floor((Date.now() - new Date(user.last_seen)) / 60000);

    if (diff < 1) return "Active now";
    if (diff < 60) return `Last seen ${diff} min ago`;

    const hours = Math.floor(diff / 60);
    if (hours < 24) return `Last seen ${hours}h ago`;

    return new Date(user.last_seen).toLocaleDateString();
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
  }, [fetchChats]);

  // Navigate to chat
  const navigateToChat = useCallback(
    (item) => {
      navigation.navigate("Chat", {
        currentUserId,
        otherUserId: item.userId,
        conversationId: item.conversationId,
      });
    },
    [currentUserId, navigation],
  );

  // Memoized render item
  const renderItem = useCallback(
    ({ item, index }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.chatItem, index === 0 && styles.firstChatItem]}
        onPress={() => navigateToChat(item)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                item.user?.profile_image_url ||
                "https://iili.io/BoNMnj4.md.png",
            }}
            style={styles.avatar}
            onError={(error) => console.log("Image loading error:", error)}
          />
          {isOnline(item.user) && (
            <View style={[styles.statusIndicator, styles.onlineStatus]} />
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.nameContainer}>
            <Text adjustsFontSizeToFit style={styles.name} numberOfLines={1}>
              {item.user?.full_name || "Unknown User"}
            </Text>
            <Text
              adjustsFontSizeToFit
              style={styles.username}
              numberOfLines={1}
            >
              @{item.user?.username || "unknown"}
            </Text>
          </View>
          <Text style={styles.message} numberOfLines={1}>
            {item.lastMessage || "No messages yet"}
          </Text>
        </View>

        <View style={styles.timeContainer}>
          <Text adjustsFontSizeToFit style={styles.timeText}>
            {formatChatTime(item.lastTime)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [formatChatTime, isOnline, navigateToChat],
  );

  // Memoized empty component
  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Icons name="chatbubbles-outline" size={50} color="#8E8E93" />
        </View>
        <Text adjustsFontSizeToFit style={styles.emptyStateTitle}>
          No conversations yet
        </Text>
        <Text adjustsFontSizeToFit style={styles.emptyStateText}>
          Start a conversation by finding friends to chat with
        </Text>
      </View>
    ),
    [],
  );

  // Memoized key extractor
  const keyExtractor = useCallback(
    (item) => item.conversationId.toString(),
    [],
  );

  // Animation interpolations
  const searchBarWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width - 120],
  });

  const searchBarOpacity = searchAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const headerTitleOpacity = searchAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0, 0],
  });

  const headerBadgeScale = searchAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 0, 0],
  });

  if (isLoading) {
    return (
      <LinearGradient colors={["#0F0F0F", "#1A1A1A"]} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3897f0" />
            <Text adjustsFontSizeToFit style={styles.loadingText}>
              Loading conversations...
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0F0F0F", "#1A1A1A"]} style={styles.container}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.headerCenter,
              {
                opacity: headerTitleOpacity,
                transform: [{ scale: headerBadgeScale }],
              },
            ]}
            pointerEvents="none"
          >
            <Text adjustsFontSizeToFit style={styles.headerTitle}>
              Messages
            </Text>
            {filteredChats.length > 0 && (
              <View style={styles.headerBadge}>
                <Text adjustsFontSizeToFit style={styles.headerBadgeText}>
                  {filteredChats.length}
                </Text>
              </View>
            )}
          </Animated.View>

          <Animated.View
            style={[
              styles.searchContainer,
              {
                width: searchBarWidth,
                opacity: searchBarOpacity,
              },
            ]}
          >
            <View style={styles.searchInputContainer}>
              <Icons name="search-outline" size={20} color="#8E8E93" />
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder="Search messages..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}
                >
                  <Icons name="close-circle" size={18} color="#8E8E93" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          <TouchableOpacity
            style={styles.headerIcon}
            onPress={toggleSearch}
            activeOpacity={0.7}
          >
            <Icons
              name={isSearchVisible ? "close-outline" : "search-outline"}
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Chat List */}
        <FlatList
          data={filteredChats}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={ListEmptyComponent}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  chatItem: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  firstChatItem: {
    marginTop: 8,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#2C2C2E",
    backgroundColor: "#2C2C2E",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#1C1C1E",
    backgroundColor: "#FF3B30",
  },
  onlineStatus: {
    backgroundColor: "#4CD964",
  },
  chatInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  name: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: -0.3,
    marginRight: 8,
    maxWidth: "60%",
  },
  username: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "500",
    maxWidth: "35%",
  },
  message: {
    color: "#8E8E93",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  timeContainer: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  timeText: {
    color: "#8E8E93",
    fontSize: 11,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
  },
  backButton: {
    backgroundColor: "#1C1C1E",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: "#3897f0",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  headerIcon: {
    backgroundColor: "#1C1C1E",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  searchContainer: {
    overflow: "hidden",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    width: "100%",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 8,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyIconContainer: {
    backgroundColor: "#1C1C1E",
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyStateText: {
    color: "#8E8E93",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#8E8E93",
    fontSize: 14,
    marginTop: 12,
  },
});

export default ChatsConversion;

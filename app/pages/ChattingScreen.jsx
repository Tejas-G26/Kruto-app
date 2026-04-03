import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from "../../lib/supabase";

const ChattingScreen = ({ route, navigation }) => {
  const { currentUserId, otherUserId } = route.params;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [loadingChat, setLoadingChat] = useState(true);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const[isOnline,setIsOnline]=useState();
   

  const flatListRef = useRef(null);

  useEffect(() => {
    if (!otherUserId) return;

    // ✅ Initial fetch
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("users")
        .select("is_online, last_seen")
        .eq("user_id", otherUserId)
        .single();

      if (data) {
        const lastSeen = new Date(data.last_seen);
        const diff = (Date.now() - lastSeen.getTime()) / 1000;
        
        setIsOnline(data.is_online)
      
      }
    };


    
    fetchStatus();

    // ✅ Realtime listener
    const channel = supabase
      .channel("user-presence")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `user_id=eq.${otherUserId}`,
        },
        (payload) => {
          const user = payload.new;

          const lastSeen = new Date(user.last_seen);
          const diff = (Date.now() - lastSeen.getTime()) / 1000;

          setIsOnline(diff < 30);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [otherUserId]);

  


  // ✅ Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // ✅ Format time

   // ✅ Format time (FIXED for timezone issues)
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  // Parse the timestamp and treat it as local time
  // Convert from '2026-03-30 14:43:05.852256' to proper date
  let d;
  if (typeof timestamp === 'string') {
    // Replace space with T to make it ISO format, but keep as local
    const localTimestamp = timestamp.replace(' ', 'T');
    d = new Date(localTimestamp);
    
    // If the timestamp doesn't have timezone, adjust for local timezone
    if (!timestamp.includes('Z') && !timestamp.includes('+')) {
      // Get the timezone offset in minutes
      const timezoneOffset = new Date().getTimezoneOffset();
      // Adjust the date to account for local timezone
      d = new Date(d.getTime() - (timezoneOffset * 60000));
    }
  } else {
    d = new Date(timestamp);
  }
  
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(d.getTime())) return 'Invalid date';
  
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // For messages sent in the last minute
  if (diffMins < 1) return 'Just now';
  
  // For messages sent in the last hour
  if (diffMins < 60) return `${diffMins}m ago`;
  
  // For messages sent today but more than an hour ago
  if (diffHours < 24 && d.getDate() === now.getDate()) {
    return `${diffHours}h ago`;
  }
  
  // For messages sent yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth()) {
    return 'Yesterday';
  }
  
  // For older messages, show the date
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  // For messages older than a week, show the actual date
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

  // ✅ Format date for separator (shows "Today", "Yesterday", or full date)
// ✅ Format date for separator (FIXED for timezone issues)
const formatDateSeparator = (timestamp) => {
  if (!timestamp) return '';
  
  let d;
  if (typeof timestamp === 'string') {
    const localTimestamp = timestamp.replace(' ', 'T');
    d = new Date(localTimestamp);
    if (!timestamp.includes('Z') && !timestamp.includes('+')) {
      const timezoneOffset = new Date().getTimezoneOffset();
      d = new Date(d.getTime() - (timezoneOffset * 60000));
    }
  } else {
    d = new Date(timestamp);
  }
  
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
};


  // ✅ 1. CREATE / GET CONVERSATION (SAFE)
  useEffect(() => {
  const initChat = async () => {
    try {
      setLoadingChat(true);

      console.log("CURRENT:", currentUserId);
      console.log("OTHER:", otherUserId);

      // ✅ ENSURE BOTH USERS EXIST (THIS FIXES ERROR)
      await ensureUserExists(currentUserId);
      await ensureUserExists(otherUserId);

      // 🔥 SORT USERS
      const [userA, userB] =
        currentUserId < otherUserId
          ? [currentUserId, otherUserId]
          : [otherUserId, currentUserId];

      // check existing conversation
      let { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("user1_id", userA)
        .eq("user2_id", userB)
        .maybeSingle();

      if (error) throw error;

      // create if not exists
      if (!data) {
        const { data: newConv, error: insertError } = await supabase
          .from("conversations")
          .insert([
            {
              user1_id: userA,
              user2_id: userB,
            },
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        setConversationId(newConv.conversation_id);
      } else {
        setConversationId(data.conversation_id);
      }
    } catch (err) {
      console.log("INIT CHAT ERROR:", err.message);
    } finally {
      setLoadingChat(false);
    }
  };

  initChat();
}, []);

const ensureUserExists = async (userId) => {
  const { data } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    const { error } = await supabase.from("users").insert([
      {
        user_id: userId,
        full_name: "User",
        username: "user_" + userId.slice(0, 5),
      },
    ]);

    if (error) {
      console.log("USER INSERT ERROR:", error.message);
    }
  }
};

  // ✅ 2. LOAD MESSAGES + REALTIME
  useEffect(() => {
    if (!conversationId || loadingChat) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.log("LOAD ERROR:", error.message);
        return;
      }

      setMessages(data || []);
    };

    loadMessages();

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, loadingChat]);

  // ✅ 3. GET RECEIVER INFO
  useEffect(() => {
    const getReceiver = async () => {
      const { data } = await supabase
        .from("users")
        .select("full_name, username, profile_image_url")
        .eq("user_id", otherUserId)
        .single();

      setReceiver(data);
    };

    getReceiver();
  }, []);

  // ✅ 4. SEND MESSAGE (SAFE)
  const handleSend = async () => {
    if (!message.trim() || !conversationId) return;

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: currentUserId,
        receiver_id: otherUserId,
        message_text: message,
      },
    ]);

    if (error) {
      console.log("SEND ERROR:", error.message);
      return;
    }

    setMessage("");
  };

  // ✅ AUTO SCROLL
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // ✅ RENDER MESSAGE
 // ✅ RENDER MESSAGE (FIXED)
const renderItem = ({ item, index }) => {
  const isMe = item.sender_id === currentUserId;
  
  // FIXED: Check if this message is from a different day than the previous message
  const showDateSeparator = index === 0 || 
    new Date(messages[index - 1]?.created_at).toDateString() !== new Date(item.created_at).toDateString();

  return (
    <View>
      {/* Show date separator if needed */}
      {showDateSeparator && (
        <View style={styles.dateDivider}>
          <View style={styles.dateLine} />
          <Text adjustsFontSizeToFit style={styles.dateText}>
            {formatDateSeparator(item.created_at)}
          </Text>
          <View style={styles.dateLine} />
        </View>
      )}
      
      {/* Message bubble */}
      <View
        style={[
          styles.messageRow,
          isMe ? styles.rightAlign : styles.leftAlign,
        ]}
      >
        {!isMe && (
          <Image
            source={{ uri: receiver?.profile_image_url || 'https://iili.io/BoNMnj4.md.png' }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myBubble : styles.otherBubble,
          ]}
        >
          <Text adjustsFontSizeToFit style={styles.messageText}>{item.message_text}</Text>
          <View style={styles.messageFooter}>
            <Text adjustsFontSizeToFit style={styles.messageTime}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isMe && (
              <Icons 
                name="checkmark-done" 
                size={12} 
                color="#8e8e93" 
                style={styles.messageStatus}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

  // ✅ LOADING SCREEN
  if (loadingChat || !conversationId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <Icons name="chatbubble-ellipses" size={40} color="#007AFF" />
          </View>
          <Text adjustsFontSizeToFit style={styles.loadingText}>
            Loading conversation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>

          {receiver && (
            <TouchableOpacity 
              style={styles.headerUser}
              onPress={() => navigation.navigate("oup", { userId: otherUserId })}
            >
              
              <Image
                source={{ uri: receiver.profile_image_url || 'https://iili.io/BoNMnj4.md.png' }}
                style={styles.avatar}
                defaultSource={require('../../assets/images/default-avatar.png')}
              />
              <View style={styles.headerUserInfo}>
                <Text adjustsFontSizeToFit style={styles.name}>{receiver.full_name}</Text>
                <View style={styles.statusContainer}>
                  <Text adjustsFontSizeToFit style={styles.username}>@{receiver.username}</Text>
                </View>
                </View>
               <View>
        <Text adjustsFontSizeToFit style={{ color: isOnline ? "green" : "red" }}>
         {isOnline ? "Online" : "Offline"}
        </Text>
          </View>
            </TouchableOpacity>
          )}
        </View>

        {/* CHAT */}
        <KeyboardAvoidingView 
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.message_id.toString()}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}

            ListEmptyComponent={
  <View style={styles.emptyStateContainer}>
    <View style={styles.emptyStateIconContainer}>
      <Icons name="chatbubbles-outline" size={60} color="#8E8E93" />
    </View>
    <Text adjustsFontSizeToFit style={styles.emptyStateTitle}>No conversations yet</Text>  
  </View>
}
          />
          

          {/* INPUT */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="Type a message..."
                placeholderTextColor="#8e8e93"
                value={message}
                onChangeText={setMessage}
                style={styles.input}
                multiline
                maxLength={1000}
              />
            </View>

            <TouchableOpacity 
              onPress={handleSend}
              style={styles.sendButton}
            >
              <Icons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ChattingScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0F0F0F" 
  },

  flex: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F0F",
  },

  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1C1C1E",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  loadingText: {
    color: "#8e8e93",
    fontSize: 16,
    marginTop: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1E",
    backgroundColor: "#0F0F0F",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  headerUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },

  headerUserInfo: {
    flex: 1,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#007AFF",
  },

  name: { 
    color: "#fff", 
    fontWeight: "600", 
    fontSize: 16,
    marginBottom: 2,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CD964",
  },

  username: { 
    color: "#8e8e93", 
    fontSize: 12,
  },

  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },

  messageRow: {
    marginVertical: 4,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  rightAlign: { 
    justifyContent: "flex-end" 
  },

  leftAlign: { 
    justifyContent: "flex-start" 
  },

  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },

  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  myBubble: {
    backgroundColor: "#007AFF",
    borderBottomRightRadius: 4,
  },

  otherBubble: {
    backgroundColor: "#1C1C1E",
    borderBottomLeftRadius: 4,
  },

  messageText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 20,
  },

  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },

  messageTime: {
    color: "#c5c5c7",
    fontSize: 10,
  },

  messageStatus: {
    marginLeft: 2,
  },

  dateDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },

  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#1C1C1E",
  },

  dateText: {
    color: "#8e8e93",
    fontSize: 12,
    marginHorizontal: 12,
  },

  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0F0F0F",
    borderTopWidth: 1,
    borderTopColor: "#1C1C1E",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: Platform.OS === "ios" ? 0 : 10,
  },

  inputContainerWithKeyboard: {
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
  },

  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
  },

  inputWrapper: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    maxHeight: 100,
  },

  input: {
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
  },

  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
  },
  emptyStateContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 32,
  paddingVertical: 60,
  minHeight: 400,
},
emptyStateIconContainer: {
  backgroundColor: '#1C1C1E',
  width: 120,
  height: 120,
  borderRadius: 60,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 24,
  shadowColor: '#000',
  shadowOffset: {
    width: 0,
    height: 4,
  },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
},
emptyStateTitle: {
  color: '#fff',
  fontSize: 20,
  fontWeight: '700',
  marginBottom: 8,
  textAlign: 'center',
},
emptyStateSubtitle: {
  color: '#8E8E93',
  fontSize: 12,
  textAlign: 'center',
  lineHeight: 22,
  marginBottom: 32,
  paddingHorizontal: 20,
},
findFriendsButton: {
  flexDirection: 'row',
  backgroundColor: '#3897f0',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 25,
  alignItems: 'center',
  gap: 8,
  shadowColor: '#3897f0',
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
},
findFriendsButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: '600',
},
});
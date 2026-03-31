import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;

const UserChattingProfileCard = ({ user }) => {
  const navigation = useNavigation();
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Default user data if none provided
  const userData = user || {
    name: "Rahul D.",
    username: "rahul_d26",
    avatar: require("../../assets/images/default-avatar.png"),
    isFollowing: false,
    mutualFriends: 5
  };

  const handleFollowPress = () => {
    setIsFollowing(!isFollowing);
  };

  const handleMessagePress = () => {
    navigation.navigate('chat', { user: userData });
  };

  const handleProfilePress = () => {
    navigation.navigate('oup', { user: userData });
  };

  return (
    <TouchableOpacity
      onPress={handleProfilePress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <Image
        source={userData.avatar}
        style={styles.avatar}
        resizeMode="cover"
      />

      <View style={styles.userInfo}>
        <Text adjustsFontSizeToFit style={styles.name}>{userData.name}</Text>
        <Text adjustsFontSizeToFit style={styles.username}>@{userData.username}</Text>
        
        
         
        
      </View>

      <View style={styles.actionContainer}>
       
        <TouchableOpacity
          style={styles.messageBtn}
          onPress={handleMessagePress}
          activeOpacity={0.8}
        >
          <Icons name="chatbubble-outline" size={18} color="#ffffff" />
        </TouchableOpacity>
       
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    height: 72,
    borderRadius: 16,
    alignItems: "center",
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2C2C2E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#363636",
  },

  userInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },

  username: {
    color: "#8E8E93",
    fontSize: 12,
    marginBottom: 2,
  },

  mutualText: {
    color: "#8E8E93",
    fontSize: 11,
  },

  actionContainer: {
  
    alignItems: "center",
    gap: 8,
  },

  followBtn: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },

  followingBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
  },

  followBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  followingBtnText: {
    color: "#007AFF",
  },

  messageBtn: {
    width: 80,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2C2C2E",
    backgroundColor: "#0F0F0F",
  },
});

export default UserChattingProfileCard;
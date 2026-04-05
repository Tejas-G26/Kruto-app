import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const HomeScreenUserProfile = ({ image, color, userId, userName }) => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("OtherUserProfile", { user_id: userId })}
      style={{ alignItems: "center", marginHorizontal: 4 }}
    >
      <Image
        source={image}
        style={{
          width: 50,
          height: 50,
          borderRadius: 50,
          borderWidth: 2,
          borderColor: color,
          marginLeft: 12,
        }}
      />
      <Text
        adjustsFontSizeToFit
        style={{ color: "#fff", fontSize: 10, marginTop: 4 }}
      >
        {userName?.length > 12
          ? userName.substring(0, 10) + "..."
          : userName || "User"}
      </Text>
    </TouchableOpacity>
  );
};

export default HomeScreenUserProfile;

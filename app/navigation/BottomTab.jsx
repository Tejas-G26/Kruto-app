import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../pages/HomeScreen";
import CommunityHomeScreen from "../pages/CommunityHomeScreen";
import ProfileScreen from "../pages/ProfileScreen";
import BussinessHomeScreen from "../pages/BussinessHomeScreen";
import CreatePostScreen from "../pages/CreatePostScreen";
import { SafeAreaView } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

// 🔥 Custom Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.bottomNav}>
      {/* Home */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Home")}
        style={styles.navBtn}
      >
        <Icons
          name={state.index === 0 ? "home" : "home-outline"}
          size={22}
          color="#fff"
        />
        <Text adjustsFontSizeToFit  style={styles.label}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Community */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Community")}
        style={styles.navBtn}
      >
        <Icons
          name={state.index === 1 ? "people" : "people-outline"}
          size={22}
          color="#fff"
        />
        <Text adjustsFontSizeToFit style={styles.label}>
          Community
        </Text>
      </TouchableOpacity>

      {/* Center Add Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("CreatePost")}
        style={styles.centerAdd}
      >
        <Icons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Business */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Business")}
        style={styles.navBtn}
      >
        <Icons
          name={state.index === 2 ? "storefront" : "storefront-outline"}
          size={22}
          color="#fff"
        />
        <Text adjustsFontSizeToFit style={styles.label}>
          Business
        </Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        style={styles.navBtn}
      >
        <Icons
          name={state.index === 3 ? "person" : "person-outline"}
          size={22}
          color="#fff"
        />
        <Text adjustsFontSizeToFit style={styles.label}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// 🔥 Main Tabs
const BottomTabs = () => {
  return (
    <SafeAreaView style={{flex:1,backgroundColor:'#0F0F0F'}} edges={['bottom']}>
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Community" component={CommunityHomeScreen} />
      <Tab.Screen name="Business" component={BussinessHomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />

      {/* Hidden screen for center button */}
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarButton: () => null, // hide from tab bar
        }}
      />
    </Tab.Navigator>
    </SafeAreaView>
  );
};

export default BottomTabs;

// 🎨 Styles
const styles = StyleSheet.create({
  bottomNav: {
    width: width,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#0F0F0F",
    position: "absolute",
    bottom: 0,
    
  },

  navBtn: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    fontSize: 9,
    color: "#fff",
    marginTop: 2,
  },

  centerAdd: {
    backgroundColor: "#2a2a2a",
    width: 65,
    height: 65,
    borderRadius: 65,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -10, // floating effect
  },
});

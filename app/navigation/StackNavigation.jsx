import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "../../lib/supabase";
import NetInfo from "@react-native-community/netinfo";

// Screens
import HomeScreen from "../pages/HomeScreen";
import CreatePostScreen from "../pages/CreatePostScreen";
import ProfileScreen from "../pages/ProfileScreen";
import SettingScreen from "../pages/SettingScreen";
import EmailRegistrationScreen from "../pages/EmailRegistrationScreen";
import EmailLoginScreen from "../pages/EmailLoginScreen";
import CommunityHomeScreen from "../pages/CommunityHomeScreen";
import BussinessHomeScreen from "../pages/BussinessHomeScreen";
import OtherUserProfileScreen from "../pages/OtherUserProfileScreen";
import NotificationScreen from "../pages/NotificationScreen";
import ChattingScreen from "../pages/ChattingScreen";
import PostFullDetailScreen from "../pages/PostFullDetailScreen";
import BussinessFullDetailScreen from "../pages/BussinessFullDetailScreen";
import UserDetailForm from "../pages/UserDetailForm";
import BussinessForm from "../pages/BussinessForm";
import SavedPostScreen from "../pages/SavedPostScreen";
import BottomTab from "../navigation/BottomTab";
import UsernameSelectScreen from "../pages/UsernameSelectScreen";
import BussinessListingsScreen from "../pages/BussinessListingsScreen";
import BusinessListiningEditScreen from "../pages/BusinessListiningEditScreen";
import ChatsConversion from "../pages/ChatsConversion";
import NoInternetScreen from "../pages/NoInternetScreen";

const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(null);
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);

        if (session?.user) {
          checkUserProfile(session.user.id);
        } else {
          setNeedsUsername(null);
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔐 Get session
  const getSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setSession(session);

    if (session?.user) {
      await checkUserProfile(session.user.id);
    }

    setLoading(false);
  };

  // 🔥 REAL CHECK FROM DATABASE
  const checkUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.log("Profile error:", error.message);
        setNeedsUsername(true);
        return;
      }

      if (data?.username) {
        setNeedsUsername(false); // user complete
      } else {
        setNeedsUsername(true); // need username
      }
    } catch (err) {
      console.log("Catch error:", err.message);
      setNeedsUsername(true);
    }
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable);
    });

    return () => unsubscribe();
  }, []);

  // ⏳ Wait until everything is ready
  if (loading || (session && needsUsername === null)) return null;

  if (isConnected === false) {
    return <NoInternetScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        // AUTH
        <>
          <Stack.Screen name="Login2" component={EmailLoginScreen} />
          <Stack.Screen name="register" component={EmailRegistrationScreen} />
        </>
      ) : needsUsername ? (
        // USERNAME REQUIRED
        <>
          <Stack.Screen name="username" component={UsernameSelectScreen} />
        </>
      ) : (
        // MAIN APP
        <>
          <Stack.Screen name="MainTabs" component={BottomTab} />

          <Stack.Screen name="HomePage" component={HomeScreen} />
          <Stack.Screen name="CommunityHome" component={CommunityHomeScreen} />
          <Stack.Screen name="BusinessHome" component={BussinessHomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />

          <Stack.Screen name="CreatePost" component={CreatePostScreen} />
          <Stack.Screen name="Settings" component={SettingScreen} />
          <Stack.Screen
            name="OtherUserProfile"
            component={OtherUserProfileScreen}
          />
          <Stack.Screen name="Notifications" component={NotificationScreen} />

          <Stack.Screen name="Chat" component={ChattingScreen} />
          <Stack.Screen name="PostDetails" component={PostFullDetailScreen} />
          <Stack.Screen
            name="BusinessDetails"
            component={BussinessFullDetailScreen}
          />

          <Stack.Screen name="UserDetailsForm" component={UserDetailForm} />
          <Stack.Screen name="BusinessForm" component={BussinessForm} />

          <Stack.Screen name="SavedPosts" component={SavedPostScreen} />
          <Stack.Screen
            name="BusinessListings"
            component={BussinessListingsScreen}
          />
          <Stack.Screen
            name="EditBusiness"
            component={BusinessListiningEditScreen}
          />

          <Stack.Screen name="ChatConversation" component={ChatsConversion} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default StackNavigation;

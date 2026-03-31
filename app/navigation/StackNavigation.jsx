import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { supabase } from "../../lib/supabase";

// Screens
import HomeScreen from '../pages/HomeScreen';
import CreatePostScreen from "../pages/CreatePostScreen";
import ProfileScreen from "../pages/ProfileScreen";
import SettingScreen from "../pages/SettingScreen";
import EmailRegistrationScreen from "../pages/EmailRegistrationScreen";
import EmailLoginScreen from "../pages/EmailLoginScreen";
import OTPVerifyScreen from "../pages/OTPVerifyScreen";
import PhoneNumberScreen from "../pages/PhoneNumberScreen";
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
import BottomTab from '../navigation/BottomTab';
import UsernameSelectScreen from '../pages/UsernameSelectScreen';
import BussinessListingsScreen from '../pages/BussinessListingsScreen';
import BusinessListiningEditScreen from '../pages/BusinessListiningEditScreen'
import ChatsConversion from '../pages/ChatsConversion'
// In your navigation file
import ForgotPasswordScreen  from '../pages/ForgotPasswordScreen';
import  VerifyOTPScreen  from '../pages/VerifyOTPScreen';

// Add to your stack navigator


const Stack = createNativeStackNavigator();



const StackNavigation = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(null); // 🔥 important

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
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // 🔐 Get session
  const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();

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
        setNeedsUsername(false); // ✅ user complete
      } else {
        setNeedsUsername(true); // ❌ need username
      }

    } catch (err) {
      console.log("Catch error:", err.message);
      setNeedsUsername(true);
    }
  };

  // ⏳ Wait until everything is ready
  if (loading || (session && needsUsername === null)) return null;

  return (
 
    <Stack.Navigator screenOptions={{ headerShown: false }}  >
      
      {!session ? (
        // 🔐 AUTH
        <>
          <Stack.Screen name="Login2" component={EmailLoginScreen} />
          <Stack.Screen name="register" component={EmailRegistrationScreen} />
          {/*<Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
          <Stack.Screen name="otp" component={OTPVerifyScreen} />
          <Stack.Screen name="Phone" component={PhoneNumberScreen} />*/}
        </>
      ) : needsUsername ? (
        // 👤 USERNAME REQUIRED
        <>
          <Stack.Screen name="username" component={UsernameSelectScreen} />
        </>
      ) : (
        // 🚀 MAIN APP
        <>
          <Stack.Screen name="Main" component={BottomTab} />

          <Stack.Screen name="p" component={HomeScreen} />
          <Stack.Screen name="co" component={CommunityHomeScreen} />
          <Stack.Screen name="Buss" component={BussinessHomeScreen} />
          <Stack.Screen name="user" component={ProfileScreen} />
          <Stack.Screen name="cp" component={CreatePostScreen} />
          <Stack.Screen name="S" component={SettingScreen} />
          <Stack.Screen name="oup" component={OtherUserProfileScreen} />
          <Stack.Screen name="noti" component={NotificationScreen} />
          <Stack.Screen name="chat" component={ChattingScreen} />
          <Stack.Screen name="pfv" component={PostFullDetailScreen} />
          <Stack.Screen name="bfv" component={BussinessFullDetailScreen} />
          <Stack.Screen name="ud" component={UserDetailForm} />
          <Stack.Screen name="bu" component={BussinessForm} />
          <Stack.Screen name="sp" component={SavedPostScreen} />
          <Stack.Screen name='bl' component={BussinessListingsScreen}/>
          <Stack.Screen name='be' component={BusinessListiningEditScreen}/>
           <Stack.Screen name='cc' component={ChatsConversion}/>
        </>
      )}

    </Stack.Navigator>
   
 
  );
};

export default StackNavigation;
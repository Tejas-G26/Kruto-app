import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import Ionicons from "@react-native-vector-icons/ionicons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoInternetScreen() {
  const [loading, setLoading] = useState(false);
  const [shakeAnimation] = useState(new Animated.Value(0));

  const checkAgain = async () => {
    setLoading(true);

    // Add shake animation
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();

    const state = await NetInfo.fetch();

    // Simulate minimum loading time for better UX
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const shakeInterpolate = shakeAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ["0deg", "-5deg", "0deg", "5deg", "0deg"],
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0a0a0a",
          paddingHorizontal: 20,
        }}
      >
        {/* Animated Icon */}
        <Animated.View
          style={{
            transform: [{ rotate: shakeInterpolate }],
          }}
        >
          <View
            style={{
              width: 140,
              height: 140,
              borderRadius: 70,
              backgroundColor: "rgba(56, 151, 240, 0.1)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons name="wifi-outline" size={80} color={"#3897f0"} />
          </View>
        </Animated.View>

        {/* Main Title */}
        <Text
        adjustsFontSizeToFit
          style={{
            fontSize: 24,
            fontWeight: "700",
            color: "#ffffff",
            marginBottom: 8,
            letterSpacing: 0.5,
          }}
        >
          Connection Lost
        </Text>

        {/* Subtitle */}
        <Text
        adjustsFontSizeToFit
          style={{
            fontSize: 14,
            color: "#a3a3a3",
            textAlign: "center",
            marginBottom: 12,
            lineHeight: 20,
          }}
        >
          Please check your internet connection
        </Text>

        {/* Additional Info */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 40,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={"#a3a3a3"}
          />
          <Text adjustsFontSizeToFit style={{ fontSize: 12, color: "#a3a3a3", marginLeft: 6 }}>
            Check WiFi or Mobile Data
          </Text>
        </View>

        {/* Try Again Button */}
        <TouchableOpacity
          onPress={checkAgain}
          activeOpacity={0.8}
          style={{
            backgroundColor: loading ? "#2d6ba0" : "#3897f0",
            paddingVertical: 14,
            paddingHorizontal: 40,
            borderRadius: 30,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 180,
            shadowColor: "#3897f0",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {loading ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text adjustsFontSizeToFit style={{ color: "#fff", marginLeft: 10 }}>
                Connecting...
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="refresh-outline" size={20} color="#fff" />
              <Text
              adjustsFontSizeToFit
                style={{
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: "600",
                  marginLeft: 8,
                }}
              >
                Try Again
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <Text
        adjustsFontSizeToFit
          style={{
            fontSize: 11,
            color: "#5a5a5a",
            textAlign: "center",
            marginTop: 40,
            position: "absolute",
            bottom: 30,
          }}
        >
          Make sure you're connected to the internet{"\n"}
          and try again
        </Text>
      </View>
    </SafeAreaView>
  );
}

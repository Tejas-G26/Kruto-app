import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from "../../lib/supabase"; // adjust path

export const EmailLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 LOGIN FUNCTION
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Enter email and password");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        Alert.alert("Login Failed", error.message);
        return;
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={require("../../assets/images/Kruto_Logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text adjustsFontSizeToFit style={styles.title}>
              Welcome to <Text adjustsFontSizeToFit style={styles.brand}>Kruto</Text>
            </Text>
            <Text adjustsFontSizeToFit style={styles.subtitle}>Farming Community</Text>
            <View style={styles.descContainer}>
              <Text adjustsFontSizeToFit style={styles.desc}>
                Connect with farmers and grow together
              </Text>
            </View>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            <Text adjustsFontSizeToFit style={styles.heading}>Login to your account</Text>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Icons name="mail-outline" size={20} color="#8f8f8f" />
              </View>
              <TextInput
                placeholder="Email address"
                placeholderTextColor="#666"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Icons name="lock-closed-outline" size={20} color="#8f8f8f" />
              </View>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
                style={styles.input}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {/* Forgot Password */}
          
            {/*<TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>*/}
            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text adjustsFontSizeToFit style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            {/* Divider */}
            {/*<View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text adjustsFontSizeToFit style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>*/}
            {/* Alternative Login Options */}
            {/*<View style={styles.altButtonsContainer}>
              <TouchableOpacity style={styles.altBtn}>
                <Icons name="call-outline" size={24} color="#3897f0" />
                <Text adjustsFontSizeToFit style={styles.altText}>Phone</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.altBtn}>
                <Image
                  style={styles.googleIcon}
                  source={require("../../assets/images/google.png")}
                />
                <Text adjustsFontSizeToFitt style={styles.altText}>Google</Text>
              </TouchableOpacity>
            </View>*/}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.loginText}>
              Don't have an account?{" "}
              <TouchableOpacity onPress={() => navigation.navigate("register")}>
                <Text adjustsFontSizeToFit style={styles.login}>Sign up</Text>
              </TouchableOpacity>
            </Text>

            <TouchableOpacity style={styles.termsButton}>
              <Text adjustsFontSizeToFit style={styles.terms}>Terms & Conditions</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },

  keyboardView: {
    flex: 1,
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  logoContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  logoWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(56, 151, 240, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },

  logo: {
    width: 110,
    height: 110,
  },

  titleContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  brand: {
    color: "#3897f0",
    fontSize: 32,
    fontWeight: "800",
  },

  subtitle: {
    color: "#8b8b8b",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "500",
  },

  descContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3897f0",
    marginHorizontal: 8,
  },

  desc: {
    color: "#5f5f5f",
    fontSize: 13,
    textAlign: "center",
  },

  formCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(56, 151, 240, 0.1)",
    shadowColor: "#3897f0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  heading: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "rgba(56, 151, 240, 0.2)",
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    paddingVertical: 12,
  },

  eyeIcon: {
    padding: 8,
  },

  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },

  forgotText: {
    color: "#3897f0",
    fontSize: 14,
    fontWeight: "500",
  },

  button: {
    backgroundColor: "#3897f0",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#3897f0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  dividerText: {
    color: "#8b8b8b",
    fontSize: 13,
    marginHorizontal: 16,
  },

  altButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(56, 151, 240, 0.2)",
  },

  altText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  googleIcon: {
    width: 20,
    height: 20,
  },

  footer: {
    alignItems: "center",
    marginTop: 8,
  },

  loginText: {
    color: "#cfcfcf",
    fontSize: 15,
    marginBottom: 16,
  },

  login: {
    color: "#3897f0",
    fontWeight: "700",
    fontSize: 15,
  },

  termsButton: {
    paddingVertical: 8,
  },

  terms: {
    color: "#3897f0",
    fontSize: 13,
    opacity: 0.8,
  },
});

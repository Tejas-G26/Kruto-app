import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from "../../lib/supabase"; // adjust path

export const UsernameSelectScreen = ({ navigation }) => {

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [available, setAvailable] = useState(null); // true / false / null
  const [loading, setLoading] = useState(false);

  // 🔥 CHECK USERNAME AVAILABILITY
  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .single();

      if (data) {
        setAvailable(false); // taken
      } else {
        setAvailable(true); // available
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  // 🔥 SAVE USER DATA
  const handleSave = async () => {
    if (!username || !fullName) {
      Alert.alert("Error", "All fields required");
      return;
    }

    if (available === false) {
      Alert.alert("Error", "Username already taken");
      return;
    }

    try {
      setLoading(true);

      // get logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User not found");
        return;
      }

      const { error } = await supabase.from("users").insert([
        {
          user_id: user.id,
          username: username.toLowerCase(),
          full_name: fullName,
          email: user.email,
          created_at: new Date(),
        },
      ]);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong");
    } finally {
      // 🔥 FORCE SUPABASE SESSION REFRESH
      await supabase.auth.refreshSession();
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
              <Icons name="leaf" size={60} color="#3897f0" />
            </View>
          </View>

          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              Welcome to <Text style={styles.brand}>Kruto</Text>
            </Text>
            <Text style={styles.subtitle}>Farming Community</Text>
            <View style={styles.descContainer}>
              <View style={styles.dot} />
              <Text style={styles.desc}>
                Connect with farmers and grow together
              </Text>
              <View style={styles.dot} />
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.heading}>Complete your profile</Text>
            
            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Icons name="person-outline" size={20} color="#3897f0" />
              </View>
              <TextInput
                placeholder="Full Name"
                placeholderTextColor="#666"
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Icons name="at-outline" size={20} color="#3897f0" />
              </View>
              <TextInput
                placeholder="Username"
                placeholderTextColor="#666"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              
            </View>

            {/* Availability Status */}
            {available === true && (
              <View style={styles.availableContainer}>
                <Icons name="checkmark-circle-outline" size={16} color="#4caf50" />
                <Text style={styles.availableText}>Username is available</Text>
              </View>
            )}

            {available === false && (
              <View style={styles.unavailableContainer}>
                <Icons name="close-circle-outline" size={16} color="#f44336" />
                <Text style={styles.unavailableText}>Username already taken</Text>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.button, loading && styles.buttonDisabled]}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

             <Text adjustsFontSizeToFit style={{color:'#ffffff', fontSize:12}}>
              Username cannot be changed
            </Text>

            {/* Rules Section */}
            <View style={styles.rulesContainer}>
              <Text style={styles.rulesTitle}>Username Requirements:</Text>
              <View style={styles.ruleItem}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Must be 3–20 characters</Text>
              </View>
              <View style={styles.ruleItem}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Letters and numbers allowed</Text>
              </View>
              <View style={styles.ruleItem}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Underscore (_) allowed</Text>
              </View>
              <View style={styles.ruleItem}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>Username must be unique</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UsernameSelectScreen;

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
    marginTop: 40,
    marginBottom: 20,
  },

  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(56, 151, 240, 0.1)",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 16,
    paddingVertical: 12,
  },

  availableContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 4,
    paddingHorizontal: 8,
  },

  availableText: {
    color: "#4caf50",
    fontSize: 13,
    marginLeft: 8,
    fontWeight: "500",
  },

  unavailableContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 4,
    paddingHorizontal: 8,
  },

  unavailableText: {
    color: "#f44336",
    fontSize: 13,
    marginLeft: 8,
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

  rulesContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },

  rulesTitle: {
    color: "#8b8b8b",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 12,
  },

  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  ruleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3897f0",
    marginRight: 10,
  },

  ruleText: {
    color: "#aaaaaa",
    fontSize: 12,
  },
});
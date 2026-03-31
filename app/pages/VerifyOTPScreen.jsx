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
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from '../../lib/supabase';

export const VerifyOTPScreen = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState('otp'); // 'otp' or 'password'
  
  const inputRefs = useRef([]);

  useEffect(() => {
    // Start countdown timer
    if (timer > 0 && !canResend) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, canResend]);

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code");
      return;
    }

    try {
      setLoading(true);

      // Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'email',
      });

      if (error) {
        Alert.alert("Verification Failed", error.message);
        return;
      }

      // OTP verified, move to password reset step
      setStep('password');
      
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert(
          "Success!",
          "Your password has been reset successfully. Please login with your new password.",
          [
            {
              text: "Go to Login",
              onPress: () => navigation.navigate("Login2"),
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    try {
      setResendLoading(true);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        // Reset OTP fields and timer
        setOtp(["", "", "", "", "", ""]);
        setTimer(60);
        setCanResend(false);
        Alert.alert("Success", "New verification code sent to your email");
        
        // Focus first input
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setResendLoading(false);
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
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {step === 'otp' ? (
            // OTP Verification Step
            <>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit verification code to
                </Text>
                <Text style={styles.emailText}>{email}</Text>
              </View>

              <View style={styles.formCard}>
                {/* OTP Input */}
                <View style={styles.otpContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => inputRefs.current[index] = ref}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectionColor="#3897f0"
                    />
                  ))}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={verifyOTP}
                  style={[styles.button, loading && styles.buttonDisabled]}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>

                {/* Resend Section */}
                <View style={styles.resendContainer}>
                  {!canResend ? (
                    <Text style={styles.timerText}>
                      Resend code in {timer} seconds
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={resendOTP}
                      disabled={resendLoading}
                    >
                      <Text style={styles.resendText}>
                        {resendLoading ? "Sending..." : "Resend Code"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </>
          ) : (
            // Reset Password Step
            <>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  Enter your new password below
                </Text>
              </View>

              <View style={styles.formCard}>
                {/* New Password Input */}
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Icons name="lock-closed-outline" size={20} color="#3897f0" />
                  </View>
                  <TextInput
                    placeholder="New password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showNewPassword}
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icons 
                      name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIcon}>
                    <Icons name="lock-closed-outline" size={20} color="#3897f0" />
                  </View>
                  <TextInput
                    placeholder="Confirm new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showConfirmPassword}
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Icons 
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>

                {/* Password Hint */}
                <View style={styles.passwordHint}>
                  <Icons name="information-circle-outline" size={14} color="#666" />
                  <Text style={styles.hintText}>
                    Password must be at least 6 characters
                  </Text>
                </View>

                {/* Reset Password Button */}
                <TouchableOpacity
                  onPress={resetPassword}
                  style={[styles.button, loading && styles.buttonDisabled]}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.loginText}>
              Remember your password?{" "}
              <TouchableOpacity onPress={() => navigation.navigate("Login2")}>
                <Text style={styles.login}>Sign in</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default VerifyOTPScreen;

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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#8b8b8b",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emailText: {
    color: "#3897f0",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    textAlign: "center",
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "rgba(56, 151, 240, 0.2)",
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
  eyeIcon: {
    padding: 8,
  },
  passwordHint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 4,
  },
  hintText: {
    color: "#666",
    fontSize: 12,
    marginLeft: 6,
  },
  button: {
    backgroundColor: "#3897f0",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
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
  resendContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  timerText: {
    color: "#666",
    fontSize: 14,
  },
  resendText: {
    color: "#3897f0",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  loginText: {
    color: "#cfcfcf",
    fontSize: 15,
  },
  login: {
    color: "#3897f0",
    fontWeight: "700",
    fontSize: 15,
  },
});
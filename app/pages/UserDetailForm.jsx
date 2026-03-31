import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState, useEffect } from "react";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from "@/lib/supabase";

const UserDetailForm = () => {
  const navigation = useNavigation();

  const [step, setStep] = useState(1);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    dateOfBirth: new Date(),
    phone: '',
    email: '',
    website: '',
    occupation: '',
    gender: '',
    relationshipStatus: '',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  // Gender options
  const genderOptions = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
  const relationshipOptions = ['Single', 'In a relationship', 'Married', 'Divorced', 'Prefer not to say'];

  // 🔥 LOAD USER DATA
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setFormData({
        name: data.full_name || "",
        username: data.username || "",
        bio: data.bio || "",
        location: data.location || "",
        dateOfBirth: data.date_of_birth
          ? new Date(data.date_of_birth)
          : new Date(),
        phone: data.phone_number || "",
        email: data.email || "",
        website: data.website_link || "",
        occupation: data.occupation || "",
        gender: data.gender || "",
        relationshipStatus: data.relationship_status || "",
      });

      setProfileImage(data.profile_image_url);
    }
    setLoading(false);
  };

  // 🔥 IMAGE PICKER
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // 🔥 UPLOAD IMAGE
  const uploadImage = async (uri) => {
    setUploading(true);
    const fileExt = uri.split(".").pop();
    const fileName = `profile_${Date.now()}.${fileExt}`;

    const response = await fetch(uri);
    const ArrayBuffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from("profile")
      .upload(fileName, ArrayBuffer,{
        contentType:'image/jpeg',
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("profile")
      .getPublicUrl(fileName);
    
    setUploading(false);
    return data.publicUrl;
  };

  // 🔥 DATE PICKER
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData({ ...formData, dateOfBirth: selectedDate });
    }
  };

  // 🔥 SAVE PROFILE
  const handleSubmit = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let imageUrl = profileImage;

    if (profileImage && !profileImage.startsWith("http")) {
      imageUrl = await uploadImage(profileImage);
    }

    const { error } = await supabase
      .from("users")
      .update({
        full_name: formData.name,
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        date_of_birth: formData.dateOfBirth,
        phone_number: formData.phone,
        email: formData.email,
        website_link: formData.website,
        occupation: formData.occupation,
        gender: formData.gender,
        relationship_status: formData.relationshipStatus,
        profile_image_url: imageUrl,
      })
      .eq("user_id", user.id);

    if (error) {
      console.log("Update error:", error);
    } else {
      console.log("Profile updated ✅");
      navigation.goBack();
    }
    setLoading(false);
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text adjustsFontSizeToFit style={styles.stepTitle}>Basic Information</Text>
        <Text adjustsFontSizeToFit style={styles.stepSubtitle}>Tell us about yourself</Text>
      </View>

      <View style={styles.imageUploadContainer}>
        <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
          {profileImage ? (
            <View style={styles.profileImageWrapper}>
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
              <View style={styles.imageEditBadge}>
                <Icons name="camera" size={16} color="#fff" />
              </View>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icons name="camera-outline" size={48} color="#3897f0" />
              <Text adjustsFontSizeToFit style={styles.imagePlaceholderText}>Add Profile Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Full Name</Text>
        <View style={styles.inputContainer}>
          <Icons name="person-outline" size={20} color="#878787" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#878787"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Username</Text>
        <View style={styles.inputContainer}>
          <Icons name="at-outline" size={20} color="#878787" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Choose a username"
            placeholderTextColor="#878787"
            value={formData.username}
           editable={false}
            autoCapitalize="none"
          />
        </View>
        <Text style={{color:'#878787', fontSize:12}}>
          Username cannot be changed
       </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Icons name="mail-outline" size={20} color="#878787" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#878787"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text adjustsFontSizeToFit style={styles.stepTitle}>Personal Details</Text>
        <Text adjustsFontSizeToFit style={styles.stepSubtitle}>Help us know you better</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Date of Birth</Text>
        <TouchableOpacity 
          style={styles.inputContainer} 
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}>
          <Icons name="calendar-outline" size={20} color="#878787" style={styles.inputIcon} />
          <Text style={[styles.input, styles.placeholderText]}>
            {formData.dateOfBirth.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
          <Icons name="chevron-down-outline" size={20} color="#878787" />
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Gender</Text>
        <View style={styles.optionsContainer}>
          {genderOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionChip,
                formData.gender === option && styles.optionChipSelected
              ]}
              onPress={() => setFormData({ ...formData, gender: option })}>
              <Text adjustsFontSizeToFit style={[
                styles.optionChipText,
                formData.gender === option && styles.optionChipTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Location</Text>
        <View style={styles.inputContainer}>
          <Icons name="location-outline" size={20} color="#878787" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Where are you from?"
            placeholderTextColor="#878787"
            value={formData.location}
            onChangeText={(text) => setFormData({ ...formData, location: text })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Icons name="call-outline" size={20} color="#878787" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor="#878787"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text adjustsFontSizeToFit style={styles.stepTitle}>About You</Text>
        <Text adjustsFontSizeToFit style={styles.stepSubtitle}>Share your story with the community</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Bio</Text>
        <View style={[styles.inputContainer, styles.bioContainer]}>
          <Icons name="document-text-outline" size={20} color="#878787" style={[styles.inputIcon, { alignSelf: 'flex-start', marginTop: 12 }]} />
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#878787"
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            multiline
            numberOfLines={4}
            maxLength={150}
          />
        </View>
        <Text adjustsFontSizeToFit style={styles.inputHint}>{formData.bio.length}/150 characters</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Occupation</Text>
        <View style={styles.inputContainer}>
          <Icons name="briefcase-outline" size={20} color="#878787" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="What do you do?"
            placeholderTextColor="#878787"
            value={formData.occupation}
            onChangeText={(text) => setFormData({ ...formData, occupation: text })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Relationship Status</Text>
        <View style={styles.optionsContainer}>
          {relationshipOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionChip,
                formData.relationshipStatus === option && styles.optionChipSelected
              ]}
              onPress={() => setFormData({ ...formData, relationshipStatus: option })}>
              <Text adjustsFontSizeToFit style={[
                styles.optionChipText,
                formData.relationshipStatus === option && styles.optionChipTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>Website</Text>
        <View style={styles.inputContainer}>
          <Icons name="globe-outline" size={20} color="#878787" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Your personal website"
            placeholderTextColor="#878787"
            value={formData.website}
            onChangeText={(text) => setFormData({ ...formData, website: text })}
            autoCapitalize="none"
          />
        </View>
      </View>
    </View>
  );

  if (loading && step === 1) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3897f0" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text adjustsFontSizeToFit style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <TouchableOpacity
                style={[
                  styles.progressStep,
                  step >= s && styles.progressStepActive
                ]}
                onPress={() => setStep(s)}>
                <Text adjustsFontSizeToFit style={[
                  styles.progressStepText,
                  step >= s && styles.progressStepTextActive
                ]}>
                  {s}
                </Text>
              </TouchableOpacity>
              {s < 3 && (
                <View style={[
                  styles.progressLine,
                  step > s && styles.progressLineActive
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {step > 1 && (
              <TouchableOpacity
                style={[styles.navBtn, styles.prevBtn]}
                onPress={() => setStep(step - 1)}>
                <Icons name="arrow-back-outline" size={20} color="#3897f0" />
                <Text adjustsFontSizeToFit style={styles.prevBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.navBtn,
                styles.nextBtn,
                step === 3 && styles.submitBtn,
                loading && styles.nextBtnDisabled
              ]}
              onPress={() => {
                if (step < 3) {
                  setStep(step + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={loading}>
              <View style={styles.nextBtnContent}>
                <Text adjustsFontSizeToFit style={styles.nextBtnText}>
                  {step === 3 ? (loading ? "Saving..." : "Save Profile") : "Continue"}
                </Text>
                {step !== 3 && (
                  <Icons name="arrow-forward-outline" size={20} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfBirth}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UserDetailForm;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F0F0F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2f2f2f",
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2f2f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#3897f0',
  },
  progressStepText: {
    color: '#878787',
    fontSize: 16,
    fontWeight: '600',
  },
  progressStepTextActive: {
    color: '#fff',
  },
  progressLine: {
    width: 50,
    height: 2,
    backgroundColor: '#2f2f2f',
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: '#3897f0',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepSubtitle: {
    color: '#878787',
    fontSize: 14,
  },
  imageUploadContainer: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#3897f0',
  },
  imageEditBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3897f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F0F0F',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3897f0',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#3897f0',
    fontSize: 8,
    marginTop: 8,
    fontWeight: '500',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2f2f2f',
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 12,
  },
  placeholderText: {
    color: '#fff',
  },
  inputHint: {
    color: '#878787',
    fontSize: 11,
    marginTop: 6,
    marginLeft: 4,
  },
  bioContainer: {
    alignItems: 'flex-start',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2f2f2f',
  },
  optionChipSelected: {
    backgroundColor: '#3897f0',
    borderColor: '#3897f0',
  },
  optionChipText: {
    color: '#878787',
    fontSize: 14,
  },
  optionChipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 30,
  },
  navBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevBtn: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#3897f0',
    flexDirection: 'row',
    gap: 8,
  },
  prevBtnText: {
    color: '#3897f0',
    fontSize: 16,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: '#3897f0',
  },
  submitBtn: {
    backgroundColor: '#3897f0',
  },
  nextBtnDisabled: {
    opacity: 0.5,
  },
  nextBtnContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
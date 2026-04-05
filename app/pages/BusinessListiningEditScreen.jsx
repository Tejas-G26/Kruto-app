import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
} from "react-native";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../../lib/supabase";
import { KeyboardAvoidingView } from "react-native";

const { width } = Dimensions.get("window");

const BusinessListiningEditScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { businessId, listingData } = route.params; // Get business_id and optional listing data

  const [currentStep, setCurrentStep] = useState(1);
  const [newImages, setNewImages] = useState([]); // New images to upload
  const [existingImages, setExistingImages] = useState([]); // Existing image URLs from DB
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingImages, setDeletingImages] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({
    field: null,
    show: false,
  });

  const [formData, setFormData] = useState({
    // Basic Info
    title: "",
    description: "",
    category: "",
    subCategory: "",
    type: "",

    // Pricing & Availability
    rentPerHour: "",
    rentPerDay: "",
    rentPerWeek: "",
    sellingPrice: "",
    securityDeposit: "",
    minimumRentPeriod: "1 day",
    availableFrom: new Date(),
    availableTo: new Date(),

    // Location & Contact
    locationName: "",
    city: "",
    state: "",
    zipCode: "",
    fullAddress: "",
    phoneNumber: "",
    email: "",

    // Equipment Details
    brand: "",
    model: "",
    year: "",
    condition: "",
    conditionNote: "",
    quantity: "1",
    serialNumber: "",
    isAvailable: "Available",

    // Additional Info
    features: [],
    accessories: [],
    specialInstruction: "",
    termsCondition: "",
  });

  // Categories and Subcategories
  const categories = {
    Electronics: [
      "Cameras",
      "Laptops",
      "Audio Equipment",
      "Gaming",
      "Drones",
      "Projectors",
    ],
    Photography: [
      "DSLR Cameras",
      "Lenses",
      "Lighting",
      "Tripods",
      "Studio Equipment",
    ],
    Tools: [
      "Power Tools",
      "Hand Tools",
      "Gardening",
      "Construction",
      "Woodworking",
    ],
    Vehicles: ["Cars", "Bikes", "Scooters", "Boats", "RVs"],
    Events: [
      "Tents",
      "Chairs",
      "Tables",
      "Sound Systems",
      "Lighting",
      "Decorations",
    ],
    Sports: [
      "Camping Gear",
      "Bicycles",
      "Skis",
      "Surfboards",
      "Sports Equipment",
    ],
    Fashion: ["Clothing", "Accessories", "Costumes", "Luxury Items"],
  };

  const categoriesType = ["Sell", "Rent"];

  const conditions = [
    "New",
    "Like New",
    "Excellent",
    "Good",
    "Fair",
    "Acceptable",
    "For Parts/Not Working",
  ];

  // Fetch listing data
  const fetchListingData = async () => {
    try {
      setLoading(true);

      // If data was passed directly from navigation, use it
      if (listingData) {
        populateFormData(listingData);
        setLoading(false);
        return;
      }

      // Otherwise fetch from database
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        Alert.alert("Error", "Please login to edit listings");
        navigation.goBack();
        return;
      }

      const { data, error } = await supabase
        .from("business_listings")
        .select("*")
        .eq("business_id", businessId)
        .single();

      if (error) throw error;

      // Verify user owns this listing
      if (data.created_user_id !== userData.user.id) {
        Alert.alert("Error", "You don't have permission to edit this listing");
        navigation.goBack();
        return;
      }

      populateFormData(data);
    } catch (error) {
      console.error("Error fetching listing:", error);
      Alert.alert("Error", "Failed to load listing data");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Populate form with existing data
  const populateFormData = (data) => {
    // Parse images
    if (data.images_url) {
      const urls = data.images_url.split(",").filter((url) => url.trim());
      setExistingImages(urls);
    }

    // Parse category
    let mainCategory = "";
    let subCategoryValue = "";
    if (data.category) {
      for (const [cat, subs] of Object.entries(categories)) {
        if (subs.includes(data.category)) {
          mainCategory = cat;
          subCategoryValue = data.category;
          break;
        }
      }
      if (!mainCategory && Object.keys(categories).includes(data.category)) {
        mainCategory = data.category;
        subCategoryValue = "";
      }
    }

    setFormData({
      title: data.title || "",
      description: data.description || "",
      type: data.type || "",
      category: mainCategory,
      subCategory: subCategoryValue,
      rentPerHour: data.price_per_hour || "",
      rentPerDay: data.price_per_day || "",
      rentPerWeek: data.price_per_week || "",
      sellingPrice: data.selling_price || "",
      securityDeposit: data.security_deposit || "",
      minimumRentPeriod: data.minimum_rental_period || "1 day",
      availableFrom: data.availability_start
        ? new Date(data.availability_start)
        : new Date(),
      availableTo: data.availability_end
        ? new Date(data.availability_end)
        : new Date(),
      locationName: data.location_name || "",
      city: data.city || "",
      state: data.state || "",
      zipCode: data.zip_code || "",
      fullAddress: data.full_address || "",
      phoneNumber: data.phone_number || "",
      email: data.email || "",
      brand: data.brand || "",
      model: data.model || "",
      year: data.year || "",
      serialNumber: data.serial_number || "",
      condition: data.condition || "",
      conditionNote: data.condition_note || "",
      isAvailable: data.is_available || "Available",
      specialInstruction: data.special_instruction || "",
      termsCondition: data.terms_condition || "",
    });
  };

  useEffect(() => {
    fetchListingData();
  }, [businessId]);

  // Upload new image to Supabase
  const uploadImage = async (imageUri, index) => {
    try {
      const fileExt = imageUri.split(".").pop();
      const fileName = `bussiness_${Date.now()}_${index}.${fileExt}`;

      const formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: fileName,
        type: `image/${fileExt}`,
      });

      const { error } = await supabase.storage
        .from("bussiness")
        .upload(fileName, formData);

      if (error) throw error;

      const { data } = supabase.storage
        .from("bussiness")
        .getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Delete image from storage
  const deleteImageFromStorage = async (imageUrl) => {
    try {
      const fileName = imageUrl.split("/").pop().split("?")[0];
      const { error } = await supabase.storage
        .from("bussiness")
        .remove([fileName]);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  // Remove existing image
  const removeExistingImage = async (index) => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setDeletingImages(true);
          try {
            const imageToRemove = existingImages[index];
            await deleteImageFromStorage(imageToRemove);
            setExistingImages((prev) => prev.filter((_, i) => i !== index));
          } catch (error) {
            Alert.alert("Error", "Failed to remove image");
          } finally {
            setDeletingImages(false);
          }
        },
      },
    ]);
  };

  // Pick new images
  const pickImages = async () => {
    const totalImages = existingImages.length + newImages.length;
    if (totalImages >= 4) {
      Alert.alert("Limit Reached", "You can only have up to 4 images");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setNewImages([...newImages, result.assets[0].uri]);
    }
  };

  // Remove new image (not yet uploaded)
  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Update listing in database
  const updateListing = async () => {
    const totalImages = existingImages.length + newImages.length;
    if (totalImages === 0) {
      Alert.alert("Error", "Please add at least one image");
      return;
    }

    setUploading(true);
    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        Alert.alert("Error", "Please login to update listing");
        navigation.goBack();
        return;
      }

      // Upload new images
      const uploadedUrls = [];
      for (let i = 0; i < newImages.length; i++) {
        const url = await uploadImage(newImages[i], i);
        uploadedUrls.push(url);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedUrls];
      const imagesUrlString = allImages.join(",");

      // Prepare update data
      const updateData = {
        images_url: imagesUrlString,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.subCategory || formData.category,
        price_per_hour: formData.rentPerHour || null,
        price_per_day: formData.rentPerDay || null,
        price_per_week: formData.rentPerWeek || null,
        selling_price: formData.sellingPrice || null,
        security_deposit: formData.securityDeposit || null,
        minimum_rental_period: formData.minimumRentPeriod,
        availability_start: formData.availableFrom.toISOString(),
        availability_end: formData.availableTo.toISOString(),
        location_name: formData.locationName,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        full_address: formData.fullAddress,
        phone_number: formData.phoneNumber,
        email: formData.email,
        brand: formData.brand || null,
        model: formData.model || null,
        year: formData.year || null,
        serial_number: formData.serialNumber || null,
        condition: formData.condition,
        condition_note: formData.conditionNote || null,
        is_available: formData.isAvailable,
        special_instruction: formData.specialInstruction || null,
        terms_condition: formData.termsCondition || null,
        updated_at: new Date().toISOString(),
      };

      // Update in database with user verification
      const { error } = await supabase
        .from("business_listings")
        .update(updateData)
        .eq("business_id", businessId)
        .eq("created_user_id", userData.user.id); // Extra security

      if (error) throw error;

      Alert.alert("Success!", "Your listing has been updated successfully!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error updating listing:", error);
      Alert.alert("Error", "Failed to update listing. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Date picker handler
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker({ field: null, show: false });
    if (selectedDate && showDatePicker.field) {
      setFormData({ ...formData, [showDatePicker.field]: selectedDate });
    }
  };

  // Render functions for each step
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text adjustsFontSizeToFit style={styles.stepTitle}>
        <Icons name="image" size={20} color={"#fff"} /> Equipment Photos
      </Text>
      <Text adjustsFontSizeToFit style={styles.stepSubtitle}>
        Upload up to 4 high-quality images (minimum 1 required)
      </Text>

      {/* Image Display */}
      <View style={styles.imageGrid}>
        {/* Existing Images */}
        {existingImages.map((url, index) => (
          <View key={`existing-${index}`} style={styles.imageContainer}>
            <Image source={{ uri: url }} style={styles.uploadedImage} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => removeExistingImage(index)}
              disabled={deletingImages}
            >
              <Icons name="close-circle" size={24} color="#ff6b6b" />
            </TouchableOpacity>
            <View style={styles.imageBadge}>
              <Text adjustsFontSizeToFit style={styles.imageBadgeText}>
                Existing
              </Text>
            </View>
          </View>
        ))}

        {/* New Images */}
        {newImages.map((uri, index) => (
          <View key={`new-${index}`} style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.uploadedImage} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => removeNewImage(index)}
            >
              <Icons name="close-circle" size={24} color="#ff6b6b" />
            </TouchableOpacity>
            <View style={[styles.imageBadge, styles.newImageBadge]}>
              <Text adjustsFontSizeToFit style={styles.imageBadgeText}>
                New
              </Text>
            </View>
          </View>
        ))}

        {/* Add Button */}
        {existingImages.length + newImages.length < 4 && (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImages}>
            <Icons name="camera" size={25} color="#3897f0" />
            <Text adjustsFontSizeToFit style={styles.addImageText}>
              Add Photo
            </Text>
            <Text adjustsFontSizeToFit style={styles.imageCount}>
              {existingImages.length + newImages.length}/4
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {existingImages.length + newImages.length === 0 && (
        <Text adjustsFontSizeToFit style={styles.warningText}>
          Please upload at least 1 image
        </Text>
      )}

      <Text adjustsFontSizeToFit style={styles.sectionTitle}>
        Basic Information
      </Text>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Listing Title{" "}
          <Text adjustsFontSizeToFit style={styles.requiredStar}>
            *
          </Text>
        </Text>
        <View style={styles.inputContainer}>
          <Icons
            name="document-text-outline"
            size={20}
            color="#878787"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="e.g., Canon 5D Mark IV Camera for Rent"
            placeholderTextColor="#878787"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Description{" "}
          <Text adjustsFontSizeToFit style={styles.requiredStar}>
            *
          </Text>
        </Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your equipment in detail..."
            placeholderTextColor="#878787"
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Type Selection */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Type{" "}
          <Text adjustsFontSizeToFit style={styles.requiredStar}>
            *
          </Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
            style={styles.picker}
            dropdownIconColor="#878787"
          >
            <Picker.Item label="Select type" value="" />
            {categoriesType.map((type) => (
              <Picker.Item key={type} label={type} value={type} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Category Selection */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Category{" "}
          <Text adjustsFontSizeToFit style={styles.requiredStar}>
            *
          </Text>
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value, subCategory: "" })
            }
            style={styles.picker}
            dropdownIconColor="#878787"
          >
            <Picker.Item label="Select Category" value="" />
            {Object.keys(categories).map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Sub Category */}
      {formData.category && (
        <View style={styles.inputGroup}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            Sub Category{" "}
            <Text adjustsFontSizeToFit style={styles.requiredStar}>
              *
            </Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.subCategory}
              onValueChange={(value) =>
                setFormData({ ...formData, subCategory: value })
              }
              style={styles.picker}
              dropdownIconColor="#878787"
            >
              <Picker.Item label="Select Sub Category" value="" />
              {categories[formData.category]?.map((sub) => (
                <Picker.Item key={sub} label={sub} value={sub} />
              ))}
            </Picker>
          </View>
        </View>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text adjustsFontSizeToFit style={styles.stepTitle}>
        <Icons name="wallet" size={20} color={"#fff"} /> Pricing & Availability
      </Text>
      <Text adjustsFontSizeToFit style={styles.stepSubtitle}>
        Set your rental prices and availability
      </Text>

      {/* Pricing Options */}
      <View style={styles.pricingGrid}>
        <View style={styles.pricingCard}>
          <Text adjustsFontSizeToFit style={styles.pricingLabel}>
            Per Hour
          </Text>
          <View style={styles.pricingInputContainer}>
            <Text adjustsFontSizeToFit style={styles.currencySymbol}>
              ₹
            </Text>
            <TextInput
              style={styles.pricingInput}
              placeholder="0"
              placeholderTextColor="#878787"
              value={formData.rentPerHour}
              onChangeText={(text) =>
                setFormData({ ...formData, rentPerHour: text })
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.pricingCard}>
          <Text adjustsFontSizeToFit style={styles.pricingLabel}>
            Per Day
          </Text>
          <View style={styles.pricingInputContainer}>
            <Text adjustsFontSizeToFit style={styles.currencySymbol}>
              ₹
            </Text>
            <TextInput
              style={styles.pricingInput}
              placeholder="0"
              placeholderTextColor="#878787"
              value={formData.rentPerDay}
              onChangeText={(text) =>
                setFormData({ ...formData, rentPerDay: text })
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.pricingCard}>
          <Text adjustsFontSizeToFit style={styles.pricingLabel}>
            Per Week
          </Text>
          <View style={styles.pricingInputContainer}>
            <Text adjustsFontSizeToFit style={styles.currencySymbol}>
              ₹
            </Text>
            <TextInput
              style={styles.pricingInput}
              placeholder="0"
              placeholderTextColor="#878787"
              value={formData.rentPerWeek}
              onChangeText={(text) =>
                setFormData({ ...formData, rentPerWeek: text })
              }
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>

      {/* Security Deposit */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Selling Price
        </Text>
        <View style={styles.inputContainer}>
          <Text adjustsFontSizeToFit style={styles.currencySymbol}>
            ₹
          </Text>
          <TextInput
            style={[styles.input, { paddingLeft: 30 }]}
            placeholder="Amount required as selling"
            placeholderTextColor="#878787"
            value={formData.sellingPrice}
            onChangeText={(text) =>
              setFormData({ ...formData, sellingPrice: text })
            }
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Security Deposit */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Security Deposit
        </Text>
        <View style={styles.inputContainer}>
          <Text adjustsFontSizeToFit style={styles.currencySymbol}>
            ₹
          </Text>
          <TextInput
            style={[styles.input, { paddingLeft: 30 }]}
            placeholder="Amount required as security deposit"
            placeholderTextColor="#878787"
            value={formData.securityDeposit}
            onChangeText={(text) =>
              setFormData({ ...formData, securityDeposit: text })
            }
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Minimum Rental Period */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Minimum Rental Period
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.minimumRentPeriod}
            onValueChange={(value) =>
              setFormData({ ...formData, minimumRentPeriod: value })
            }
            style={styles.picker}
            dropdownIconColor="#878787"
          >
            <Picker.Item label="1 Hour" value="1 hour" />
            <Picker.Item label="4 Hours" value="4 hours" />
            <Picker.Item label="1 Day" value="1 day" />
            <Picker.Item label="3 Days" value="3 days" />
            <Picker.Item label="1 Week" value="1 week" />
            <Picker.Item label="1 Month" value="1 month" />
          </Picker>
        </View>
      </View>

      {/* Availability Period */}
      <Text adjustsFontSizeToFit style={styles.sectionTitle}>
        Availability Period
      </Text>

      <View style={styles.dateRangeContainer}>
        <TouchableOpacity
          style={styles.dateBox}
          onPress={() =>
            setShowDatePicker({ field: "availableFrom", show: true })
          }
        >
          <Text adjustsFontSizeToFit style={styles.dateLabel}>
            From
          </Text>
          <Text adjustsFontSizeToFit style={styles.dateValue}>
            {formData.availableFrom.toLocaleDateString()}
          </Text>
        </TouchableOpacity>

        <View style={styles.dateArrow}>
          <Icons name="arrow-forward" size={20} color="#878787" />
        </View>

        <TouchableOpacity
          style={styles.dateBox}
          onPress={() =>
            setShowDatePicker({ field: "availableTo", show: true })
          }
        >
          <Text adjustsFontSizeToFit style={styles.dateLabel}>
            To
          </Text>
          <Text adjustsFontSizeToFit style={styles.dateValue}>
            {formData.availableTo.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Availability Status */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Availability Status
        </Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.isAvailable}
            onValueChange={(value) =>
              setFormData({ ...formData, isAvailable: value })
            }
            style={styles.picker}
            dropdownIconColor="#878787"
          >
            <Picker.Item label="Available" value="Available" />
            <Picker.Item label="Not Available" value="Not Available" />
          </Picker>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text adjustsFontSizeToFit style={styles.stepTitle}>
        <Icons name="location" size={20} color={"#fff"} /> Location & Contact
      </Text>
      <Text adjustsFontSizeToFit style={styles.stepSubtitle}>
        Where can renters find you?
      </Text>

      {/* Location Name */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Location Name
        </Text>
        <View style={styles.inputContainer}>
          <Icons
            name="location-outline"
            size={20}
            color="#878787"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="e.g., Downtown Store, Home Address"
            placeholderTextColor="#878787"
            value={formData.locationName}
            onChangeText={(text) =>
              setFormData({ ...formData, locationName: text })
            }
          />
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            City
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#878787"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            State
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="State"
              placeholderTextColor="#878787"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
            />
          </View>
        </View>
      </View>

      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            ZIP Code
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="ZIP Code"
              placeholderTextColor="#878787"
              value={formData.zipCode}
              onChangeText={(text) =>
                setFormData({ ...formData, zipCode: text })
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 2 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            Full Address
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Street address"
              placeholderTextColor="#878787"
              value={formData.fullAddress}
              onChangeText={(text) =>
                setFormData({ ...formData, fullAddress: text })
              }
            />
          </View>
        </View>
      </View>

      {/* Contact Info */}
      <Text adjustsFontSizeToFit style={styles.sectionTitle}>
        Contact Information
      </Text>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Phone Number
        </Text>
        <View style={styles.inputContainer}>
          <Icons
            name="call-outline"
            size={20}
            color="#878787"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Contact phone number"
            placeholderTextColor="#878787"
            value={formData.phoneNumber}
            onChangeText={(text) =>
              setFormData({ ...formData, phoneNumber: text })
            }
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Email Address
        </Text>
        <View style={styles.inputContainer}>
          <Icons
            name="mail-outline"
            size={20}
            color="#878787"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Contact email"
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

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text adjustsFontSizeToFit style={styles.stepTitle}>
        <Icons name="document-text" size={20} color={"#fff"} /> Equipment
        Details
      </Text>
      <Text adjustsFontSizeToFit style={styles.stepSubtitle}>
        Provide detailed information about your equipment
      </Text>

      {/* Brand & Model */}
      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            Brand
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., Canon, Bosch"
              placeholderTextColor="#878787"
              value={formData.brand}
              onChangeText={(text) => setFormData({ ...formData, brand: text })}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            Model
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="e.g., 5D Mark IV"
              placeholderTextColor="#878787"
              value={formData.model}
              onChangeText={(text) => setFormData({ ...formData, model: text })}
            />
          </View>
        </View>
      </View>

      {/* Year & Serial Number */}
      <View style={styles.rowInputs}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            Year
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Year of manufacture"
              placeholderTextColor="#878787"
              value={formData.year}
              onChangeText={(text) => setFormData({ ...formData, year: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text adjustsFontSizeToFit style={styles.inputLabel}>
            Serial Number
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#878787"
              value={formData.serialNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, serialNumber: text })
              }
            />
          </View>
        </View>
      </View>

      {/* Condition */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Condition
        </Text>
        <View style={styles.conditionContainer}>
          {conditions.map((condition) => (
            <TouchableOpacity
              key={condition}
              style={[
                styles.conditionChip,
                formData.condition === condition &&
                  styles.conditionChipSelected,
              ]}
              onPress={() => setFormData({ ...formData, condition })}
            >
              <Text
                adjustsFontSizeToFit
                style={[
                  styles.conditionChipText,
                  formData.condition === condition &&
                    styles.conditionChipTextSelected,
                ]}
              >
                {condition}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Condition Notes */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Condition Notes
        </Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any scratches, wear and tear, or issues? Be honest..."
            placeholderTextColor="#878787"
            value={formData.conditionNote}
            onChangeText={(text) =>
              setFormData({ ...formData, conditionNote: text })
            }
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Special Instructions */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Special Instructions
        </Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special handling instructions, usage tips, etc."
            placeholderTextColor="#878787"
            value={formData.specialInstruction}
            onChangeText={(text) =>
              setFormData({ ...formData, specialInstruction: text })
            }
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Terms & Conditions */}
      <View style={styles.inputGroup}>
        <Text adjustsFontSizeToFit style={styles.inputLabel}>
          Terms & Conditions
        </Text>
        <View style={[styles.inputContainer, styles.textAreaContainer]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any specific terms for renters..."
            placeholderTextColor="#878787"
            value={formData.termsCondition}
            onChangeText={(text) =>
              setFormData({ ...formData, termsCondition: text })
            }
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Preview Card */}
      <View style={styles.previewCard}>
        <Text adjustsFontSizeToFit style={styles.previewTitle}>
          Listing Preview
        </Text>
        <View style={styles.previewItem}>
          <Text adjustsFontSizeToFit style={styles.previewLabel}>
            Title:
          </Text>
          <Text adjustsFontSizeToFit style={styles.previewValue}>
            {formData.title || "Not set"}
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text adjustsFontSizeToFit style={styles.previewLabel}>
            Category:
          </Text>
          <Text adjustsFontSizeToFit style={styles.previewValue}>
            {formData.subCategory || formData.category || "Not set"}
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text adjustsFontSizeToFit style={styles.previewLabel}>
            Price:
          </Text>
          <Text adjustsFontSizeToFit style={styles.previewValue}>
            {formData.rentPerDay ? `₹${formData.rentPerDay}/day` : "Not set"}
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text adjustsFontSizeToFit style={styles.previewLabel}>
            Location:
          </Text>
          <Text adjustsFontSizeToFit style={styles.previewValue}>
            {formData.city || "Not set"}
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text adjustsFontSizeToFit style={styles.previewLabel}>
            Condition:
          </Text>
          <Text adjustsFontSizeToFit style={styles.previewValue}>
            {formData.condition || "Not set"}
          </Text>
        </View>
        <View style={styles.previewItem}>
          <Text adjustsFontSizeToFit style={styles.previewLabel}>
            Images:
          </Text>
          <Text adjustsFontSizeToFit style={styles.previewValue}>
            {existingImages.length + newImages.length}/4
          </Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3897f0" />
        <Text adjustsFontSizeToFit style={styles.loadingText}>
          Loading listing data...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <Icons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text adjustsFontSizeToFit style={styles.headerTitle}>
              Edit Listing
            </Text>
            <TouchableOpacity></TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <TouchableOpacity
                  style={[
                    styles.progressStep,
                    step <= currentStep && styles.progressStepActive,
                    step < currentStep && styles.progressStepCompleted,
                  ]}
                  onPress={() => setCurrentStep(step)}
                >
                  {step < currentStep ? (
                    <Icons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Text
                      adjustsFontSizeToFit
                      style={[
                        styles.progressStepText,
                        step <= currentStep && styles.progressStepTextActive,
                      ]}
                    >
                      {step}
                    </Text>
                  )}
                </TouchableOpacity>
                {step < 4 && (
                  <View
                    style={[
                      styles.progressLine,
                      step < currentStep && styles.progressLineActive,
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>

          {/* Step Labels */}
          <View style={styles.stepLabels}>
            <Text
              adjustsFontSizeToFit
              style={[
                styles.stepLabel,
                currentStep >= 1 && styles.stepLabelActive,
              ]}
            >
              Photos
            </Text>
            <Text
              adjustsFontSizeToFit
              style={[
                styles.stepLabel,
                currentStep >= 2 && styles.stepLabelActive,
              ]}
            >
              Pricing
            </Text>
            <Text
              adjustsFontSizeToFit
              style={[
                styles.stepLabel,
                currentStep >= 3 && styles.stepLabelActive,
              ]}
            >
              Location
            </Text>
            <Text
              adjustsFontSizeToFit
              style={[
                styles.stepLabel,
                currentStep >= 4 && styles.stepLabelActive,
              ]}
            >
              Details
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Current Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <View style={styles.navigationButtons}>
              {currentStep > 1 && (
                <TouchableOpacity
                  style={[styles.navBtn, styles.prevBtn]}
                  onPress={() => setCurrentStep(currentStep - 1)}
                >
                  <Icons name="arrow-back" size={20} color="#3897f0" />
                  <Text adjustsFontSizeToFit style={styles.prevBtnText}>
                    Previous
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.navBtn,
                  styles.nextBtn,
                  currentStep === 1 &&
                    existingImages.length + newImages.length === 0 &&
                    styles.nextBtnDisabled,
                ]}
                onPress={() => {
                  if (currentStep < 4) {
                    setCurrentStep(currentStep + 1);
                  } else {
                    updateListing();
                  }
                }}
                disabled={
                  uploading ||
                  (currentStep === 1 &&
                    existingImages.length + newImages.length === 0)
                }
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.nextBtnContent}>
                    <Text adjustsFontSizeToFit style={styles.nextBtnText}>
                      {currentStep === 4 ? "Update" : "Continue"}
                    </Text>
                    <Icons name="arrow-forward" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Date Picker Modal */}
        {showDatePicker.show && (
          <DateTimePicker
            value={formData[showDatePicker.field] || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loadingText: {
    color: "#878787",
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
    backgroundColor: "#1C1C1E",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
  },
  helpBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#000",
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2f2f2f",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2f2f2f",
  },
  progressStepActive: {
    backgroundColor: "#3897f0",
    borderColor: "#3897f0",
  },
  progressStepCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  progressStepText: {
    color: "#878787",
    fontSize: 14,
    fontWeight: "600",
  },
  progressStepTextActive: {
    color: "#fff",
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: "#2f2f2f",
    marginHorizontal: 5,
  },
  progressLineActive: {
    backgroundColor: "#3897f0",
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 30,
    paddingBottom: 20,
    backgroundColor: "#000",
  },
  stepLabel: {
    color: "#878787",
    fontSize: 12,
    fontWeight: "500",
  },
  stepLabelActive: {
    color: "#3897f0",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepSubtitle: {
    color: "#878787",
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 16,
  },
  warningText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 16,
    textAlign: "center",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  imageContainer: {
    width: (width - 52) / 2,
    height: (width - 52) / 2,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  removeImageBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  imageBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newImageBadge: {
    backgroundColor: "#3897f0",
  },
  imageBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  addImageBtn: {
    width: (width - 52) / 2,
    height: (width - 52) / 2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3d3d3d",
    //borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
  },
  addImageText: {
    color: "#3897f0",
    fontSize: 14,
    marginTop: 8,
  },
  imageCount: {
    color: "#878787",
    fontSize: 12,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  requiredStar: {
    color: "#ff6b6b",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    paddingVertical: 12,
  },
  textAreaContainer: {
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputHint: {
    color: "#878787",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  pickerContainer: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
    overflow: "hidden",
  },
  picker: {
    color: "#fff",
    height: 50,
  },
  pricingGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  pricingLabel: {
    color: "#878787",
    fontSize: 12,
    marginBottom: 8,
  },
  pricingInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    color: "#4CAF50",
    fontSize: 18,
    fontWeight: "600",
    marginRight: 4,
  },
  pricingInput: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dateBox: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  dateLabel: {
    color: "#878787",
    fontSize: 12,
    marginBottom: 4,
  },
  dateValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  dateArrow: {
    width: 40,
    alignItems: "center",
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  conditionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  conditionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#1C1C1E",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2f2f2f",
  },
  conditionChipSelected: {
    backgroundColor: "#3897f0",
    borderColor: "#3897f0",
  },
  conditionChipText: {
    color: "#878787",
    fontSize: 12,
  },
  conditionChipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  previewCard: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#3897f0",
  },
  previewTitle: {
    color: "#3897f0",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  previewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#2f2f2f",
  },
  previewLabel: {
    color: "#878787",
    fontSize: 13,
  },
  previewValue: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },
  navBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  prevBtn: {
    backgroundColor: "#1C1C1E",
    borderWidth: 1,
    borderColor: "#3897f0",
    flexDirection: "row",
    gap: 8,
  },
  prevBtnText: {
    color: "#3897f0",
    fontSize: 16,
    fontWeight: "600",
  },
  nextBtn: {
    backgroundColor: "#3897f0",
    overflow: "hidden",
  },
  nextBtnDisabled: {
    backgroundColor: "#2f2f2f",
    opacity: 0.5,
  },
  nextBtnContent: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default BusinessListiningEditScreen;

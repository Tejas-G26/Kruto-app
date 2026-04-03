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
  Alert,
  Dimensions
} from "react-native";
import React, { useState } from "react";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

const CreatePost = () => {
  const navigation = useNavigation();
  const router = useRouter();

  const [image, setImage] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🔥 SAME LOGIC (UNCHANGED)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    if (!uri) return null;
    try {
      const fileExt = uri.split(".").pop();
      const fileName = `post_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error } = await supabase.storage
        .from("posts")
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);
      
      return data.publicUrl;
      
    } catch (error) {
      Alert.alert('Upload Failed', error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const createPost = async () => {
    if (!title.trim()) return Alert.alert('Error', 'Enter title');

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      let imageUrl = null;

if (image) {
  imageUrl = await uploadImage(image);
}
     

      await supabase.from("posts").insert([{
        user_id: user.id,
        image_url: imageUrl,
        title,
        description: description.trim() || null,
        created_at: new Date().toISOString(),
      }]);

      Alert.alert('Success', 'Post created!', [
        { text: 'OK', onPress: () => router.back() }
      ]);

      setTitle('');
      setDescription('');
      setImage(null);

    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Icons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Create Post</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* IMAGE SECTION */}
          <TouchableOpacity 
            style={styles.imageCard} 
            onPress={showImageOptions}
            activeOpacity={0.9}
          >
            {image ? (
              <>
                <Image 
                  source={{ uri: image }} 
                  style={styles.image} 
                  resizeMode="cover"
                />
                <View style={styles.editIcon}>
                  <Icons name="camera" size={16} color="#fff" />
                </View>
              </>
            ) : (
              <View style={styles.placeholder}>
                <Icons name="image-outline" size={42} color="#3897f0" />
                <Text style={styles.placeholderText}>Upload Image</Text>
              </View>
            )}

            {uploading && (
              <View style={styles.overlay}>
                <ActivityIndicator color="#fff" />
                <Text style={{ color: "#fff", marginTop: 6 }}>Uploading...</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* INPUTS */}
          <View style={styles.card}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter title..."
              placeholderTextColor="#777"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 120 }]}
              placeholder="Write something..."
              placeholderTextColor="#777"
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={[styles.button, (!title) && { opacity: 0.5 }]}
            onPress={createPost}
            disabled={!title || loading || uploading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Create Post</Text>
              </>
            )}
          </TouchableOpacity>

          

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreatePost;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  iconBtn: {
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 20,
  },

  imageCard: {
    height: 260,
    borderRadius: 20,
    backgroundColor: "#151515",
    marginTop: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    alignItems: "center",
  },

  placeholderText: {
    color: "#3897f0",
    marginTop: 8,
    fontWeight: "600",
  },

  editIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#3897f0",
    padding: 8,
    borderRadius: 20,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    backgroundColor: "#151515",
    marginTop: 16,
    borderRadius: 14,
    padding: 12,
  },

  label: {
    color: "#aaa",
    marginBottom: 6,
    fontSize: 13,
  },

  input: {
    color: "#fff",
    fontSize: 15,
  },

  button: {
    flexDirection: "row",
    backgroundColor: "#3897f0",
    padding: 14,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    marginBottom:250
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  cancel: {
    color: "#888",
    textAlign: "center",
    marginTop: 14,
    marginBottom: 40,
  },
});
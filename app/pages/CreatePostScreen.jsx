import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  ScrollView,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase"; // adjust path
import * as FileSystem from "expo-file-system";

const CreatePostScreen = ({ navigation }) => {

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 PICK IMAGE
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:['images'],
      quality: 0.7,
      allowsEditing: true, // 🔥 crop enabled
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // 🔥 UPLOAD IMAGE TO SUPABASE
 

const uploadImage = async (image) => {
  try {
    const fileName = `post_${Date.now()}.jpg`;

    const base64 = await FileSystem.readAsStringAsync(image.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const blob = await fetch(`data:image/jpeg;base64,${base64}`)
      .then(res => res.blob());

    const { error } = await supabase.storage
      .from("posts")
      .upload(fileName, blob, {
        contentType: "image/jpeg",
      });

    if (error) throw error;

    const { data } = supabase.storage
      .from("posts")
      .getPublicUrl(fileName);

    return data.publicUrl;

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    throw err;
  }
};

  // 🔥 CREATE POST
  const handlePost = async () => {

    if (!title && !image) {
      Alert.alert("Error", "Add image or title");
      return;
    }

    try {
      setLoading(true);

      // get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      const { error } = await supabase.from("posts").insert([
        {
          user_id: user.id,
          image_url: imageUrl,
          title: title,
          description: desc,
          created_at: new Date(),
        },
      ]);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      Alert.alert("Success", "Post created");

      // reset
      setTitle("");
      setDesc("");
      setImage(null);

      navigation.goBack();

    } catch (err) {
       console.log("UPLOAD ERROR:", err);
       Alert.alert("Error", err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}>
          <Icons name="close" size={20} color="#fff" />
        </TouchableOpacity>

        <Text adjustsFontSizeToFit style={styles.headerTitle}>Create Post</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Image Upload */}
        <TouchableOpacity style={styles.imageBox} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.preview} />
          ) : (
            <>
              <Icons name="cloud-upload-outline" size={35} color="#aaa" />
              <Text adjustsFontSizeToFit style={styles.uploadText}>Tap to upload image</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Title */}
        <TextInput
          placeholder="Post title"
          placeholderTextColor="#777"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        {/* Description */}
        <TextInput
          placeholder="Write something..."
          placeholderTextColor="#777"
          value={desc}
          onChangeText={setDesc}
          multiline
          style={styles.descInput}
        />

        {/* Button */}
        <TouchableOpacity
          style={styles.postBtn}
          onPress={handlePost}
          disabled={loading}
        >
          <Text adjustsFontSizeToFit style={styles.postText}>
            {loading ? "Posting..." : "Publish Post"}
          </Text>
        </TouchableOpacity> 

      </ScrollView>
    </SafeAreaView>
  );
};

export default CreatePostScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    paddingHorizontal: 15
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop:10
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 40
  },

  iconCircle: {
    backgroundColor: "#2a2a2a",
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  imageBox: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden"
  },

  preview: {
    width: "100%",
    height: "100%"
  },

  uploadText: {
    color: "#888",
    marginTop: 10
  },

  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 15,
    color: "#fff",
    marginBottom: 15
  },

  descInput: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 15,
    color: "#fff",
    height: 120,
    textAlignVertical: "top",
    marginBottom: 20
  },

  postBtn: {
    backgroundColor: "#fff",
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 100
  },

  postText: {
    fontSize: 18,
    fontWeight: "700"
  }

});
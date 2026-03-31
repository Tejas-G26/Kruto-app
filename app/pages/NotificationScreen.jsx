import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";

const { width } = Dimensions.get("window");

const NotificationScreen = ({ navigation }) => {

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  return (
    <SafeAreaView style={styles.container}>

      

        {/* Header */}
        <View style={styles.header}>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconCircle}
          >
            <Icons name="close" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Notifications</Text>

        </View>

       <View style={{flexDirection:'row',backgroundColor:'#2b2b2b',height:40,alignItems:'center',borderRadius:10,marginBottom:10}}>
        <Icons name='notifications' size={20} color={'#dae908'} style={{marginLeft:10}}/>
        <Text style={{color:'#fff',marginLeft:5}}>Rahul D. follow yous</Text>
       </View>
        <View style={{flexDirection:'row',backgroundColor:'#2b2b2b',height:40,alignItems:'center',borderRadius:10,marginBottom:10}}>
        <Icons name='notifications' size={20} color={'#dae908'} style={{marginLeft:10}}/>
        <Text style={{color:'#fff',marginLeft:5}}>Ramesh The nature is good</Text>
       </View>
        <View style={{flexDirection:'row',backgroundColor:'#2b2b2b',height:40,alignItems:'center',borderRadius:10,marginBottom:10}}>
        <Icons name='notifications' size={20} color={'#dae908'} style={{marginLeft:10}}/>
        <Text style={{color:'#fff',marginLeft:5}}>yello D. follow yous</Text>
       </View>
        <View style={{flexDirection:'row',backgroundColor:'#2b2b2b',height:40,alignItems:'center',borderRadius:10,marginBottom:10}}>
        <Icons name='notifications' size={20} color={'#dae908'} style={{marginLeft:10}}/>
        <Text style={{color:'#fff',marginLeft:5}}>carlo l. follow yous</Text>
       </View>
        <View style={{flexDirection:'row',backgroundColor:'#2b2b2b',height:40,alignItems:'center',borderRadius:10,marginBottom:10}}>
        <Icons name='notifications' size={20} color={'#dae908'} style={{marginLeft:10}}/>
        <Text style={{color:'#fff',marginLeft:5}}>suraj D. follow yous</Text>
       </View>
        <View style={{flexDirection:'row',backgroundColor:'#2b2b2b',height:40,alignItems:'center',borderRadius:10,marginBottom:10}}>
        <Icons name='notifications' size={20} color={'#dae908'} style={{marginLeft:10}}/>
        <Text style={{color:'#fff',marginLeft:5}}>eloxo s. follow yous</Text>
       </View>


    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    paddingHorizontal: 15
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    
  },

  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginRight:100,
    marginTop:10
  },

  iconCircle: {
    backgroundColor: "#2a2a2a",
    width: 40,
    height: 40,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginTop:10
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    
  },

  profileImg: {
    width: 45,
    height: 45,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#565656",
    marginRight: 10
  },

  username: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700"
  },

  subText: {
    color: "#aaa",
    fontSize: 12
  },

  imageBox: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20
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
    marginBottom:100
  },

  postText: {
    fontSize: 18,
    fontWeight: "700"
  }

});
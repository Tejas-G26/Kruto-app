import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";

export const PhoneNumberScreen = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo */}
        <Icons name="leaf" size={70} color="#22c55e" style={styles.logo} />

        {/* Title */}
        <Text adjustsFontSizeToFit style={styles.title}>
          Welcome to <Text adjustsFontSizeToFit style={styles.brand}>Kruto</Text>
        </Text>

        <Text adjustsFontSizeToFit style={styles.subtitle}>Farming Community</Text>
        <Text adjustsFontSizeToFit style={styles.desc}>Connect with farmers and grow together</Text>
         
         <Text adjustsFontSizeToFit style={{color:'#989898',fontSize:15,fontWeight:900,marginRight:110,marginBottom:5}}>Create account using phone</Text>
         <View
          style={{
            borderBottomWidth: 1,
            borderColor: "#4b4b4b",
            width: 300,
            alignItems: "center",
            marginBottom:20
          }}
        ></View> 

        {/* Email */}
        <View style={styles.inputBox}>
          <Icons name="call-outline" size={20} color="#8d8d8d" />
          <TextInput
            placeholder="Phone"
            placeholderTextColor="#7a7a7a"
            style={styles.input}
          />
        </View>
        


       
        {/* Register Button */}
        <TouchableOpacity
        onPress={()=>navigation.navigate('otp')}
        style={styles.button}>
          <Text adjustsFontSizeToFit style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>

        {/* Footer */}
        
        <View
          style={{
            borderBottomWidth: 1,
            borderColor: "#4b4b4b",
            width: 300,
            alignItems: "center",
            marginTop:20
          }}
        ></View>
        <Text adjustsFontSizeToFit style={styles.loginText}>
          I don't have account? <Text adjustsFontSizeToFit style={styles.login}>Register</Text>
        </Text>

        <View style={{flexDirection:'row'}}>
          <TouchableOpacity
           onPress={()=>navigation.navigate('register')}
            style={{
              width: 100,
              height: 50,
              backgroundColor: "#1C1C1E",
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 10,
              elevation: 4,
            
            }}
          >
            <Icons name="mail" size={20} color="#ffffff" />
          </TouchableOpacity>

           <TouchableOpacity
            style={{
              width: 100,
              height: 100,
              height: 50,
              backgroundColor: "#1C1C1E",
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 10,
              elevation: 1,
              marginLeft:20
            }}
          >
             <Image style={{width:30,height:30}} source={require('../../assets/images/google.png')}/>
            
          </TouchableOpacity>
        </View>

        <Text adjustsFontSizeToFit style={styles.terms}>Terms & Conditions</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhoneNumberScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },

  scroll: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 50,
  },

  logo: {
    marginBottom: 10,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  brand: {
    color: "#22c55e",
    fontSize: 34,
    fontWeight: "900",
  },

  subtitle: {
    color: "#8b8b8b",
    marginTop: 5,
    width:130
  },

  desc: {
    color: "#5f5f5f",
    marginBottom: 25,
    marginTop: 5,
    width:257
  },

  inputBox: {
    width: 300,
    backgroundColor: "#1C1C1E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 14,
    marginBottom: 15,
  },

  input: {
    flex: 1,
    paddingLeft: 10,
    color: "#fff",
  },

  button: {
    width: 300,
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    elevation: 4,
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
  },

  loginText: {
    color: "#cfcfcf",
    marginTop: 20,
    marginBottom: 10,
    width:200
  },

  login: {
    color: "#22c55e",
    fontWeight: "600",
    
  },

  terms: {
    marginTop: 10,
    color: "#4f9cff",
    width:125
  },
});

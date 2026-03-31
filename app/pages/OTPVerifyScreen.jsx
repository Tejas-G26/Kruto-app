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

export const OTPVerifyScreen = ({navigation}) => {
  return (
    <SafeAreaView style={styles.container}>
        <View>
            <TouchableOpacity onPress={()=>navigation.navigate('Phone')} style={{backgroundColor:"#363535",width:35,height:35,borderRadius:50,justifyContent:'center',alignItems:'center',marginLeft:25,marginTop:10}}>

                 <Icons name="close" size={20} color="#8d8d8d" />
            </TouchableOpacity>
        </View>
      <ScrollView contentContainerStyle={styles.scroll}>

        
         <Text adjustsFontSizeToFit style={{color:'#989898',fontSize:15,fontWeight:900,marginRight:0,marginBottom:5,width:300}}>Verify your number with OTP</Text>
                  <View
                   style={{
                     borderBottomWidth: 1,
                     borderColor: "#4b4b4b",
                     width: 300,
                     alignItems: "center",
                     marginBottom:20
                   }}
                 ></View> 
                <Text adjustsFontSizeToFit style={{color:'#7d7d7d',marginRight:100,marginBottom:10}}>OTP send to <Text style={{color:'#ffffff'}}>+91 xxxxxx8938</Text></Text>
        {/* Email */}
        <View style={styles.inputBox}>
          <Icons name="person-outline" size={20} color="#8d8d8d" />
          <TextInput
            placeholder="Enter OTP"
            placeholderTextColor="#7a7a7a"
            style={styles.input}
          />
        </View>

    

       

        {/* Register Button */}
        <TouchableOpacity 
        onPress={()=>navigation.navigate('username')}
        style={styles.button}>
          <Text style={styles.buttonText}>Verify</Text>
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

        <Text style={{color:"#aaaaaa",marginRight:50,marginTop:10}}> <Icons name="ellipse" size={10} color="#525252" style={styles.logo} /> Enter OTP that send your Enter number</Text>
         </ScrollView>
    </SafeAreaView>
  );
};

export default OTPVerifyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },

  scroll: {
    alignItems: "center",
    paddingTop: 20,
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
  },

  desc: {
    color: "#5f5f5f",
    marginBottom: 25,
    marginTop: 5,
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
    //borderColor:"#11cb33",
    //borderWidth:2,

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
  },

  login: {
    color: "#22c55e",
    fontWeight: "600",
  },

  terms: {
    marginTop: 10,
    color: "#4f9cff",
  },
});

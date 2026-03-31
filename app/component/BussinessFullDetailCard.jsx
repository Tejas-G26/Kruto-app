import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import React from "react";
import Icons from "@react-native-vector-icons/ionicons";
import { useNavigation } from "expo-router";

const BussinessFullDetailCard = ({ image, proimg, name, title, des, time,Category,
                   condition,
                   Location,
                   Rental,Rating,ava,c }) => {

                    const navigation = useNavigation();
  return (
    <View
    style={styles.card}>

      {/* Header */}
      <View style={styles.header}>

        <View style={styles.profileSection}>
          <Image style={styles.profileImg} source={proimg} />

          <Text adjustsFontSizeToFit style={styles.username}>{name}</Text>
          <TouchableOpacity 
          style={{
              //backgroundColor: "#0db53a",
    width: 100,
    height: 30,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginLeft:110,
    //borderWidth:1.5,
    borderColor:"#0db53a",
    
          }}
          >
            <Text adjustsFontSizeToFit style={{color:c,fontWeight:900,fontSize:10}}>{ava}</Text>
          </TouchableOpacity>
        </View>

       

      </View>

      {/* Post Image */}
      <Image style={styles.postImage} source={image} />
      <View style={{flexDirection:'row'}}>
      {/* Title */}
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <Text adjustsFontSizeToFit numberOfLines={2} style={{marginLeft:95,color:'#3bff0f',marginTop:10,fontSize:20,fontWeight:900}}>
         <Text adjustsFontSizeToFit style={styles.imf}></Text>{Rental}
      </Text>
      </View>


      {/* Description */}
      
      <Text adjustsFontSizeToFit numberOfLines={2} style={styles.desc}>
        <Text adjustsFontSizeToFit style={styles.imf}>Category : </Text>{Category}
      </Text>
      <Text adjustsFontSizeToFit numberOfLines={2} style={styles.desc}>
         <Text adjustsFontSizeToFit style={styles.imf}>Condition : </Text><Text style={{color:c}}>{condition}</Text>
      </Text>
      <Text adjustsFontSizeToFit numberOfLines={2} style={styles.desc}>
         <Text adjustsFontSizeToFit style={styles.imf}>Location : </Text>{Location}
      </Text>
      

      {/* Actions */}
      <View style={styles.actionRow}>

        <View style={styles.iconRow}>

          <TouchableOpacity
          onPress={()=>navigation.navigate('bfv')}
          style={{
            backgroundColor: "#ffffff",
    width: 150,
    height: 38,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    
          }}>
            <Text adjustsFontSizeToFit style={{color:"#000",fontSize:15,fontWeight:900}}>View details</Text>
          </TouchableOpacity>

         
          <TouchableOpacity style={styles.iconBtn}>
            <Icons name="share-social-outline" size={20} color="#000000" />
          </TouchableOpacity>

        </View>
       <View>
         <Text adjustsFontSizeToFit style={{color:"#dbdbdb",marginLeft:40}}> <Icons name="star" size={15} color="#FFD700"/>{Rating}</Text>
        <Text adjustsFontSizeToFit style={styles.time}>{time}</Text>
       </View>
        

      </View>

    </View>
  );
};

export default BussinessFullDetailCard;

const styles = StyleSheet.create({

  card: {
    backgroundColor: "#1C1C1E",
    width: "95%",
    alignSelf: "center",
    borderRadius: 20,
    padding: 12,
    marginVertical: 10,
    elevation: 3
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center"
  },

  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#616161"
  },

  username: {
    color: "#fff",
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "700"
  },

  followBtn: {
    borderWidth: 1,
    borderColor: "#757272",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 5
  },

  followText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12
  },

  postImage: {
    width: "100%",
    height: 170,
    borderRadius: 15,
    marginTop: 10
  },

  title: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    marginTop: 10
  },

  desc: {
    color: "#9a9a9a",
    fontSize: 13,
    marginTop: 5
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10
  },

  iconRow: {
    flexDirection: "row"
  },

  iconBtn: {
    backgroundColor: "#ffffff",
    width: 38,
    height: 38,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },

  time: {
    color: "#878787",
    fontSize: 12
  },
  imf : {
    color:"#fff",
    fontSize:13,
    
  }

});
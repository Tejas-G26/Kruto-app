import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@react-native-vector-icons/ionicons";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

const SettingScreen = ({ navigation }) => {

  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [expandedCard, setExpandedCard] = useState(null);


  const Logout = async()=>{
    await supabase.auth.signOut();

     
  };

  
  const toggleCard = (cardName) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCard(expandedCard === cardName ? null : cardName);
  };

  const handleEmailSupport = () => {
    const email = 'support@yourapp.com';
    const subject = 'Help & Support Request';
    const body = 'Hello, I need assistance with...';
    
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`)
      .catch(() => {
        Alert.alert('Error', 'No email client found on your device.');
      });
  };


  return (
    <SafeAreaView style={styles.container}>

     

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={{marginTop:10,backgroundColor:'#323232',width:40,height:40,borderRadius:50,justifyContent:'center',alignItems:'center'}} onPress={() => navigation.goBack()}>
            <Icons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <Text adjustsFontSizeToFit style={styles.headerTitle}>Settings</Text>

          <View style={{ width: 22 }} />
        </View>

         <ScrollView showsVerticalScrollIndicator={false}>

        {/* Account Section */}
        <Text adjustsFontSizeToFit style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity 
        onPress={()=>navigation.navigate('ud')}
        style={styles.settingItem}>
          <Icons name="person-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={()=>navigation.navigate('sp')}
        style={styles.settingItem}>
          <Icons name="bookmark-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>Saved Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={()=>navigation.navigate('bl')}
        style={styles.settingItem}>
          <Icons name="home-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>Business Listed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <Icons name="lock-closed-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>Privacy</Text>
        </TouchableOpacity>

        {/* Notifications */}
        <Text adjustsFontSizeToFit style={styles.sectionTitle}>Notifications</Text>

        <View style={styles.settingItem}>
        
          <Icons name="notifications-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>Push Notifications(Not Available)</Text>

          <Switch
            value={notifications}
            onValueChange={setNotifications}
            
          
          />
        </View>

        {/* Appearance */}
        <Text adjustsFontSizeToFit style={styles.sectionTitle}>Appearance</Text>

        <View style={styles.settingItem}>
          <Icons name="moon-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>Dark Mode(Not Available) </Text>

          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>

        {/* Support */}
        <Text adjustsFontSizeToFit style={styles.sectionTitle}>Support</Text>

        <View style={styles.container}>
      {/* Help & Support Card */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => toggleCard('help')}
          activeOpacity={0.7}
        >
          <Icons name="help-circle-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>Help & Support</Text>
          <Icons 
            name={expandedCard === 'help' ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#fff" 
            style={styles.chevron}
          />
        </TouchableOpacity>
        
        {expandedCard === 'help' && (
          <View style={styles.expandedContent}>
            <Text adjustsFontSizeToFit style={styles.contentTitle}>How can we help you?</Text>
            <Text adjustsFontSizeToFit style={styles.contentText}>
              Need assistance? We're here to help! Choose from the options below:
            </Text>
            
            <View style={styles.helpOptions}>
              <TouchableOpacity 
                style={styles.emailButton}
                onPress={handleEmailSupport}
              >
                <Icons name="mail-outline" size={18} color="#fff" />
                <Text adjustsFontSizeToFit style={styles.emailButtonText}>Email Support</Text>
              </TouchableOpacity>
              
              <Text adjustsFontSizeToFit style={styles.supportEmailText}>support@yourapp.com</Text>
              
              <View style={styles.divider} />
              
              <Text adjustsFontSizeToFit style={styles.infoText}>
               .Quick Response: Usually within 24 hours
              </Text>
              <Text adjustsFontSizeToFit style={styles.infoText}>
                .Support Hours: Monday - Friday, 9 AM - 6 PM
              </Text>
              <Text adjustsFontSizeToFit style={styles.infoText}>
                .Include your app version and device model for faster assistance
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* About App Card */}
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => toggleCard('about')}
          activeOpacity={0.7}
        >
          <Icons name="information-circle-outline" size={20} color="#fff" />
          <Text adjustsFontSizeToFit style={styles.settingText}>About App</Text>
          <Icons 
            name={expandedCard === 'about' ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color="#fff" 
            style={styles.chevron}
          />
        </TouchableOpacity>
        
        {expandedCard === 'about' && (
          <View style={styles.expandedContent}>
            <Text adjustsFontSizeToFit style={styles.appName}>Kruto-Farming Community</Text>
            <Text adjustsFontSizeToFit style={styles.versionText}>Version 1.0.0</Text>
            
            <Text adjustsFontSizeToFit style={styles.descriptionText}>
              This is a powerful app designed to provide you with the best user experience. 
              We're constantly working to improve and add new features.
            </Text>
            
            <View style={styles.infoRow}>
              <Icons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text adjustsFontSizeToFit style={styles.featureText}>✓ Feature 1: Amazing functionality</Text>
            </View>
            <View style={styles.infoRow}>
              <Icons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text adjustsFontSizeToFit style={styles.featureText}>✓ Feature 2: Seamless integration</Text>
            </View>
            <View style={styles.infoRow}>
              <Icons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text adjustsFontSizeToFit style={styles.featureText}>✓ Feature 3: Regular updates</Text>
            </View>
            
            <View style={styles.divider} />
            
            <Text adjustsFontSizeToFit style={styles.contactText}>
              Made with ❤️ by kruto
            </Text>
            <TouchableOpacity 
              style={styles.websiteLink}
              onPress={() => Linking.openURL('https://tejasg.netlify.app')}
            >
              <Text adjustsFontSizeToFit style={styles.linkText}>Visit our website </Text>
            </TouchableOpacity>
            
            <Text adjustsFontSizeToFit style={styles.copyrightText}>
              © 2026 kruto. All rights reserved.
            </Text>
          </View>
        )}
      </View>
    </View>


        {/* Logout */}
        <TouchableOpacity 
        onPress={Logout}
        style={styles.logoutBtn}>
          <Text adjustsFontSizeToFit style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
     
          
     
    </SafeAreaView>
  );
};

export default SettingScreen;

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
    marginBottom: 20
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop:10
  },

  sectionTitle: {
    color: "#888",
    marginTop: 20,
    marginBottom: 10,
    fontSize: 13
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    justifyContent: "space-between"
  },

  settingText: {
    color: "#fff",
    fontSize: 14,
    flex: 1,
    marginLeft: 10
  },

  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#ff3b30",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom:100
  },

  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15
  },
  bottomNav: { 
    width: width, 
    flexDirection: "row", 
    justifyContent: "space-around", 
    alignItems: "center", 
    paddingVertical: 12, 
    //backgroundColor: "#111", 
  }, 
 
  navBtn: { 
    //backgroundColor: "#2a2a2a", 
    width: 50, 
    height: 50, 
    borderRadius: 50, 
    justifyContent: "center", 
    alignItems: "center", 
  }, 
 
  navBtnActive: { 
    //backgroundColor: "#fff", 
    width: 50, 
    height: 50, 
    borderRadius: 50, 
    justifyContent: "center", 
    alignItems: "center",
    
  }, 
 
  centerAdd: { 
    backgroundColor: "#2a2a2a", 
    width: 65, 
    height: 65, 
    borderRadius: 65, 
    justifyContent: "center", 
    alignItems: "center", 
  }, 
  card: {
    backgroundColor: '#1E1E1E',//hhhhhhhhh
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    
  },
  
  settingText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
  expandedContent: {
    padding: 16,
    backgroundColor: '#2A2A2A',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3A',
  },
  contentTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contentText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  helpOptions: {
    marginTop: 8,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3897f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  supportEmailText: {
    color: '#3897f0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#3A3A3A',
    marginVertical: 16,
  },
  infoText: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  appName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  versionText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
  },
  descriptionText: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginLeft: 8,
  },
  contactText: {
    color: '#CCCCCC',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  websiteLink: {
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    color: '#3897f0',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  copyrightText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },


});
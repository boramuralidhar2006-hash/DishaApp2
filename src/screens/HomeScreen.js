 import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  ScrollView,
  Linking,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "@react-native-community/geolocation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SOS_R = Math.floor(SCREEN_WIDTH * 0.38);

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [location, setLocation] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUser();
    requestLocationPermission();
    startPulse();
  }, []);

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("disha_user");
      if (data) setUser(JSON.parse(data));
    } catch (_) {}
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Disha Location Permission",
            message: "Disha needs your location for SOS alerts.",
            buttonPositive: "Allow",
            buttonNegative: "Deny",
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) fetchLocation();
      } catch (err) {
        console.warn(err);
      }
    } else {
      fetchLocation();
    }
  };

  const fetchLocation = () => {
    Geolocation.getCurrentPosition(
      (pos) =>
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => console.log("Location error:", err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const getLocationLink = () => {
    if (location)
      return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    return "Location unavailable";
  };

  const getEmergencyContacts = async () => {
    try {
      const data = await AsyncStorage.getItem("emergency_contacts");
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  };

  const callAllContacts = (contacts) => {
    contacts.forEach((contact, i) => {
      const phone = contact.phone || contact.number;
      if (phone) {
        setTimeout(() => {
          Linking.openURL(`tel:${phone}`).catch((err) =>
            console.log(`Call failed:`, err),
          );
        }, i * 4000);
      }
    });
  };

  const sendSMSAlerts = async (contacts) => {
    const locationLink = getLocationLink();
    const message =
      `🚨 SOS ALERT from ${user?.name || "Disha User"}!\n` +
      `I need immediate help.\n` +
      `📍 My Location: ${locationLink}\n` +
      `Please contact me or send help immediately.\n` +
      `- Sent via Disha Safety App`;

    for (const contact of contacts) {
      const phone = contact.phone || contact.number;
      if (phone) {
        try {
          const ACCOUNT_SID = "YOUR_TWILIO_ACCOUNT_SID";
          const AUTH_TOKEN = "YOUR_TWILIO_AUTH_TOKEN";
          const FROM_NUMBER = "YOUR_TWILIO_PHONE_NUMBER";
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: "Basic " + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: `To=%2B91${phone}&From=${FROM_NUMBER}&Body=${encodeURIComponent(message)}`,
            },
          );
        } catch (err) {
          console.log("SMS failed:", err);
        }
      }
    }
  };

  const triggerSOS = async (type = "button") => {
    if (sosActive) return;
    setSosActive(true);
    fetchLocation();
    Vibration.vibrate([500, 300, 500, 300, 500]);
    const contacts = await getEmergencyContacts();
    if (contacts.length === 0) {
      Alert.alert(
        "⚠️ No Emergency Contacts",
        "Please add emergency contacts first.",
        [
          {
            text: "Add Contacts",
            onPress: () => navigation.navigate("Contacts"),
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
      setSosActive(false);
      return;
    }
    sendSMSAlerts(contacts);
    callAllContacts(contacts);
    navigation.navigate("SOSAlert", {
      triggerType: type,
      user,
      location,
      contacts,
    });
    setTimeout(() => setSosActive(false), 5000);
  };

  const handleSOSPress = () => {
    Alert.alert(
      "🚨 SEND SOS ALERT?",
      "This will:\n\n• 📍 Share your GPS location\n• 📩 SMS all emergency contacts\n• 📞 Call all emergency contacts\n• 🚨 Alert Disha Control Room",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "SEND SOS NOW",
          style: "destructive",
          onPress: () => triggerSOS("button"),
        },
      ],
    );
  };

  const quickActions = [
    {
      icon: "👥",
      label: "Emergency\nContacts",
      screen: "Contacts",
      color: "#4CAF50",
    },
    {
      icon: "📍",
      label: "Track My\nTravel",
      screen: "Track",
      color: "#2196F3",
    },
    {
      icon: "🏥",
      label: "Nearby\nServices",
      screen: "Nearby",
      color: "#FF9800",
    },
    {
      icon: "📋",
      label: "File\nComplaint",
      screen: "Complaint",
      color: "#9C27B0",
    },
    { icon: "📞", label: "Helplines", screen: "Helpline", color: "#F44336" },
    { icon: "🩸", label: "Blood\nBanks", screen: "Nearby", color: "#E91E63" },
  ];

  const emergencyDials = [
    { num: "100", lbl: "Police", tel: "100", bg: "#F44336" },
    { num: "108", lbl: "Ambulance", tel: "108", bg: "#4CAF50" },
    { num: "112", lbl: "Emergency", tel: "112", bg: "#2196F3" },
    { num: "181", lbl: "Women Help", tel: "181", bg: "#FF9800" },
  ];

  const navTabs = [
    { icon: "H", label: "Home", active: true, screen: "Home" },
    { icon: "C", label: "Contacts", active: false, screen: "Contacts" },
    { icon: "T", label: "Track", active: false, screen: "Track" },
    { icon: "N", label: "Nearby", active: false, screen: "Nearby" },
    { icon: "F", label: "Complaint", active: false, screen: "Complaint" },
    { icon: "A", label: "Admin", active: false, screen: "Admin" },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              Hello, {user?.name || "Vennela"} 👋
            </Text>
            <Text style={styles.subGreeting}>Stay Safe | Disha App</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.avatarIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* RED SOS SECTION */}
        <View style={styles.sosSection}>
          <Text style={styles.sosLabel}>Press in case of emergency</Text>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.sosBtn, sosActive && styles.sosBtnActive]}
              onPress={handleSOSPress}
              activeOpacity={0.85}
            >
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSub}>PRESS FOR HELP</Text>
            </TouchableOpacity>
          </Animated.View>
          <Text style={styles.shakeHint}>OR shake phone 5 times quickly</Text>
          {location ? (
            <Text style={styles.locationStatus}>
              📍 GPS Ready — Location will be shared on SOS
            </Text>
          ) : (
            <Text style={styles.locationFetching}>
              📡 Fetching GPS location...
            </Text>
          )}
        </View>

        {/* QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.actionCard, { borderTopColor: item.color }]}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.75}
              >
                <Text style={styles.actionIcon}>{item.icon}</Text>
                <Text style={styles.actionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* EMERGENCY DIAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Dial</Text>
          <View style={styles.dialRow}>
            {emergencyDials.map((d) => (
              <TouchableOpacity
                key={d.num}
                style={[styles.dialBtn, { backgroundColor: d.bg }]}
                onPress={() => Linking.openURL(`tel:${d.tel}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.dialNum}>{d.num}</Text>
                <Text style={styles.dialLbl}>{d.lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.navBar}>
        {navTabs.map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={styles.navItem}
            onPress={() => !tab.active && navigation.navigate(tab.screen)}
            activeOpacity={tab.active ? 1 : 0.7}
          >
            <Text style={[styles.navIcon, tab.active && styles.navIconActive]}>
              {tab.icon}
            </Text>
            <Text
              style={[styles.navLabel, tab.active && styles.navLabelActive]}
            >
              {tab.label}
            </Text>
            {tab.active && <View style={styles.navDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#fff",
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
  },
  greeting: { fontSize: 22, fontWeight: "900", color: "#111" },
  subGreeting: { fontSize: 13, color: "#888", marginTop: 3 },
  avatarBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 22 },
  sosSection: {
    backgroundColor: "#8B0000",
    paddingVertical: 36,
    alignItems: "center",
  },
  sosLabel: {
    color: "#ffcccc",
    fontSize: 15,
    fontStyle: "italic",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  sosBtn: {
    width: SOS_R * 2,
    height: SOS_R * 2,
    borderRadius: SOS_R,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    borderWidth: 5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  sosBtnActive: { backgroundColor: "#c62828" },
  sosText: {
    fontSize: Math.floor(SOS_R * 0.55),
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 6,
  },
  sosSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 2,
    fontWeight: "700",
    marginTop: 4,
  },
  shakeHint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 20,
    fontStyle: "italic",
  },
  locationStatus: {
    color: "#a5d6a7",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "600",
  },
  locationFetching: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 8,
  },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222",
    marginBottom: 14,
    fontStyle: "italic",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: (SCREEN_WIDTH - 48) / 3,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderTopWidth: 4,
    elevation: 3,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    lineHeight: 16,
  },
  dialRow: { flexDirection: "row", justifyContent: "space-between" },
  dialBtn: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  dialNum: { color: "#fff", fontSize: 20, fontWeight: "900", letterSpacing: 1 },
  dialLbl: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 3,
  },
  navBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1.5,
    borderTopColor: "#eee",
    paddingBottom: 8,
    paddingTop: 6,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  navIcon: { fontSize: 16, fontWeight: "800", color: "#aaa" },
  navIconActive: { color: "#8B0000" },
  navLabel: { fontSize: 9, color: "#aaa", marginTop: 2, fontWeight: "500" },
  navLabelActive: { color: "#8B0000", fontWeight: "700" },
  navDot: {
    position: "absolute",
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#8B0000",
  },
});

export default HomeScreen;
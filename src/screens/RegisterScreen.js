 import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import database from "@react-native-firebase/database";
import auth from "@react-native-firebase/auth";

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Female",
    phone: "",
    address: "",
    bloodGroup: "",
  });

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirm, setConfirm] = useState(null);

  const genderOptions = ["Female", "Male", "Other"];
  const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  // Step 1 - Validate form and send OTP
  const handleSendOTP = async () => {
    if (!form.name || !form.age || !form.phone || !form.address) {
      Alert.alert("Error", "Please fill all required fields marked with *");
      return;
    }
    if (form.phone.length !== 10) {
      Alert.alert("Error", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(
        "+91" + form.phone,
      );
      setConfirm(confirmation);
      setOtpSent(true);
      setLoading(false);
      Alert.alert("OTP Sent ✅", `Verification code sent to +91${form.phone}`);
    } catch (error) {
      setLoading(false);
      console.error("OTP error:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  // Step 2 - Verify OTP and register
  const handleVerifyAndRegister = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Error", "Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      // Verify OTP with Firebase Auth
      await confirm.confirm(otp);

      // Save to AsyncStorage locally
      await AsyncStorage.setItem("disha_user", JSON.stringify(form));

      // Save to Firebase Database
      await database()
        .ref(`/Users/${form.phone}`)
        .set({
          name: form.name,
          age: form.age,
          gender: form.gender,
          phone: form.phone,
          address: form.address,
          bloodGroup: form.bloodGroup || "Not specified",
          registeredAt: new Date().toISOString(),
        });

      setLoading(false);
      Alert.alert(
        "Registration Successful! 🎉",
        `Welcome ${form.name}! Your data is securely stored.`,
        [{ text: "Proceed", onPress: () => navigation.replace("MainApp") }],
      );
    } catch (error) {
      setLoading(false);
      console.error("Verification error:", error);
      Alert.alert("Error", "Invalid OTP. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <Text style={styles.headerTitle}>Create Your Account</Text>
          <Text style={styles.headerSubtitle}>
            Register once to use all Disha safety features
          </Text>
        </View>

        <View style={styles.form}>
          {!otpSent ? (
            <>
              {/* Full Name */}
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={form.name}
                onChangeText={(val) => setForm({ ...form, name: val })}
              />

              {/* Age */}
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                value={form.age}
                keyboardType="numeric"
                maxLength={3}
                onChangeText={(val) => setForm({ ...form, age: val })}
              />

              {/* Gender */}
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.optionsRow}>
                {genderOptions.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.optionBtn,
                      form.gender === g && styles.optionBtnActive,
                    ]}
                    onPress={() => setForm({ ...form, gender: g })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        form.gender === g && styles.optionTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Phone */}
              <Text style={styles.label}>Mobile Number *</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="10-digit mobile number"
                  value={form.phone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  onChangeText={(val) => setForm({ ...form, phone: val })}
                />
              </View>

              {/* Address */}
              <Text style={styles.label}>Address *</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Enter your full address"
                value={form.address}
                multiline
                numberOfLines={3}
                onChangeText={(val) => setForm({ ...form, address: val })}
              />

              {/* Blood Group */}
              <Text style={styles.label}>Blood Group</Text>
              <View style={styles.optionsRow}>
                {bloodGroups.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[
                      styles.optionBtn,
                      form.bloodGroup === b && styles.optionBtnActive,
                    ]}
                    onPress={() => setForm({ ...form, bloodGroup: b })}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        form.bloodGroup === b && styles.optionTextActive,
                      ]}
                    >
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Privacy Notice */}
              <View style={styles.privacyBox}>
                <Text style={styles.privacyTitle}>🔒 Privacy Notice</Text>
                <Text style={styles.privacyText}>
                  • Your phone number will be verified via OTP{"\n"}• Only YOU
                  can access your personal data{"\n"}• SOS recordings are stored
                  securely{"\n"}• Only authorized admin can view SOS alerts
                  {"\n"}• We never share your data with third parties
                </Text>
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.registerBtnText}>
                    SEND OTP & VERIFY 📱
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* OTP Verification Screen */}
              <View style={styles.otpSection}>
                <Text style={styles.otpEmoji}>📱</Text>
                <Text style={styles.otpTitle}>Verify Your Number</Text>
                <Text style={styles.otpSubtitle}>
                  Enter the 6-digit OTP sent to{"\n"}
                  <Text style={{ fontWeight: "bold", color: "#8B0000" }}>
                    +91 {form.phone}
                  </Text>
                </Text>

                <TextInput
                  style={styles.otpInput}
                  placeholder="• • • • • •"
                  value={otp}
                  keyboardType="numeric"
                  maxLength={6}
                  onChangeText={setOtp}
                />

                <TouchableOpacity
                  style={[
                    styles.registerBtn,
                    { width: "100%" },
                    loading && { opacity: 0.7 },
                  ]}
                  onPress={handleVerifyAndRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.registerBtnText}>
                      VERIFY & REGISTER 🛡️
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={() => {
                    setOtpSent(false);
                    setOtp("");
                  }}
                >
                  <Text style={styles.resendText}>← Change Phone Number</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.disclaimer}>
            🔒 Your data is encrypted and stored securely in Firebase. Only you
            can access your personal information.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "#8B0000",
    padding: 30,
    alignItems: "center",
    paddingTop: 50,
  },
  shieldIcon: { fontSize: 50 },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  headerSubtitle: {
    color: "#ffcccc",
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },
  form: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: "#333",
  },
  multilineInput: { height: 80, textAlignVertical: "top" },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  countryCode: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  countryCodeText: { fontSize: 14, color: "#333", fontWeight: "600" },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  optionBtnActive: { backgroundColor: "#8B0000", borderColor: "#8B0000" },
  optionText: { fontSize: 13, color: "#555" },
  optionTextActive: { color: "#fff", fontWeight: "600" },
  privacyBox: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 15,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#8B0000",
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#8B0000",
    marginBottom: 8,
  },
  privacyText: { fontSize: 13, color: "#555", lineHeight: 22 },
  registerBtn: {
    backgroundColor: "#8B0000",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    elevation: 4,
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  otpSection: { alignItems: "center", paddingVertical: 20 },
  otpEmoji: { fontSize: 60, marginBottom: 10 },
  otpTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  otpSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  otpInput: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#8B0000",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 28,
    letterSpacing: 10,
    textAlign: "center",
    width: "80%",
    marginBottom: 10,
    color: "#333",
  },
  resendBtn: { marginTop: 15, padding: 10 },
  resendText: { color: "#8B0000", fontSize: 14, fontWeight: "600" },
  disclaimer: {
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    marginTop: 15,
    marginBottom: 30,
  },
});

export default RegisterScreen;
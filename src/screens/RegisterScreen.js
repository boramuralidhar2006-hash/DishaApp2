import React, { useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    phone: '',
    address: '',
    bloodGroup: '',
  });

  // ← ADDED: volunteer toggle state
  const [isVolunteer, setIsVolunteer] = useState(false);

  const genderOptions = ['Female', 'Male', 'Other'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const handleRegister = async () => {
    if (!form.name || !form.age || !form.phone || !form.address) {
      Alert.alert('Error', 'Please fill all required fields marked with *');
      return;
    }
    if (form.phone.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }
    try {
      // ← MODIFIED: save role along with form data
      const userData = { ...form, role: isVolunteer ? 'volunteer' : 'user' };
      await AsyncStorage.setItem('disha_user', JSON.stringify(userData));

      Alert.alert(
        'Registration Successful! 🎉',
        `Welcome ${form.name}! You are now registered as a ${isVolunteer ? 'Volunteer 🛡️' : 'User'}.`,
        [{
          text: 'Proceed',
          // ← MODIFIED: navigate based on role
          onPress: () => isVolunteer
            ? navigation.replace('VolunteerDashboard')
            : navigation.replace('MainApp'),
        }]
      );
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name */}
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={form.name}
            onChangeText={val => setForm({ ...form, name: val })}
          />

          {/* Age */}
          <Text style={styles.label}>Age *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your age"
            value={form.age}
            keyboardType="numeric"
            maxLength={3}
            onChangeText={val => setForm({ ...form, age: val })}
          />

          {/* Gender */}
          <Text style={styles.label}>Gender *</Text>
          <View style={styles.optionsRow}>
            {genderOptions.map(g => (
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
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit mobile number"
            value={form.phone}
            keyboardType="phone-pad"
            maxLength={10}
            onChangeText={val => setForm({ ...form, phone: val })}
          />

          {/* Address */}
          <Text style={styles.label}>Address *</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Enter your full address"
            value={form.address}
            multiline
            numberOfLines={3}
            onChangeText={val => setForm({ ...form, address: val })}
          />

          {/* Blood Group */}
          <Text style={styles.label}>Blood Group</Text>
          <View style={styles.optionsRow}>
            {bloodGroups.map(b => (
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

          {/* ← ADDED: Volunteer Toggle */}
          <View style={styles.volunteerRow}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                isVolunteer && styles.checkboxActive,
              ]}
              onPress={() => setIsVolunteer(!isVolunteer)}
            >
              {isVolunteer && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.volunteerLabel}>Register as Volunteer 🛡️</Text>
          </View>
          <Text style={styles.volunteerHint}>
            Check this if you want to help respond to SOS alerts
          </Text>

          {/* Register Button */}
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
            <Text style={styles.registerBtnText}>REGISTER NOW 🛡️</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your data is stored securely and only used for emergency purposes.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#8B0000',
    padding: 30,
    alignItems: 'center',
    paddingTop: 50,
  },
  shieldIcon: {
    fontSize: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerSubtitle: {
    color: '#ffcccc',
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 5,
  },
  optionBtnActive: {
    backgroundColor: '#8B0000',
    borderColor: '#8B0000',
  },
  optionText: {
    fontSize: 13,
    color: '#555',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // ← ADDED: Volunteer toggle styles
  volunteerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 5,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#8B0000',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#8B0000',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  volunteerLabel: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  volunteerHint: {
    color: '#888',
    fontSize: 12,
    marginBottom: 10,
    marginLeft: 34,
  },

  registerBtn: {
    backgroundColor: '#8B0000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disclaimer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 15,
    marginBottom: 30,
  },
});

export default RegisterScreen;
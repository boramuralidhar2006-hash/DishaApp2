import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accelerometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';

const HomeScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [sosActive, setSosActive] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shakeCountRef = useRef(0);
  const shakeTimerRef = useRef(null);
  const lastShakeRef = useRef(0);

  // SOS Pulse Animation
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startPulse();
    loadUser();
    setupShakeDetection();
    return () => {
      // Cleanup
    };
  }, []);

  // ← MODIFIED: check role and redirect volunteer
  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('disha_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      // If a volunteer lands on HomeScreen, redirect them to VolunteerDashboard
      if (parsed.role === 'volunteer') {
        navigation.replace('VolunteerDashboard');
      }
    }
  };

  // Shake Detection using Accelerometer
  const setupShakeDetection = () => {
    try {
      setUpdateIntervalForType(SensorTypes.accelerometer, 100);
      accelerometer.subscribe(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        if (magnitude > 18 && now - lastShakeRef.current > 200) {
          lastShakeRef.current = now;
          shakeCountRef.current += 1;
          setShakeCount(shakeCountRef.current);

          if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
          shakeTimerRef.current = setTimeout(() => {
            shakeCountRef.current = 0;
            setShakeCount(0);
          }, 2000);

          if (shakeCountRef.current >= 5) {
            shakeCountRef.current = 0;
            setShakeCount(0);
            triggerSOS('shake');
          }
        }
      });
    } catch (error) {
      console.log('Accelerometer not available:', error);
    }
  };

  // SOS Trigger
  const triggerSOS = (type = 'button') => {
    if (sosActive) return;
    setSosActive(true);
    Vibration.vibrate([500, 500, 500, 500, 500]);
    navigation.navigate('SOSAlert', { triggerType: type, user });
    setTimeout(() => setSosActive(false), 5000);
  };

  const handleSOSPress = () => {
    Alert.alert(
      '🚨 SEND SOS ALERT?',
      'This will immediately alert the Disha Control Room and your emergency contacts with your current location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND SOS NOW',
          style: 'destructive',
          onPress: () => triggerSOS('button'),
        },
      ]
    );
  };

  const quickActions = [
    { icon: '👥', label: 'Emergency\nContacts', screen: 'Contacts',  color: '#4CAF50' },
    { icon: '📍', label: 'Track My\nTravel',    screen: 'Track',     color: '#2196F3' },
    { icon: '🏥', label: 'Nearby\nServices',    screen: 'Nearby',    color: '#FF9800' },
    { icon: '📋', label: 'File\nComplaint',     screen: 'Complaint', color: '#9C27B0' },
    { icon: '📞', label: 'Helplines',           screen: 'Helpline',  color: '#F44336' },
    { icon: '🩸', label: 'Blood\nBanks',        screen: 'Nearby',    color: '#E91E63' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.name || 'User'} 👋
          </Text>
          <Text style={styles.subGreeting}>Stay Safe | Disha App</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Shake Indicator */}
      {shakeCount > 0 && (
        <View style={styles.shakeBanner}>
          <Text style={styles.shakeText}>
            📳 Shake detected: {shakeCount}/5 — Shake 5 times to trigger SOS!
          </Text>
        </View>
      )}

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <Text style={styles.sosHint}>Press in case of emergency</Text>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.sosButton, sosActive && styles.sosButtonActive]}
            onPress={handleSOSPress}
            activeOpacity={0.85}
          >
            <Text style={styles.sosIcon}>🆘</Text>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubText}>PRESS FOR HELP</Text>
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.shakeHint}>
          📳 OR shake phone 5 times quickly
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { borderTopColor: action.color }]}
              onPress={() => navigation.navigate(action.screen)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Emergency Dial Buttons */}
      <View style={styles.dialSection}>
        <Text style={styles.sectionTitle}>Emergency Dial</Text>
        <View style={styles.dialRow}>
          <TouchableOpacity
            style={[styles.dialBtn, { backgroundColor: '#F44336' }]}
            onPress={() => Linking.openURL('tel:100')}
          >
            <Text style={styles.dialNumber}>100</Text>
            <Text style={styles.dialLabel}>Police</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dialBtn, { backgroundColor: '#4CAF50' }]}
            onPress={() => Linking.openURL('tel:108')}
          >
            <Text style={styles.dialNumber}>108</Text>
            <Text style={styles.dialLabel}>Ambulance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dialBtn, { backgroundColor: '#2196F3' }]}
            onPress={() => Linking.openURL('tel:112')}
          >
            <Text style={styles.dialNumber}>112</Text>
            <Text style={styles.dialLabel}>Emergency</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dialBtn, { backgroundColor: '#FF9800' }]}
            onPress={() => Linking.openURL('tel:181')}
          >
            <Text style={styles.dialNumber}>181</Text>
            <Text style={styles.dialLabel}>Women Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Safety Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Safety Tip 💡</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            Always inform a trusted person about your whereabouts. Use the
            "Track My Travel" feature when traveling alone at night.
          </Text>
        </View>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#8B0000',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  subGreeting: {
    color: '#ffcccc',
    fontSize: 13,
    marginTop: 3,
  },
  profileBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 22,
  },
  shakeBanner: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    alignItems: 'center',
  },
  shakeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  sosSection: {
    alignItems: 'center',
    backgroundColor: '#8B0000',
    paddingBottom: 40,
    paddingTop: 10,
  },
  sosHint: {
    color: '#ffcccc',
    fontSize: 14,
    marginBottom: 20,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 15,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    borderWidth: 5,
    borderColor: '#FF6666',
  },
  sosButtonActive: {
    backgroundColor: '#CC0000',
  },
  sosIcon: {
    fontSize: 45,
  },
  sosText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 4,
  },
  sosSubText: {
    color: '#ffcccc',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  shakeHint: {
    color: '#ffcccc',
    fontSize: 13,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsSection: {
    padding: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '30%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderTopWidth: 4,
    flexGrow: 1,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    fontWeight: '600',
  },
  dialSection: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  dialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dialBtn: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 3,
  },
  dialNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dialLabel: {
    color: '#fff',
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600',
  },
  tipsSection: {
    padding: 20,
  },
  tipCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  tipText: {
    color: '#555',
    fontSize: 14,
    lineHeight: 22,
  },
});

export default HomeScreen;
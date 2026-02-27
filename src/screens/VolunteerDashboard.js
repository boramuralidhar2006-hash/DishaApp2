import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { db, storage } from '../firebase/firebaseConfig';
import { ref as dbRef, onValue } from 'firebase/database';
import { ref as storageRef, listAll, getDownloadURL } from 'firebase/storage';

const { width } = Dimensions.get('window');

const POLICE_CONTACTS = [
  { id: '1', name: 'Women Helpline',      number: '1091' },
  { id: '2', name: 'National Emergency',  number: '112'  },
  { id: '3', name: 'Police',              number: '100'  },
  { id: '4', name: 'Ambulance',           number: '108'  },
];

export default function VolunteerDashboard() {
  const [activeTab,       setActiveTab]       = useState('sos');
  const [sosAlerts,       setSosAlerts]       = useState([]);
  const [videos,          setVideos]          = useState([]);
  const [loadingSOS,      setLoadingSOS]      = useState(true);
  const [loadingVideos,   setLoadingVideos]   = useState(true);
  const [selectedVideo,   setSelectedVideo]   = useState(null);

  // ── Fetch SOS alerts (real-time) ──
  useEffect(() => {
    const sosRef = dbRef(db, 'sos_alerts');
    const unsubscribe = onValue(sosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([key, value]) => ({ id: key, ...value }))
          .sort((a, b) => b.timestamp - a.timestamp);
        setSosAlerts(list);
      } else {
        setSosAlerts([]);
      }
      setLoadingSOS(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Fetch Videos from Firebase Storage ──
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videosRef = storageRef(storage, 'sos_videos/');
        const result = await listAll(videosRef);
        const videoList = await Promise.all(
          result.items.map(async (item) => ({
            id:   item.name,
            name: item.name,
            url:  await getDownloadURL(item),
          }))
        );
        setVideos(videoList);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setVideos([]); // silently handle — storage may not be enabled yet
      }
      setLoadingVideos(false);
    };
    fetchVideos();
  }, []);

  const openMap = (latitude, longitude) => {
    Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`)
      .catch(() => Alert.alert('Error', 'Could not open maps.'));
  };

  const callNumber = (number) => {
    Linking.openURL(`tel:${number}`)
      .catch(() => Alert.alert('Error', 'Could not make the call.'));
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    return new Date(timestamp).toLocaleString();
  };

  // ── SOS Tab ──
  const renderSOSTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🚨 Active SOS Alerts</Text>
      {loadingSOS ? (
        <ActivityIndicator size="large" color="#E53935" style={{ marginTop: 30 }} />
      ) : sosAlerts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>No active SOS alerts right now.</Text>
        </View>
      ) : (
        <FlatList
          data={sosAlerts}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>👤 {item.name || 'Unknown User'}</Text>
                <View style={styles.sosBadge}>
                  <Text style={styles.sosBadgeText}>SOS</Text>
                </View>
              </View>
              <Text style={styles.cardInfo}>🕐 {formatTime(item.timestamp)}</Text>
              <Text style={styles.cardInfo}>
                📍 Lat: {item.latitude?.toFixed(5)},  Lng: {item.longitude?.toFixed(5)}
              </Text>
              {item.address && (
                <Text style={styles.cardInfo}>🏠 {item.address}</Text>
              )}
              <TouchableOpacity
                style={styles.mapButton}
                onPress={() => openMap(item.latitude, item.longitude)}
              >
                <Text style={styles.mapButtonText}>📌 Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );

  // ── Police Tab ──
  const renderPoliceTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>👮 Police & Emergency Contacts</Text>
      {POLICE_CONTACTS.map((contact) => (
        <View key={contact.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{contact.name}</Text>
            <Text style={styles.contactNumber}>{contact.number}</Text>
          </View>
          <TouchableOpacity
            style={styles.callButton}
            onPress={() => callNumber(contact.number)}
          >
            <Text style={styles.callButtonText}>📞 Call Now</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  // ── Videos Tab ──
  const renderVideosTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>🎥 SOS Evidence Videos</Text>
      {loadingVideos ? (
        <ActivityIndicator size="large" color="#E53935" style={{ marginTop: 30 }} />
      ) : videos.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>🎥</Text>
          <Text style={styles.emptyText}>No videos found in storage.</Text>
          <Text style={styles.emptyHint}>Videos recorded during SOS will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardName}>🎬 {item.name}</Text>
              <View style={styles.videoButtonRow}>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => setSelectedVideo(item.url)}
                >
                  <Text style={styles.playButtonText}>▶ Play Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => Linking.openURL(item.url)}
                >
                  <Text style={styles.downloadButtonText}>⬇ Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Video Modal */}
      <Modal
        visible={!!selectedVideo}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Video Preview</Text>
            <Text style={styles.modalNote}>
              Tap "Open in Browser" to play the video.
            </Text>
            <TouchableOpacity
              style={styles.openBrowserButton}
              onPress={() => { Linking.openURL(selectedVideo); setSelectedVideo(null); }}
            >
              <Text style={styles.openBrowserText}>🌐 Open in Browser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedVideo(null)}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ Volunteer Dashboard</Text>
        <Text style={styles.headerSubtitle}>Safe Circle – Responder View</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'sos',    label: '🚨 SOS',    count: sosAlerts.length },
          { key: 'police', label: '👮 Police' },
          { key: 'videos', label: '🎥 Videos' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'sos'    && renderSOSTab()}
        {activeTab === 'police' && renderPoliceTab()}
        {activeTab === 'videos' && renderVideosTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F5F5F5' },
  header:             { backgroundColor: '#B71C1C', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:        { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerSubtitle:     { color: '#FFCDD2', fontSize: 13, marginTop: 2 },

  tabBar:             { flexDirection: 'row', backgroundColor: '#fff', elevation: 3 },
  tabItem:            { flex: 1, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabItemActive:      { borderBottomColor: '#B71C1C' },
  tabLabel:           { fontSize: 13, color: '#888', fontWeight: '500' },
  tabLabelActive:     { color: '#B71C1C', fontWeight: 'bold' },
  badge:              { backgroundColor: '#E53935', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 4, paddingHorizontal: 3 },
  badgeText:          { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  content:            { flex: 1 },
  tabContent:         { padding: 16 },
  sectionTitle:       { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12 },

  card:               { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  cardHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardName:           { fontSize: 15, fontWeight: 'bold', color: '#222', flex: 1 },
  cardInfo:           { fontSize: 13, color: '#555', marginBottom: 4 },

  sosBadge:           { backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sosBadgeText:       { color: '#C62828', fontWeight: 'bold', fontSize: 12 },

  mapButton:          { marginTop: 10, backgroundColor: '#E53935', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  mapButtonText:      { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  contactNumber:      { fontSize: 18, fontWeight: 'bold', color: '#B71C1C' },
  callButton:         { marginTop: 10, backgroundColor: '#1B5E20', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  callButtonText:     { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  videoButtonRow:     { flexDirection: 'row', gap: 10, marginTop: 10 },
  playButton:         { flex: 1, backgroundColor: '#1565C0', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  playButtonText:     { color: '#fff', fontWeight: 'bold' },
  downloadButton:     { flex: 1, backgroundColor: '#4CAF50', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  downloadButtonText: { color: '#fff', fontWeight: 'bold' },

  emptyBox:           { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  emptyIcon:          { fontSize: 48, marginBottom: 10 },
  emptyText:          { fontSize: 15, color: '#555', fontWeight: '600' },
  emptyHint:          { fontSize: 13, color: '#aaa', marginTop: 5 },

  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox:           { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: width * 0.85, alignItems: 'center' },
  modalTitle:         { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  modalNote:          { fontSize: 13, color: '#555', textAlign: 'center', marginBottom: 16 },
  openBrowserButton:  { backgroundColor: '#1565C0', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24, marginBottom: 10 },
  openBrowserText:    { color: '#fff', fontWeight: 'bold' },
  closeButton:        { paddingVertical: 8 },
  closeButtonText:    { color: '#E53935', fontWeight: 'bold', fontSize: 14 },
});
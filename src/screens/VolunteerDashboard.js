import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Video } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js"; // we will create this

export default function VolunteerDashboard() {
  const [sosData, setSosData] = useState([]);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const unsubscribeSOS = onSnapshot(
      collection(db, "sos_alerts"),
      snapshot => {
        const data = snapshot.docs.map(doc => doc.data());
        setSosData(data);
      }
    );

    const unsubscribeVideos = onSnapshot(
      collection(db, "video_recordings"),
      snapshot => {
        const data = snapshot.docs.map(doc => doc.data());
        setVideos(data);
      }
    );

    return () => {
      unsubscribeSOS();
      unsubscribeVideos();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Volunteer Dashboard</Text>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 17.385,
          longitude: 78.4867,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {sosData.map((item, index) => (
          <Marker
            key={index}
            coordinate={{
              latitude: item.latitude,
              longitude: item.longitude,
            }}
            title="SOS Alert"
          />
        ))}
      </MapView>

      <Text style={styles.subHeading}>Live Videos</Text>
      <FlatList
        data={videos}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text style={styles.videoItem}>{item.videoUrl}</Text>
        )}
      />

      <Text style={styles.subHeading}>Nearest Police Stations</Text>
      <Text>Central Police Station - 1.2km</Text>
      <Text>City Police HQ - 2.5km</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  heading: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subHeading: { fontSize: 18, marginTop: 10 },
  map: { width: "100%", height: 250 },
  videoItem: { marginVertical: 5, color: "blue" }
});
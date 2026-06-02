import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";

const BASE_URL = "http://10.1.11.239:9000/api/presensi";

export default function LocationScreen() {
  const [loading, setLoading] = useState(true);
  const [mapVisible, setMapVisible] = useState(false);
  const [location, setLocation] = useState(null);
  const [region, setRegion] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapStatus, setMapStatus] = useState("Belum Dicek");

  useEffect(() => {
    (async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          alert("Permission lokasi ditolak");
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const initialRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setLocation(loc);
        setRegion(initialRegion);

        setSelectedLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    })();
  }, []);

  const handleMapStatusChange = async () => {
    try {
        if (!selectedLocation) return;

        const lat = selectedLocation.latitude;
        const lng = selectedLocation.longitude;

        const res = await axios.post(
        `${BASE_URL}/locate`,
        {
            lat,
            lng,
        }
        );

        setMapStatus(res.data);
    } catch (err) {
        console.log("API ERROR:", err.response?.data || err.message);
    }
    };

  const goToMyLocation = () => {
    if (!location) return;

    const newRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);

    setSelectedLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  const handleMapPress = (e) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  if (loading || !region) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Your Location</Text>

        <Text style={styles.value}>
          Lat : {selectedLocation?.latitude?.toFixed(6)}
        </Text>

        <Text style={styles.value}>
          Lng : {selectedLocation?.longitude?.toFixed(6)}
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => setMapVisible(true)}
        >
          <Text style={styles.primaryText}>Choose Location</Text>
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          onPress={handleMapStatusChange}
        >
          <Text style={styles.primaryText}>Check My Location</Text>
        </Pressable>

        <Text style={styles.value}>
          Status Area : {mapStatus}
        </Text>
      </View>

      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            region={region}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker coordinate={selectedLocation} />
            )}
          </MapView>

          <View style={styles.floating}>
            <Pressable
              onPress={goToMyLocation}
              style={styles.circleBtn}
            >
              <Text style={styles.icon}>📍</Text>
            </Pressable>

            <Pressable
              style={[styles.circleBtn, styles.confirm]}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.icon}>✔</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    alignItems: "center",
  },

  label: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
  },

  value: {
    fontSize: 16,
    marginTop: 5,
  },

  muted: {
    marginTop: 10,
    color: "#666",
  },

  primaryButton: {
    marginTop: 15,
    backgroundColor: "#0d1620",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "bold",
  },

  floating: {
    position: "absolute",
    right: 20,
    bottom: 20,
    gap: 10,
  },

  circleBtn: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  confirm: {
    backgroundColor: "#258850",
  },

  icon: {
    fontSize: 22,
  },
});
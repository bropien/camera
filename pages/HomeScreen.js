import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Button,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

export default function HomeScreen() {
  const navigation = useNavigation();

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [locationStatus, setLocationStatus] = useState("checking");
  const [distance, setDistance] = useState(0);

  const KAMPUS_LAT = -6.346;
  const KAMPUS_LON = 107.149;
  const MAKSIMAL_JARAK_METER = 500;

  const BASE_URL = "http://10.1.11.239:9000/api/presensi";

  useEffect(() => {
    if (permission?.granted) {
      verifyLocation();
    }
  }, [permission]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;

    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(p1) *
        Math.cos(p2) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const verifyLocation = async () => {
    setLocationStatus("checking");

    try {
        const { status } =
        await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
        Alert.alert(
            "Akses Ditolak",
            "Izin lokasi diperlukan"
        );

        setLocationStatus("error");
        return;
        }

        const currentLocation =
        await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const jarak = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        KAMPUS_LAT,
        KAMPUS_LON
        );

        console.log(
        "Latitude:",
        currentLocation.coords.latitude
        );

        console.log(
        "Longitude:",
        currentLocation.coords.longitude
        );

        console.log(
        "Distance:",
        Math.round(jarak)
        );

        setDistance(Math.round(jarak));

        if (jarak <= MAKSIMAL_JARAK_METER) {
        setLocationStatus("valid");
        } else {
        setLocationStatus("invalid");
        }
    } catch (error) {
        console.log(error);

        Alert.alert(
        "Error Lokasi",
        "Gagal mendapatkan lokasi GPS"
        );

        setLocationStatus("error");
    }
    };

  const handleBarCodeScanned = ({ data }) => {
    if (!isScanning) return;

    setIsScanning(false);

    try {
      const qrData = JSON.parse(data);

      setScannedData(qrData);

      Alert.alert(
        "QR Terdeteksi",
        `Mata Kuliah : ${qrData.kodeMk}\nPertemuan : ${qrData.pertemuanKe}\nRuangan : ${qrData.ruangan}`,
        [
          {
            text: "Batal",
            style: "cancel",
            onPress: () => {
              setIsScanning(true);
            },
          },
          {
            text: "Check In",
            onPress: () =>
              handleSubmitPresensi(qrData),
          },
        ]
      );
    } catch {
      Alert.alert("QR Tidak Valid");
      setIsScanning(true);
    }
  };

  const handleSubmitPresensi = async (qrData) => {
    try {
      const payload = {
        kodeMk: qrData.kodeMk,
        nimMhs: "0320240090",
        pertemuanKe: qrData.pertemuanKe,
        jamPresensi: new Date().toLocaleTimeString("en-GB"),
        status: "Present",
        ruangan: qrData.ruangan,
      };

      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          "Berhasil",
          "Presensi berhasil disimpan"
        );
      } else {
        Alert.alert(
          "Gagal",
          result.message || "Terjadi kesalahan"
        );
      }
    } catch {
      Alert.alert(
        "Error",
        "Tidak dapat terhubung ke server"
      );
    } finally {
      setScannedData(null);
      setIsScanning(true);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Izin kamera diperlukan</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={requestPermission}
        >
          <Text style={{ color: "#fff" }}>
            Aktifkan Kamera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (locationStatus === "checking") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Memverifikasi lokasi...</Text>
      </View>
    );
  }

  if (locationStatus === "invalid") {
    return (
        <View style={styles.center}>
        <MaterialIcons
            name="block"
            size={90}
            color="red"
        />

        <Text
            style={{
            fontSize: 24,
            fontWeight: "bold",
            marginTop: 15,
            }}
        >
            Akses Ditolak
        </Text>

        <Text
            style={{
            textAlign: "center",
            marginTop: 15,
            paddingHorizontal: 25,
            }}
        >
            Anda berada {distance} meter dari
            titik kampus.
        </Text>

        <Text
            style={{
            textAlign: "center",
            marginTop: 10,
            paddingHorizontal: 25,
            }}
        >
            Maksimal jarak yang diizinkan adalah
            {` ${MAKSIMAL_JARAK_METER} meter`}
        </Text>

        <View style={{ marginTop: 20 }}>
            <Button
            title="Cek Ulang Lokasi"
            onPress={verifyLocation}
            />
        </View>
        </View>
    );
    }

  if (locationStatus === "error") {
    return (
        <View style={styles.center}>
        <MaterialIcons
            name="error"
            size={80}
            color="orange"
        />

        <Text
            style={{
            fontSize: 20,
            fontWeight: "bold",
            marginTop: 15,
            }}
        >
            Gagal Mendapatkan Lokasi
        </Text>

        <Button
            title="Coba Lagi"
            onPress={verifyLocation}
        />
        </View>
    );
    }

  return (
    <View style={styles.container}>
        <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={
            isScanning
            ? handleBarCodeScanned
            : undefined
        }
        barCodeScannerSettings={{
            barcodeTypes: ["qr"],
        }}
        />

        <View style={styles.overlay}>
        <View style={styles.validBadge}>
            <MaterialIcons
            name="check-circle"
            size={18}
            color="#fff"
            />

            <Text style={styles.validText}>
            Lokasi Valid ({distance}m)
            </Text>
        </View>

        <Text style={styles.scanText}>
            Pindai QR Code
        </Text>

        {!isScanning && (
            <Button
            title="Scan Lagi"
            onPress={() => setIsScanning(true)}
            />
        )}
        </View>
    </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 50,
  },
  scanText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
  },
  btn: {
    backgroundColor: "#007bff",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
  },
  validBadge: {
  position: "absolute",
  top: 80,
  alignSelf: "center",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#28a745",
  paddingHorizontal: 15,
  paddingVertical: 8,
  borderRadius: 20,
},

validText: {
  color: "#fff",
  fontWeight: "bold",
  marginLeft: 5,
},
});
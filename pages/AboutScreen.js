import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AboutScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [profilPhoto, setProfilPhoto] = useState(null);

  const cameraRef = useRef(null);

  const STORAGE_KEY = "@profil_photo";

  useEffect(() => {
    loadProfilPhoto();
  }, []);

  // Load foto
  const loadProfilPhoto = async () => {
    try {
      const savedPhotoUri = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedPhotoUri !== null) {
        setProfilPhoto(savedPhotoUri);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Ambil foto
  const takePicture = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
        });

        setProfilPhoto(photo.uri);

        await AsyncStorage.setItem(STORAGE_KEY, photo.uri);

        setIsCameraOpen(false);

        Alert.alert("Berhasil", "Foto berhasil disimpan");
      }
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "Gagal mengambil foto");
    }
  };

  // Loading permission
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Memuat izin kamera...</Text>
      </View>
    );
  }

  // Tampilan kamera
  if (isCameraOpen) {
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.infoText}>
            Izin kamera diperlukan
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>
              Izinkan Kamera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonDanger}
            onPress={() => setIsCameraOpen(false)}
          >
            <Text style={styles.buttonText}>
              Batal
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          facing="front"
        >
          <View style={styles.cameraOverlay}>
            <View style={styles.captureContainer}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <Text style={styles.captureButtonText}>
                  Ambil Foto
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsCameraOpen(false)}
              >
                <Text style={styles.buttonText}>
                  Batal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  // Tampilan utama
  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.imageContainer}>
          {profilPhoto ? (
            <Image
              source={{ uri: profilPhoto }}
              style={styles.profilImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>
                Profile Photo
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.nameText}>
          Muhammad Zakky Raihan
        </Text>

        <Text style={styles.nimText}>
          0320240090
        </Text>

        <Text style={styles.programText}>
          Teknologi Rekayasa Perangkat Lunak
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setIsCameraOpen(true)}
        >
          <Text style={styles.buttonText}>
            {profilPhoto
              ? "Ganti Foto Profil"
              : "Ambil Foto Profil"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    justifyContent: "center",
    alignItems: "center",
  },

  profileCard: {
    backgroundColor: "white",
    width: "85%",
    padding: 30,
    borderRadius: 15,
    alignItems: "center",

    elevation: 5,

    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },

  imageContainer: {
    marginBottom: 20,
  },

  profilImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: "#0056b3",
  },

  placeholderImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0056b3",
    borderStyle: "dashed",
  },

  placeholderText: {
    color: "#6c757d",
    fontWeight: "bold",
  },

  nameText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },

  nimText: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },

  programText: {
    fontSize: 14,
    color: "#777",
    marginBottom: 20,
    textAlign: "center",
  },

  button: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },

  buttonDanger: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  infoText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },

  cameraOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },

  captureContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 30,
  },

  captureButton: {
    backgroundColor: "white",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
  },

  captureButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },

  cancelButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
});
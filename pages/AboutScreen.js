import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AboutScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [profilPhoto, setProfilPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mahasiswa, setMahasiswa] = useState(null);

  const cameraRef = useRef(null);
  const NIM_USER = "0320240090";
  const BASE_URL = "http://10.1.11.239:9000/api/mahasiswa";
  const STORAGE_KEY = "@profil_photo";

  useEffect(() => {
    loadProfilPhoto();
  }, []);

  useEffect(() => {
    fetchMahasiswa();
  },[]);


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
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
        });
        uploadPhoto(photo.uri);
    }
  };

  const fetchMahasiswa = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${NIM_USER}`);
      if (response.ok) {
        const json = await response.json();
        console.log("Response JSON:", json);
        setMahasiswa(json.data); // <-- ambil field data
      } else {
        console.log("Response not OK:", response.status);
      }
    } catch (error) {
      console.log("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  const uploadPhoto = async (uri) => {
    await AsyncStorage.setItem(STORAGE_KEY, uri);
    setProfilPhoto(uri);

    setIsLoading(true);

    const formData = new FormData();
    formData.append("nim", NIM_USER);
    formData.append("nama", "Muhammad Zakky Raihan");

    formData.append('foto', {
        uri:uri,
        name: 'selfie.jpg',
        type: 'image/jpeg'
    });

    try {
        const response = await fetch(`${BASE_URL}/upload`, {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if(response.ok) {
            Alert.alert("Sukses", "Foto profil berhasil diunggah");
            fetchMahasiswa();
        }
    } catch (error) {
        Alert.alert("Error", "Gagal mengunggah foto profil");
    } finally {
        setIsLoading(false);
        setIsCameraOpen(false);
    }
  };

  if (isLoading) 
    return <ActivityIndicator size="large" style={{flex:1}} />;

  if (isCameraOpen) {
    if (!permission) return <View style={styles.container}>
        <Text>Memuat perizinan....</Text>
    </View>
    if (!permission.granted){
        return (
            <View style={styles.container}>
                <Text style={styles.infoText}>Kami butuh akses kamera untuk selfie profil</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Izinkan Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.buttonDanger} onPress={() => setIsCameraOpen(false)}>
                    <Text style={styles.buttonText}>Batal</Text>
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
                <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                    <Text style={styles.captureButtonText}>Ambil & kirim</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsCameraOpen(false)}>
                    <Text style={{color:'white', marginBottom:20}}>Batal</Text>
                </TouchableOpacity>
            </View>
        </CameraView>
      </View>
    );
  }

  // Tampilan utama
  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <Image
          source={
            profilPhoto
              ? { uri: profilPhoto }
              : mahasiswa?.fotoMhs
                ? { uri: `data:image/jpeg;base64,${mahasiswa.fotoMhs}` }
                : { uri: 'https://i.pravatar.cc/150?img=3' }
          }
          style={styles.profilImage}
        />

        <Text style={styles.namaText}>{mahasiswa?.namaMhs || "Mahasiswa"}</Text>
        <Text style={styles.nimText}>{NIM_USER}</Text>

        <TouchableOpacity style={styles.button} onPress={()=> setIsCameraOpen(true)}>
            <Text style={styles.buttonText}>ganti foto selfie</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f9', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  profileCard: { 
    backgroundColor: 'white', 
    width: '85%', 
    padding: 30, 
    borderRadius: 20, 
    alignItems: 'center', 
    elevation: 5 
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
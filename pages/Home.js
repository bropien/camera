import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();

    const [scannedData, setScannedData] = useState(null);
    const [isScanning, setIsScanning] = useState(true);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    const [locationStatus, setLocationStatus] = useState('checking');
    const [distance, setDistance] = useState(0);

    const KAMPUS_LAT = -6.346000;
    const KAMPUS_LON = 107.149000;
    const MAKSIMAL_JARAK_METER = 50;
    const BASE_URL = "http://10.1.11.239:9000/api/presensi";

    useEffect(() => {
        if (permission && permission.granted) {
            verifyLocation();
        }
    }, [permission]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const p1 = lat1 * Math.PI / 180;
        const p2 = lat2 * Math.PI / 180;
        const deltaP = (lat2 - lat1) * Math.PI / 180;
        const deltaLon = (lon2 - lon1) * Math.PI / 180;

        const a =
            Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const verifyLocation = async () => {
        setLocationStatus('checking');

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Akses Ditolak', 'Izin lokasi wajib diberikan untuk presensi.');
                setLocationStatus('error');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            const jarakMeter = calculateDistance(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude,
                KAMPUS_LAT,
                KAMPUS_LON
            );

            setDistance(Math.round(jarakMeter));

            if (jarakMeter <= MAKSIMAL_JARAK_METER) {
                setLocationStatus('valid');
            } else {
                setLocationStatus('invalid');
            }

        } catch (error) {
            Alert.alert("Error Lokasi", "Gagal mengunci posisi satelit GPS Anda.");
            setLocationStatus('error');
        }
    };

    const handleBarCodeScanned = ({ type, data }) => {
        if (!isScanning) return;
        setIsScanning(false);

        try {
            const qrData = JSON.parse(data);
            setScannedData(qrData);

            Alert.alert(
                "QR Code Terdeteksi",
                `Mata Kuliah: ${qrData.kodeMk}\nPertemuan: ${qrData.pertemuanKe || qrData.pertemuan}\n\nRuangan: ${qrData.ruangan}\n\nLanjutkan Presensi?`,
                [
                    {
                        text: "BATAL",
                        onPress: () => {
                            setIsScanning(true);
                            setScannedData(null);
                        },
                        style: "cancel"
                    },
                    {
                        text: "YA, CHECK IN",
                        onPress: () => handleSubmitPresensi(qrData)
                    }
                ]
            );
        } catch (error) {
            Alert.alert("QR Tidak Valid", "Pastikan Anda memindai QR Code Presensi Dosen.");
            setIsScanning(true);
        }
    };

    const handleSubmitPresensi = async (qrData) => {
        const payload = {
            kodeMk: qrData.kodeMk,
            nimMhs: "0325260090",
            pertemuanKe: qrData.pertemuanKe || qrData.pertemuan,
            date: new Date().toISOString().split('T')[0],
            jamPresensi: new Date().toLocaleTimeString('en-GB'),
            status: "Present",
            ruangan: qrData.ruangan
        };

        try {
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (response.ok) {
                setIsCheckedIn(true);
                Alert.alert("Berhasil!", "Presensi sukses dicatat ke Database.", [
                    { text: "Lihat Riwayat", onPress: () => navigation.navigate('HistoryTab') }
                ]);
            } else {
                Alert.alert("Gagal", result.message || "Terjadi kesalahan di server.");
            }
        } catch (error) {
            Alert.alert("Error Jaringan", "Pastikan IP Server benar dan Backend berjalan.");
        } finally {
            setIsScanning(true);
            setScannedData(null);
        }
    };

    if (!permission) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.infoText}>Aplikasi butuh akses kamera untuk memindai QR!</Text>
                <TouchableOpacity style={styles.buttonRequest} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Aktifkan Kamera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (locationStatus === 'checking') {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0056b3" />
                <Text style={styles.loadingText}>Memverifikasi Lokasi Anda...</Text>
                <Text style={styles.helperText}>Pastikan Anda berada di area Kampus.</Text>
            </View>
        );
    }

    if (locationStatus === 'invalid') {
        return (
            <View style={styles.invalidContainer}>
                <MaterialIcons name="not-interested" size={90} color="#dc3545" style={styles.iconError} />
                <Text style={styles.errorTitle}>Akses Ditolak</Text>
                <Text style={styles.errorSubtitle}>
                    Anda terdeteksi berada {distance} meter dari titik kampus. Maksimal jarak yang diizinkan adalah {MAKSIMAL_JARAK_METER} meter.
                </Text>
                <TouchableOpacity style={styles.buttonRequest} onPress={verifyLocation}>
                    <Text style={styles.buttonText}>Cek Ulang Lokasi</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (locationStatus === 'valid') {
        return (
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={isScanning ? handleBarCodeScanned : undefined}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />

                <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>

                    <View style={styles.topOverlay}>
                        <View style={styles.validLocationBadge}>
                            <MaterialIcons name="check-circle" size={20} color="white" style={styles.validIcon} />
                            <Text style={styles.validLocationText}>Lokasi Valid ({distance}m)</Text>
                        </View>
                    </View>

                    <View style={styles.focusedContainer}>
                        <View style={styles.borderCornerTopLeft} />
                        <View style={styles.borderCornerTopRight} />
                        <View style={styles.borderCornerBottomLeft} />
                        <View style={styles.borderCornerBottomRight} />
                    </View>

                    <View style={styles.bottomOverlay}>
                        <Text style={styles.scanText}>Arahkan Kamera ke QR Code Dosen</Text>
                        {!isScanning && (
                            <TouchableOpacity style={styles.scanLagiButton} onPress={() => setIsScanning(true)}>
                                <Text style={styles.scanLagiText}>SCAN LAGI</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                </View>
            </View>
        );
    }

    return null;
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9', padding: 20 },
    loadingText: { marginTop: 20, fontSize: 18, fontWeight: 'bold', color: '#333' },
    helperText: { color: 'gray', marginTop: 10 },
    infoText: { color: '#333', textAlign: 'center', margin: 30, fontSize: 16 },

    invalidContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 30 },
    iconError: { marginBottom: 20 },
    errorTitle: { fontSize: 26, fontWeight: 'bold', color: '#dc3545', marginBottom: 15 },
    errorSubtitle: { fontSize: 16, textAlign: 'center', color: '#555', lineHeight: 24, marginBottom: 30 },

    buttonRequest: { backgroundColor: '#0052cc', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 8, width: '100%', alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 60 },
    topOverlay: { alignItems: 'center', marginTop: 20 },
    bottomOverlay: { alignItems: 'center', marginBottom: 20 },

    validLocationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#28a745', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25 },
    validIcon: { marginRight: 8 },
    validLocationText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    focusedContainer: { width: 250, height: 250, alignSelf: 'center', backgroundColor: 'transparent', position: 'relative' },
    borderCornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 5, borderLeftWidth: 5, borderColor: '#007bff' },
    borderCornerTopRight: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 5, borderRightWidth: 5, borderColor: '#007bff' },
    borderCornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 5, borderLeftWidth: 5, borderColor: '#007bff' },
    borderCornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 5, borderRightWidth: 5, borderColor: '#007bff' },

    scanText: { color: 'white', fontSize: 16, fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.7)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 5, marginBottom: 15 },
    scanLagiButton: { backgroundColor: '#ffc107', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 5 },
    scanLagiText: { color: '#000', fontWeight: 'bold', fontSize: 14 }
});
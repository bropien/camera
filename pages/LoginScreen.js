import React, { useState, useContext } from "react";
import { View, TextInput, Alert, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const BASE_URL = "http://10.1.11.239:9000/api/user";

export default function LoginScreen({ navigation }) {
    const { login } = useContext(AuthContext);
    const [nim, setNim] = useState("0320240090");
    const [password, setPassword] = useState("12345");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!nim || !password) {
            Alert.alert("Error", "NIM dan Password harus diisi");
            return;
        }

        setIsLoading(true);

        try {
            const res = await axios.post(
                BASE_URL + "/login",
                { nim, password },
                {
                    headers: {
                        authcode: "astratech@123",
                    },
                }
            );

            console.log("Response:", res.data);
            

            if (res.data.status === 200 && res.data.data) {
                const userFromBackend = res.data.data;
                
                // Data dari backend: { mhsNim, mhsName, password, prodi }
                const transformedUserData = {
                    // Untuk HomeScreen (Presensi)
                    nimMhs: userFromBackend.mhsNim,  // Field untuk entity Presensi
                    mhsNim: userFromBackend.mhsNim,  // Field asli dari database
                    nama: userFromBackend.mhsName,
                    mhsName: userFromBackend.mhsName,
                    prodi: userFromBackend.prodi,
                    // Simpan data asli
                    ...userFromBackend
                };
                
                console.log("Data disimpan:", transformedUserData);
                
                await login(transformedUserData);
                
                // Navigasi akan otomatis karena App.js sudah handle
            } else if (res.data.status === 501) {
                Alert.alert("Login Gagal", "NIM atau Password salah");
            } else {
                Alert.alert("Login Gagal", res.data.message || "Terjadi kesalahan");
            }
        } catch (error) {
            console.log("Error:", error.message);
            Alert.alert("Error", "Terjadi kesalahan saat login");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Attendance App</Text>
                <Text style={styles.subtitle}>Silakan login untuk melanjutkan</Text>
                
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>NIM</Text>
                    <TextInput
                        placeholder="Masukkan NIM"
                        value={nim}
                        onChangeText={setNim}
                        style={styles.input}
                        keyboardType="numeric"
                        editable={!isLoading}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        placeholder="Masukkan Password"
                        value={password}
                        onChangeText={setPassword}
                        style={styles.input}
                        secureTextEntry
                        editable={!isLoading}
                    />
                </View>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Login</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    content: { flex: 1, justifyContent: 'center', padding: 20 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#0056A0', textAlign: 'center', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
    inputContainer: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
    button: { backgroundColor: '#0056A0', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    infoText: { textAlign: 'center', marginTop: 30, color: '#999', fontSize: 12 },
});
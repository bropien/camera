import React, { useState, useCallback, useContext } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet,
  FlatList, TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

export default function HistoryScreen({ navigation }) {
  const { userData } = useContext(AuthContext);

  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [isLastPage, setIsLastPage] = useState(false);

  const BASE_URL = "http://10.1.11.239:9000/api/presensi";

  const fetchAttendanceData = async (targetPage = 0, isRefresh = false) => {
    if (isLoading || (isLastPage && targetPage !== 0)) return;

    setIsLoading(true);

    try {
      const nimMhs =
        userData?.nimMhs ||
        userData?.mhsNim ||
        userData?.nim;
      
      if (!nimMhs) {
        console.error("NIM tidak ditemukan");
        setIsLoading(false);
        if (isRefresh) setIsRefreshing(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/history/${nimMhs}?page=${targetPage}&size=10`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json = await response.json();
      const newItems = json.content;

      if (targetPage === 0 || isRefresh) {
        setHistoryData(newItems); 
      } else {
        setHistoryData(prev => [...prev, ...newItems]); 
      }

      setPage(targetPage);
      setIsLastPage(json.last); 

    } catch (error) {
      console.error("Gagal tarik data:", error);
    } finally {
      setIsLoading(false);
      if (isRefresh) setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setPage(0);
      setIsLastPage(false);
      fetchAttendanceData(0);
    }, [userData?.nimMhs, userData?.mhsNim])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    setPage(0);
    setIsLastPage(false);
    fetchAttendanceData(0, true);
  };

  const handleLoadMore = () => {
    if (!isLastPage && !isLoading && historyData.length > 0) {
      fetchAttendanceData(page + 1, false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('Detail', { dataPresensi: item })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.course}>{item.course}</Text>
        <Text style={styles.date}>{item.date} | {item.jamPresensi}</Text>
        <Text style={styles.detailText}>{item.kodeMk} | Pertemuan ke-{item.pertemuanKe} | {item.ruangan}</Text>
      </View>
      <Text style={item.status === 'Present' ? styles.present : styles.absent}>
        {item.status === 'Present' ? 'Hadir' : 'Absen'}
      </Text>
      <MaterialIcons name="chevron-right" size={24} color="#999" style={{ marginLeft: 10 }} />
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0056A0" />
        <Text style={styles.loaderText}>Memuat data...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#0056A0"]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !isLoading && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={60} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada riwayat presensi</Text>
              <Text style={styles.emptySubText}>Scan QR Code untuk melakukan presensi</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 20, flexGrow: 1 },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'white',
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 10, 
    elevation: 2 
  },
  course: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  date: { fontSize: 12, color: 'gray', marginTop: 4 },
  detailText: { fontSize: 11, color: '#666', marginTop: 4 },
  present: { color: 'green', fontWeight: 'bold', marginRight: 5 },
  absent: { color: 'red', fontWeight: 'bold', marginRight: 5 },
  footerLoader: { paddingVertical: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  loaderText: { marginLeft: 10, color: '#666', fontSize: 12 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 16 },
  emptySubText: { textAlign: 'center', marginTop: 10, color: '#ccc', fontSize: 14 },
});
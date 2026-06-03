import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

const KartuProfil = ({ student }) => {
  if (!student) return null;

  return (
    <View style={styles.profilCard}>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
        style={styles.avatar} 
      />
      <View style={styles.profileInfo}>
        <Text style={styles.studentName}>{student.nama}</Text>
        <Text style={styles.studentNim}>{student.nim}</Text>
        <Text style={styles.studentProdi}>{student.prodi}</Text>
      </View>
    </View>  
  );
}

export default KartuProfil;

const styles = StyleSheet.create({
    profilCard: {
        flexDirection:'row',
        backgroundColor:'#fff',
        marginHorizontal:20,
        padding:15,
        borderRadius:12,
        alignItems:'center',
        elevation:3,
        shadowColor:'#000',
        shadowOffset:{width:0,height:2},
        shadowOpacity:0.1,
        shadowRadius:4
    },
    avatar:{
        width: 60,
        height: 60,
        borderRadius:30,
        marginRight:15
    },
    profileInfo: {
        flex:1,
    },
    studentName:{
        fontSize:18,
        fontWeight:'bold',
        color:'#333'
    },
    studentNim:{
        fontSize:14,
        marginTop:2,
        color:'#666'
    },
    studentProdi:{
        fontSize:12,
        marginTop:4,
        fontWeight:'600',
        color:'#0056A0'
    }
})
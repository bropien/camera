import React from "react";
import { View, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";

const Tab = createBottomTabNavigator();
function Tab1() {
    return (
        <View style={{ padding: 20 }}>
            <Text>Halo Ini Halaman dari Tab Screen 1</Text>
        </View>
    );
}
function Tab2() {
    return (
        <View style={{ padding: 20 }}>
            <Text>Halo Ini Halaman dari Tab Screen 2</Text>
        </View>
    );
}
function TabNavigator() {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Tab1" component={Tab1} />
            <Tab.Screen name="Tab2" component={Tab2} />
        </Tab.Navigator>
    );
}

const Drawer = createDrawerNavigator();
function Drawer2() {
    return (
        <View style={{ padding: 20 }}>
            <Text>Halo Ini Halaman dari Drawer Screen 2</Text>
        </View>
    );
}
export default function HomeScreen() {
    return (
        <Drawer.Navigator>
            <Drawer.Screen name="TabNavigation" component={TabNavigator}
            />
            <Drawer.Screen name="DrawerNavigation" component={Drawer2}
            />
        </Drawer.Navigator>
    );
}
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './(tabs)';
import IngresarDato from './(tabs)/ingresar-dato';

const Tab = createBottomTabNavigator();

export default function RootLayout() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Ingresar Dato" component={IngresarDato} />
    </Tab.Navigator>
  );
}

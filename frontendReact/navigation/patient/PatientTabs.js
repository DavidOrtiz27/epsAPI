import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import patient screens
import {
  PatientDashboard,
  PatientAppointments,
  PatientHistory,
  PatientProfile
} from '../../screens/patient';

const Tab = createBottomTabNavigator();

const PatientTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Citas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Historial') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={PatientDashboard}
        options={{
          title: 'Inicio',
        }}
      />
      <Tab.Screen
        name="Citas"
        component={PatientAppointments}
        options={{
          title: 'Mis Citas',
        }}
      />
      <Tab.Screen
        name="Historial"
        component={PatientHistory}
        options={{
          title: 'Historial Médico',
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PatientProfile}
        options={{
          title: 'Mi Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

export default PatientTabs;
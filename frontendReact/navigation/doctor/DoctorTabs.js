import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import doctor screens
import {
  DoctorAppointments,
  DoctorPatients,
  DoctorProfile
} from '../../screens/doctor';

const Tab = createBottomTabNavigator();

const DoctorTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Citas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Pacientes') {
            iconName = focused ? 'people' : 'people-outline';
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
        name="Citas"
        component={DoctorAppointments}
        options={{
          title: 'Mis Citas',
        }}
      />
      <Tab.Screen
        name="Pacientes"
        component={DoctorPatients}
        options={{
          title: 'Mis Pacientes',
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={DoctorProfile}
        options={{
          title: 'Mi Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

export default DoctorTabs;
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import doctor screens
import {
  DoctorAppointments,
  DoctorPatients,
  DoctorProfile,
  DoctorSchedule,
  DoctorAppointmentDetail,
  DoctorReports,
  DoctorHelp
} from '../../screens/doctor';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Citas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Pacientes') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Horarios') {
            iconName = focused ? 'time' : 'time-outline';
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
          title: 'Citas',
        }}
      />
      <Tab.Screen
        name="Pacientes"
        component={DoctorPatients}
        options={{
          title: 'Pacientes',
        }}
      />
      <Tab.Screen
        name="Horarios"
        component={DoctorSchedule}
        options={{
          title: 'Horarios',
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={DoctorProfile}
        options={{
          title: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

const DoctorTabs = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="DoctorTabNavigator"
        component={TabNavigator}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DoctorAppointmentDetail"
        component={DoctorAppointmentDetail}
        options={{
          title: 'Consulta Médica',
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name="DoctorReports"
        component={DoctorReports}
        options={{
          title: 'Reportes Médicos',
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name="DoctorHelp"
        component={DoctorHelp}
        options={{
          title: 'Centro de Ayuda',
          headerLeft: null,
        }}
      />
    </Stack.Navigator>
  );
};

export default DoctorTabs;
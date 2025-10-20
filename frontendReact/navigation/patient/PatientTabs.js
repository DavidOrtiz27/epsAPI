import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// Import patient screens
import {
  PatientDashboard,
  PatientAppointments,
  PatientHistory,
  PatientProfile,
  PatientBookAppointment
} from '../../screens/patient';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AppointmentsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // ← QUITA LA BARRA AZUL SUPERIOR
      }}
    >
      <Stack.Screen
        name="PatientAppointments"
        component={PatientAppointments}
        options={{
          title: 'Mis Citas',
        }}
      />
      <Stack.Screen
        name="PatientBookAppointment"
        component={PatientBookAppointment}
        options={{
          title: 'Agendar Cita',
        }}
      />
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e0e0e0',
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'android' ? 10 : 5,
            paddingTop: 5,
            height: Platform.OS === 'android' ? 50 : 40,
            paddingHorizontal: 0,
          },
          headerShown: false,
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
          component={AppointmentsStack}
          options={{
            title: 'Mis Citas',
            headerShown: false,
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
    </SafeAreaView>
  );
};

const PatientTabs = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['bottom']}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="PatientTabNavigator"
            component={TabNavigator}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default PatientTabs;
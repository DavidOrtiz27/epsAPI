import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import { useNavigationDetection } from '../../hooks/useNavigationDetection';

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
  const navigationInfo = useNavigationDetection();
  
  // Log para debugging - puedes ver qué tipo de navegación se detecta
  React.useEffect(() => {
    console.log('🧭 Navigation Detection:', navigationInfo);
  }, [navigationInfo]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
          tabBarActiveTintColor: '#007bffff',
          tabBarInactiveTintColor: 'gray',
          tabBarShowLabel: false, // Ocultar títulos de los tabs
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e0e0e0',
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'android' ? 10 : 5,
            paddingTop: 5,
            height: Platform.OS === 'android' ? 50 : 40,
            // Asegurar que el tabBar respete las safe areas
            paddingHorizontal: 0,
          },
          headerShown: false, // ← ESTO QUITA LA BARRA AZUL SUPERIOR
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
    </SafeAreaView>
  );
};

const DoctorTabs = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['bottom']}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false, // ← ESTO QUITA LA BARRA AZUL DE TODAS LAS PANTALLAS DEL STACK
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default DoctorTabs;
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// Admin screens
import {
  AdminDashboard,
  AdminPatients,
  AdminPatientDetail,
  AdminPatientForm,
  AdminDoctors,
  AdminDoctorDetail,
  AdminDoctorForm,
  AdminMedications,
  AdminMedicationForm,
  AdminAppointments,
  AdminReports,
  AdminAudits,
  AdminUsers,
  AdminProfile,
} from '../../screens/admin';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack navigators for each tab
const PatientsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminPatients" component={AdminPatients} />
    <Stack.Screen name="AdminPatientDetail" component={AdminPatientDetail} />
    <Stack.Screen name="AdminPatientForm" component={AdminPatientForm} />
  </Stack.Navigator>
);

const DoctorsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDoctors" component={AdminDoctors} />
    <Stack.Screen name="AdminDoctorDetail" component={AdminDoctorDetail} />
    <Stack.Screen name="AdminDoctorForm" component={AdminDoctorForm} />
  </Stack.Navigator>
);

const MedicationsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminMedications" component={AdminMedications} />
    <Stack.Screen name="AdminMedicationForm" component={AdminMedicationForm} />
  </Stack.Navigator>
);

const AppointmentsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminAppointments" component={AdminAppointments} />
  </Stack.Navigator>
);

const ReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminReports" component={AdminReports} />
    <Stack.Screen name="AdminAudits" component={AdminAudits} />
    <Stack.Screen name="AdminUsers" component={AdminUsers} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminProfile" component={AdminProfile} />
  </Stack.Navigator>
);

const TabNavigator = () => {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Dashboard') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Pacientes') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Doctores') {
              iconName = focused ? 'medical' : 'medical-outline';
            } else if (route.name === 'Medicamentos') {
              iconName = focused ? 'medkit' : 'medkit-outline';
            } else if (route.name === 'Citas') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            } else if (route.name === 'Reportes') {
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
          name="Dashboard"
          component={AdminDashboard}
          options={{ title: 'Dashboard' }}
        />
        <Tab.Screen
          name="Pacientes"
          component={PatientsStack}
          options={{ title: 'Pacientes' }}
        />
        <Tab.Screen
          name="Doctores"
          component={DoctorsStack}
          options={{ title: 'Doctores' }}
        />
        <Tab.Screen
          name="Medicamentos"
          component={MedicationsStack}
          options={{ title: 'Medicamentos' }}
        />
        <Tab.Screen
          name="Citas"
          component={AppointmentsStack}
          options={{ title: 'Citas' }}
        />
        <Tab.Screen
          name="Reportes"
          component={ReportsStack}
          options={{ title: 'Reportes' }}
        />
        <Tab.Screen
          name="Perfil"
          component={ProfileStack}
          options={{ title: 'Mi Perfil' }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const AdminTabs = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['bottom']}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="AdminTabNavigator"
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

export default AdminTabs;
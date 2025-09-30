import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../../utils/context/AuthContext';

// Import screens
import { LoginScreen, RegisterScreen } from '../../screens/auth';
import PatientTabs from '../patient/PatientTabs';
import DoctorTabs from '../doctor/DoctorTabs';
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
  AdminReports
} from '../../screens/admin';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  console.log('AppNavigator - isAuthenticated:', isAuthenticated, 'user:', user, 'isLoading:', isLoading);

  if (isLoading) {
    // You could return a loading screen here
    return null;
  }

  return (
    <NavigationContainer key={isAuthenticated ? 'authenticated' : 'unauthenticated'}>
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
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{
                title: 'Registro de Paciente',
                headerBackTitle: 'Volver'
              }}
            />
          </>
        ) : (
          // Main App Stack based on role
          <>
            {user?.roles?.some(role => role.name === 'paciente' || role.name === 'patient') && (
              <Stack.Screen
                name="PatientTabs"
                component={PatientTabs}
                options={{
                  headerShown: false, // Bottom tabs will handle their own headers
                }}
              />
            )}

            {user?.roles?.some(role => role.name === 'doctor') && (
              <Stack.Screen
                name="DoctorTabs"
                component={DoctorTabs}
                options={{
                  headerShown: false, // Bottom tabs will handle their own headers
                }}
              />
            )}

            {/* Admin screens */}
            {user?.roles?.some(role => role.name === 'admin') && (
              <>
                <Stack.Screen
                  name="AdminDashboard"
                  component={AdminDashboard}
                  options={{
                    title: 'Panel Administrativo',
                    headerLeft: null,
                  }}
                />
                <Stack.Screen
                  name="AdminPatients"
                  component={AdminPatients}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminPatientDetail"
                  component={AdminPatientDetail}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminPatientForm"
                  component={AdminPatientForm}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminDoctors"
                  component={AdminDoctors}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminDoctorDetail"
                  component={AdminDoctorDetail}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminDoctorForm"
                  component={AdminDoctorForm}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminMedications"
                  component={AdminMedications}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminMedicationForm"
                  component={AdminMedicationForm}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminAppointments"
                  component={AdminAppointments}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="AdminReports"
                  component={AdminReports}
                  options={{
                    headerShown: false,
                  }}
                />

              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
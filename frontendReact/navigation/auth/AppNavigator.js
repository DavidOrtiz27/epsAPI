import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../../utils/context/AuthContext';

// Import screens
import { LoginScreen, RegisterScreen } from '../../screens/auth';
import PatientTabs from '../patient/PatientTabs';
import DoctorTabs from '../doctor/DoctorTabs';
import { AdminDashboard } from '../../screens/admin';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    // You could return a loading screen here
    return null;
  }

  return (
    <NavigationContainer>
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
            {user?.roles?.some(role => role.name === 'admin' || role.name === 'superadmin') && (
              <Stack.Screen
                name="AdminDashboard"
                component={AdminDashboard}
                options={{
                  title: 'Panel Administrativo',
                  headerLeft: null,
                }}
              />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
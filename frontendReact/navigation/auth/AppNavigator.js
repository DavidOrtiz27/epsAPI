import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../../utils/context/AuthContext';

// Import screens
import { LoginScreen, RegisterScreen, ForgotPasswordScreen, ResetPasswordScreen } from '../../screens/auth';
import PatientTabs from '../patient/PatientTabs';
import DoctorTabs from '../doctor/DoctorTabs';
import AdminTabs from '../admin/AdminTabs';

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
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{ headerShown: false }}
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
              <Stack.Screen
                name="AdminTabs"
                component={AdminTabs}
                options={{
                  headerShown: false, // Bottom tabs will handle their own headers
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
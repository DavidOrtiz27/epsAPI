import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { AuthProvider } from './utils/context/AuthContext';
import AppNavigator from './navigation/auth/AppNavigator';
import { notificationService } from './services';

// Suprimir warnings específicos en desarrollo
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'expo-notifications functionality is not fully supported',
  'SafeAreaView has been deprecated',
  'We recommend you instead use a development build'
]);

export default function App() {
  useEffect(() => {
    // Inicializar servicio de notificaciones
    const initializeNotifications = async () => {
      await notificationService.initialize();
    };

    initializeNotifications();

    // Cleanup al cerrar la app
    return () => {
      notificationService.cleanup();
    };
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

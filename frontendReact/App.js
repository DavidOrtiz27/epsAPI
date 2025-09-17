import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './utils/context/AuthContext';
import AppNavigator from './navigation/auth/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

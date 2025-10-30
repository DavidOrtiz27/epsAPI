import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/api/api';
import { notificationService } from '../../services';
import { NotificationPermissionAlert } from '../../components/NotificationPermissionAlert';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('user_data');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Verify token is still valid
        try {
          await apiService.getCurrentUser();
        } catch (error) {
          // Token is invalid, clear storage
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('user_data');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      // Silently handle auth state check errors
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // Clear any existing session before attempting login
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      setToken(null);
      setUser(null);

      const response = await apiService.login({ email, password });
      setUser(response.user);
      setToken(response.token);

      // 🔔 Solicitar permisos de notificaciones después del login
      try {
        console.log('🔔 Solicitando permisos de notificaciones después del login...');
        const permissionResult = await notificationService.requestNotificationPermissionsOnLogin();
        console.log('📝 Resultado de permisos:', permissionResult);
        
        if (permissionResult.success) {
          console.log('✅ Permisos de notificaciones configurados correctamente');
          
          // Registrar token en el backend
          try {
            console.log('📡 Registrando token de notificaciones en el backend...');
            const registerResult = await notificationService.registerTokenWithBackend();
            
            if (registerResult.success) {
              console.log('✅ Token registrado en backend exitosamente');
            } else {
              console.log('⚠️ No se pudo registrar token en backend:', registerResult.error);
            }
          } catch (backendError) {
            console.log('⚠️ Error registrando token en backend:', backendError);
          }
          
          // Mostrar alerta de confirmación (opcional, solo primera vez)
          if (permissionResult.reason === 'newly_granted') {
            NotificationPermissionAlert.showPermissionGrantedAlert();
          }
          
          // Enviar notificación de login exitoso
          const userName = response.user?.name || response.user?.nombre || 'Usuario';
          await notificationService.showLoginSuccess(userName);
          
        } else {
          console.log('⚠️ Permisos de notificaciones no disponibles:', permissionResult.reason);
          
          // Mostrar alertas según el motivo
          switch (permissionResult.reason) {
            case 'denied':
              NotificationPermissionAlert.showPermissionDeniedAlert();
              break;
            case 'not_device':
              NotificationPermissionAlert.showNotDeviceAlert();
              break;
            default:
              console.log('💡 Razón de fallo:', permissionResult.reason);
          }
        }
      } catch (notificationError) {
        console.log('⚠️ Error configurando notificaciones:', notificationError);
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      
      // If registration includes login (returns token), update auth state
      if (response.token && response.user) {
        setUser(response.user);
        setToken(response.token);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setToken(null);
    } catch (error) {
      // Even if API call fails, clear local state
      setUser(null);
      setToken(null);
    }
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    } catch (error) {
      // Silently handle user update errors
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
import React from 'react';
import { Alert, Platform, Linking } from 'react-native';

// Componente para manejar alertas y educación sobre permisos de notificaciones
export const NotificationPermissionAlert = {
  
  // Mostrar alerta educativa sobre por qué necesitamos permisos
  showPermissionExplanation: () => {
    Alert.alert(
      '🔔 Notificaciones de EPS MAPU',
      'Para ofrecerte la mejor experiencia, necesitamos enviarte notificaciones sobre:\n\n' +
      '• 📅 Recordatorios de citas médicas\n' +
      '• ✅ Confirmaciones de citas\n' +
      '• 📋 Actualizaciones de resultados médicos\n' +
      '• 🔔 Mensajes importantes del sistema\n\n' +
      '¿Permitir notificaciones?',
      [
        {
          text: 'Ahora no',
          style: 'cancel',
          onPress: () => console.log('Usuario rechazó explicación de permisos')
        },
        {
          text: 'Permitir',
          style: 'default',
          onPress: () => {
            console.log('Usuario aceptó explicación, procediendo con solicitud');
            return true;
          }
        }
      ],
      { cancelable: true }
    );
  },

  // Mostrar alerta cuando los permisos fueron denegados
  showPermissionDeniedAlert: () => {
    Alert.alert(
      '⚠️ Notificaciones Deshabilitadas',
      'Las notificaciones están deshabilitadas. Puedes habilitarlas manualmente en:\n\n' +
      `📱 Configuración > Aplicaciones > EPS MAPU > Notificaciones`,
      [
        {
          text: 'Entendido',
          style: 'cancel'
        },
        {
          text: 'Ir a Configuración',
          style: 'default',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          }
        }
      ]
    );
  },

  // Mostrar alerta de confirmación cuando los permisos fueron otorgados
  showPermissionGrantedAlert: () => {
    Alert.alert(
      '✅ ¡Notificaciones Habilitadas!',
      'Perfecto! Ahora recibirás notificaciones importantes sobre:\n\n' +
      '• Recordatorios de citas\n' +
      '• Confirmaciones médicas\n' +
      '• Resultados de exámenes\n' +
      '• Actualizaciones del sistema',
      [
        {
          text: 'Excelente',
          style: 'default'
        }
      ]
    );
  },

  // Alerta para dispositivos no compatibles (emuladores)
  showNotDeviceAlert: () => {
    Alert.alert(
      'ℹ️ Notificaciones No Disponibles',
      'Las notificaciones no están disponibles en emuladores o simuladores.\n\n' +
      'Para probar las notificaciones, instala la aplicación en un dispositivo físico.',
      [
        {
          text: 'Entendido',
          style: 'default'
        }
      ]
    );
  }
};

export default NotificationPermissionAlert;
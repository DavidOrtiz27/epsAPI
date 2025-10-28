import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // ✅ IMPORTANTE: Mostrar notificaciones
    shouldPlaySound: true,      // ✅ Con sonido
    shouldSetBadge: false,      // Sin badge
    shouldShowBanner: true,     // Banner en iOS
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Inicializar el servicio de notificaciones
  async initialize() {
    try {
      // Registrar para recibir notificaciones
      await this.registerForPushNotificationsAsync();
      
      // Configurar listeners
      this.setupNotificationListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return false;
    }
  }

  // Registrarse para notificaciones push
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return;
      }
      
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      } catch (e) {
        // Fallback para desarrollo
        token = 'ExponentPushToken[development-mode]';
      }
    } else {
      // Para desarrollo en simulador
      token = 'ExponentPushToken[simulator-mode]';
    }

    this.expoPushToken = token;
    return token;
  }

  // Configurar listeners de notificaciones
  setupNotificationListeners() {
    // Listener para cuando se recibe una notificación
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // Manejar notificación recibida
    });

    // Listener para cuando el usuario interactúa con la notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Manejar respuesta a notificación
      this.handleNotificationResponse(response);
    });
  }

  // Manejar respuesta a notificación
  handleNotificationResponse(response) {
    const data = response.notification.request.content.data;
    
    if (data.type === 'appointment') {
      // Navegar a la pantalla de citas
    } else if (data.type === 'login') {
      // Acción para login
    }
  }

  // Limpiar listeners
  cleanup() {
    if (this.notificationListener) {
      this.notificationListener.remove();
    }
    if (this.responseListener) {
      this.responseListener.remove();
    }
  }

  // === NOTIFICACIONES ESPECÍFICAS ===

  // Notificación de login exitoso
  async showLoginSuccess(userName) {
    try {
      const notification = {
        title: '¡Bienvenido! 👋',
        body: `Hola ${userName}, has iniciado sesión exitosamente en EPS API.`,
        data: { 
          type: 'login',
          timestamp: new Date().toISOString()
        },
      };

      await this.sendLocalNotification(notification);
    } catch (error) {
      console.error('❌ Error sending login notification:', error);
    }
  }

  // Notificación de cita creada (para paciente)
  async showAppointmentCreated(appointmentData) {
    try {
      const date = new Date(appointmentData.fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const notification = {
        title: '✅ Cita médica agendada',
        body: `Tu cita con ${appointmentData.medico?.nombre || 'el médico'} ha sido programada para el ${date}.`,
        data: { 
          type: 'appointment',
          subtype: 'created',
          appointmentId: appointmentData.id,
          timestamp: new Date().toISOString()
        },
      };

      await this.sendLocalNotification(notification);
    } catch (error) {
      console.error('❌ Error sending appointment created notification:', error);
    }
  }

  // Notificación de actualización de estado de cita
  async showAppointmentStatusUpdate(appointmentData, newStatus, doctorName) {
    try {
      let title = '';
      let body = '';
      let emoji = '';

      switch (newStatus) {
        case 'confirmada':
          emoji = '✅';
          title = 'Cita confirmada';
          body = `El Dr. ${doctorName} ha confirmado tu cita médica.`;
          break;
        case 'cancelada':
          emoji = '❌';
          title = 'Cita cancelada';
          body = `Tu cita con el Dr. ${doctorName} ha sido cancelada.`;
          break;
        case 'realizada':
          emoji = '🏥';
          title = 'Cita completada';
          body = `Tu consulta con el Dr. ${doctorName} ha sido completada.`;
          break;
        case 'reprogramada':
          emoji = '📅';
          title = 'Cita reprogramada';
          body = `Tu cita con el Dr. ${doctorName} ha sido reprogramada.`;
          break;
        default:
          emoji = '📋';
          title = 'Actualización de cita';
          body = `El estado de tu cita ha sido actualizado a: ${newStatus}.`;
      }

      const notification = {
        title: `${emoji} ${title}`,
        body: body,
        data: { 
          type: 'appointment',
          subtype: 'status_update',
          appointmentId: appointmentData.id,
          newStatus: newStatus,
          timestamp: new Date().toISOString()
        },
      };

      await this.sendLocalNotification(notification);
    } catch (error) {
      console.error('❌ Error sending appointment status notification:', error);
    }
  }

  // Notificación para recordatorio de cita
  async showAppointmentReminder(appointmentData) {
    try {
      const date = new Date(appointmentData.fecha).toLocaleDateString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const notification = {
        title: '⏰ Recordatorio de cita',
        body: `Tienes una cita médica hoy a las ${date} con ${appointmentData.medico?.nombre || 'tu médico'}.`,
        data: { 
          type: 'appointment',
          subtype: 'reminder',
          appointmentId: appointmentData.id,
          timestamp: new Date().toISOString()
        },
      };

      await this.sendLocalNotification(notification);
    } catch (error) {
      console.error('❌ Error sending appointment reminder notification:', error);
    }
  }

  // Enviar notificación local
  async sendLocalNotification(notificationContent) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // Enviar inmediatamente
      });
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  // Programar notificación para más tarde
  async scheduleNotification(notificationContent, triggerDate) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: {
          date: triggerDate,
        },
      });
      
      return identifier;
    } catch (error) {
      console.error('❌ Error scheduling notification:', error);
      return null;
    }
  }

  // Cancelar notificación programada
  async cancelScheduledNotification(identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('❌ Error cancelling notification:', error);
    }
  }

  // Obtener token para el backend
  getExpoPushToken() {
    return this.expoPushToken;
  }
}

// Exportar instancia singleton
const notificationService = new NotificationService();
export default notificationService;
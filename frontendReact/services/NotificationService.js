import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert, Linking } from 'react-native';
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
      console.log('🔔 Inicializando servicio de notificaciones...');
      
      // Verificar si estamos en un dispositivo real
      if (!Device.isDevice) {
        console.log('⚠️ Las notificaciones no funcionan en simuladores/emuladores');
        return false;
      }

      // Solicitar permisos con explicación
      const permissionsGranted = await this.requestPermissionsWithPrompt();
      
      if (!permissionsGranted) {
        console.log('⚠️ Notificaciones no disponibles - permisos no otorgados');
        return false;
      }

      // Registrar para recibir notificaciones push
      const result = await this.registerForPushNotificationsAsync();
      console.log('📝 Resultado del registro:', result);
      
      // Configurar listeners
      this.setupNotificationListeners();
      
      console.log('✅ Servicio de notificaciones inicializado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return false;
    }
  }

  // Solicitar permisos con explicación para el usuario
  async requestPermissionsWithPrompt() {
    try {
      console.log('🔔 Verificando si necesitamos solicitar permisos...');
      
      if (!Device.isDevice) {
        console.log('⚠️ No es un dispositivo real, saltando permisos');
        return false;
      }

      const { status: currentStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Estado actual de permisos:', currentStatus);

      if (currentStatus === 'granted') {
        console.log('✅ Los permisos ya están otorgados');
        return true;
      }

      // Mostrar explicación al usuario
      return new Promise((resolve) => {
        if (Platform.OS === 'android') {
          // En Android, directamente solicitamos permisos
          this.requestPermissionsDirectly().then(resolve);
        } else {
          // En iOS, podemos mostrar una explicación primero
          this.requestPermissionsDirectly().then(resolve);
        }
      });

    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return false;
    }
  }

  // Solicitar permisos directamente
  async requestPermissionsDirectly() {
    try {
      console.log('🔑 Solicitando permisos de notificaciones...');
      
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });

      console.log('📝 Resultado de solicitud de permisos:', status);

      if (status === 'granted') {
        console.log('✅ Permisos otorgados exitosamente');
        // Configurar canal de notificaciones para Android
        if (Platform.OS === 'android') {
          await this.setupAndroidChannel();
        }
        return true;
      } else {
        console.log('❌ Permisos no otorgados:', status);
        return false;
      }

    } catch (error) {
      console.error('❌ Error en solicitud directa de permisos:', error);
      return false;
    }
  }

  // Configurar canal de Android
  async setupAndroidChannel() {
    if (Platform.OS === 'android') {
      console.log('🤖 Configurando canales de notificaciones para Android...');
      
      // Canal principal con máxima prioridad
      await Notifications.setNotificationChannelAsync('default', {
        name: 'EPS MAPU - Notificaciones Principales',
        description: 'Notificaciones importantes del sistema médico',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#007AFF',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        bypassDnd: true, // Saltarse "No molestar"
        showBadge: true,
      });

      // Canal para notificaciones médicas críticas
      await Notifications.setNotificationChannelAsync('medical-urgent', {
        name: 'EPS MAPU - Médico URGENTE',
        description: 'Notificaciones médicas que requieren atención inmediata',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: '#FF3B30',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        bypassDnd: true,
        showBadge: true,
      });

      // Canal para recordatorios de citas
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'EPS MAPU - Citas Médicas',
        description: 'Recordatorios y actualizaciones de citas médicas',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#34C759',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
      });

      console.log('✅ Canales de Android configurados con máxima prioridad');
    }
  }
  async registerForPushNotificationsAsync() {
    let token;

    console.log('📱 Platform:', Platform.OS);
    console.log('🔧 Device.isDevice:', Device.isDevice);

    if (Platform.OS === 'android') {
      console.log('🤖 Configurando canal de notificaciones para Android...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('✅ Canal de notificaciones configurado');
    }

    if (Device.isDevice) {
      console.log('📋 Verificando permisos de notificaciones...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('🔍 Estado actual de permisos:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('🔑 Solicitando permisos de notificaciones...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📝 Resultado de solicitud:', status);
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificaciones no otorgados');
        console.log('⚠️ Las notificaciones no funcionarán sin permisos');
        return null;
      }

      console.log('✅ Permisos de notificaciones otorgados');
      
      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        console.log('🎯 Project ID:', projectId);
        
        if (!projectId) {
          throw new Error('Project ID not found');
        }
        
        console.log('🎫 Obteniendo token de Expo Push...');
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('🎫 Token obtenido:', token.substring(0, 20) + '...');
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

  // 📡 Registrar token en el backend
  async registerTokenWithBackend() {
    try {
      if (!this.expoPushToken) {
        console.log('⚠️ No hay token disponible para registrar');
        return { success: false, reason: 'no_token' };
      }

      console.log('📡 Registrando token en el backend...');
      
      // Importar dinámicamente para evitar dependencias circulares
      const apiService = (await import('./api/api')).default;
      
      const response = await apiService.post('/notifications/register-token', {
        expo_push_token: this.expoPushToken
      });

      if (response.success) {
        console.log('✅ Token registrado exitosamente en el backend');
        return { success: true, message: response.message };
      } else {
        console.error('❌ Error registrando token:', response);
        return { success: false, error: response.message };
      }

    } catch (error) {
      console.error('❌ Excepción registrando token en backend:', error);
      return { success: false, error: error.message };
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

  // Notificación para acciones de usuario (admin)
  async showUserAction(action, userName, message) {
    try {
      let title = '';
      let emoji = '';

      switch (action) {
        case 'delete':
          emoji = '🗑️';
          title = 'Usuario eliminado';
          break;
        case 'update':
          emoji = '⚙️';
          title = 'Usuario actualizado';
          break;
        case 'create':
          emoji = '👤';
          title = 'Usuario creado';
          break;
        default:
          emoji = '📋';
          title = 'Acción de usuario';
      }

      const notification = {
        title: `${emoji} ${title}`,
        body: message || `Acción realizada en el usuario: ${userName}`,
        data: { 
          type: 'user_action',
          subtype: action,
          userName: userName,
          timestamp: new Date().toISOString()
        },
      };

      await this.sendLocalNotification(notification);
    } catch (error) {
      console.error('❌ Error sending user action notification:', error);
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

  // 🎯 FUNCIÓN PARA SOLICITAR PERMISOS AL HACER LOGIN
  async requestNotificationPermissionsOnLogin() {
    try {
      console.log('🔔 Solicitando permisos de notificaciones después del login...');
      
      if (!Device.isDevice) {
        console.log('⚠️ No es un dispositivo real - permisos no necesarios');
        return { success: false, reason: 'not_device' };
      }

      // Verificar estado actual
      const { status: currentStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Estado actual de permisos:', currentStatus);

      if (currentStatus === 'granted') {
        console.log('✅ Los permisos ya están otorgados');
        await this.setupAndroidChannel(); // Configurar canales si es necesario
        return { success: true, reason: 'already_granted' };
      }

      // Solicitar permisos
      console.log('🔑 Solicitando permisos de notificaciones...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });

      console.log('📝 Resultado de solicitud de permisos:', newStatus);

      if (newStatus === 'granted') {
        console.log('✅ Permisos otorgados exitosamente');
        await this.setupAndroidChannel(); // Configurar canales para Android
        return { success: true, reason: 'newly_granted' };
      } else {
        console.log('❌ Permisos no otorgados:', newStatus);
        return { success: false, reason: 'denied', status: newStatus };
      }

    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return { success: false, reason: 'error', error: error.message };
    }
  }
  async sendTestNotification() {
    try {
      console.log('🧪 Enviando notificación de prueba...');
      
      const notification = {
        title: '🧪 Notificación de Prueba',
        body: 'Si ves esto, las notificaciones están funcionando correctamente!',
        data: { 
          type: 'test',
          timestamp: new Date().toISOString()
        },
      };

      await this.sendLocalNotification(notification);
      console.log('✅ Notificación de prueba enviada');
      return true;
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
      return false;
    }
  }

  // 🧹 Limpiar notificaciones programadas
  async clearAllNotifications() {
    try {
      console.log('🧹 Limpiando notificaciones programadas...');
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Notificaciones programadas limpiadas');
      
      const remaining = await Notifications.getAllScheduledNotificationsAsync();
      console.log('� Notificaciones restantes:', remaining.length);
      
      return { success: true, cleared: true, remaining: remaining.length };
    } catch (error) {
      console.error('❌ Error limpiando notificaciones:', error);
      return { success: false, error: error.message };
    }
  }

  // 🧪 Función simple de prueba de notificaciones
  async simpleNotificationTest() {
    try {
      console.log('🧪 === PRUEBA SIMPLE DE NOTIFICACIÓN ===');
      
      // Limpiar notificaciones previas
      await this.clearAllNotifications();
      
      // Intentar la notificación más simple posible
      console.log('🧪 Programando notificación simple...');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Prueba Simple',
          body: 'Si ves esto, las notificaciones funcionan básicamente',
        },
        trigger: null, // Inmediata
      });
      
      console.log('✅ Notificación simple programada con ID:', notificationId);
      
      // Verificar si se programó
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 Notificaciones después de programar:', scheduled.length);
      
      return { 
        success: true, 
        notificationId: notificationId,
        scheduledCount: scheduled.length 
      };
      
    } catch (error) {
      console.error('❌ Error en prueba simple:', error);
      return { success: false, error: error.message };
    }
  }
  async diagnoseNotifications() {
    console.log('\n🔍 === DIAGNÓSTICO AVANZADO DE NOTIFICACIONES ===');
    
    try {
      // 1. Verificar dispositivo y plataforma
      const deviceInfo = {
        isDevice: Device.isDevice,
        platform: Platform.OS,
        version: Platform.Version,
      };
      console.log('📱 Información del dispositivo:', deviceInfo);
      
      // 2. Verificar permisos detalladamente
      const permissions = await Notifications.getPermissionsAsync();
      console.log('🔑 Permisos completos:', permissions);
      
      // 3. Verificar configuración del token
      console.log('⚙️ Token disponible:', !!this.expoPushToken);
      console.log('🎯 Project ID:', Constants?.expoConfig?.extra?.eas?.projectId);
      
      // 4. Mostrar instrucciones específicas para Android
      if (Platform.OS === 'android') {
        console.log('🤖 Ejecutando verificaciones específicas para Android...');
        
        Alert.alert(
          "⚡ IMPORTANTE: Optimización de Batería",
          "Para GARANTIZAR notificaciones instantáneas:\n\n" +
          "📱 MÉTODO 1 - Configuración:\n" +
          "• Configuración → Batería\n" +
          "• Optimización de batería\n" +
          "• Buscar 'EPS MAPU'\n" +
          "• Seleccionar 'No optimizar'\n\n" +
          "🚨 MÉTODO 2 - Si persiste:\n" +
          "• Configuración → Aplicaciones\n" +
          "• EPS MAPU → Batería\n" +
          "• Permitir actividad en segundo plano\n\n" +
          "Esto soluciona el retraso de 3 horas.",
          [
            { 
              text: '⚙️ Abrir Configuración', 
              onPress: () => Linking.openSettings()
            },
            { text: 'Más tarde', style: 'cancel' },
            { text: 'Entendido ✅', style: 'default' }
          ]
        );
      }
      
      // 5. Verificar si estamos en Expo Go
      console.log('📦 Verificando entorno de ejecución...');
      const isExpoGo = Constants.executionEnvironment === 'standalone' ? false : true;
      console.log('🔍 ¿Ejecutándose en Expo Go?:', isExpoGo);
      
      if (isExpoGo) {
        console.log('⚠️ ADVERTENCIA: Ejecutándose en Expo Go');
        console.log('⚠️ Las notificaciones pueden tener limitaciones en Expo Go');
        
        Alert.alert(
          "⚠️ Limitación de Expo Go",
          "Estás usando Expo Go que tiene limitaciones para notificaciones.\n\n" +
          "📱 Para notificaciones completas:\n" +
          "• Compila una APK con EAS Build\n" +
          "• Las notificaciones locales pueden no funcionar completamente\n\n" +
          "🧪 Aun así, intentaremos las pruebas...",
          [{ text: 'Continuar', style: 'default' }]
        );
      }
      
      // 6. Programar múltiples notificaciones de prueba
      console.log('🧪 Programando notificaciones de prueba...');
      
      try {
        // Notificación inmediata
        console.log('🧪 Programando notificación inmediata...');
        const immediateId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🧪 PRUEBA INMEDIATA',
            body: `Enviada a las ${new Date().toLocaleTimeString()} - Debe llegar AL INSTANTE`,
            channelId: 'medical-urgent',
            priority: 'max',
            sound: 'default',
          },
          trigger: null, // Inmediata
        });
        console.log('✅ Notificación inmediata programada con ID:', immediateId);
        
        // Notificación en 30 segundos
        console.log('🧪 Programando notificación en 30 segundos...');
        const thirtySecId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '⏰ PRUEBA 30 SEGUNDOS',
            body: `Programada desde ${new Date().toLocaleTimeString()} - Debe llegar en 30 seg`,
            channelId: 'medical-urgent',
            priority: 'max',
            sound: 'default',
          },
          trigger: { seconds: 30 },
        });
        console.log('✅ Notificación 30s programada con ID:', thirtySecId);
        
        // Notificación en 2 minutos
        console.log('🧪 Programando notificación en 2 minutos...');
        const twoMinId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '🕐 PRUEBA 2 MINUTOS',
            body: `Programada desde ${new Date().toLocaleTimeString()} - Debe llegar en 2 min`,
            channelId: 'medical-urgent',
            priority: 'max',
            sound: 'default',
          },
          trigger: { seconds: 120 },
        });
        console.log('✅ Notificación 2min programada con ID:', twoMinId);
        
        // Verificar notificaciones programadas
        const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
        console.log('📋 Total de notificaciones programadas:', scheduledNotifications.length);
        console.log('📋 Notificaciones programadas:', scheduledNotifications.map(n => ({
          id: n.identifier,
          title: n.content.title,
          trigger: n.trigger
        })));
        
        console.log('✅ Todas las notificaciones de prueba programadas exitosamente');
        
        return {
          device: deviceInfo,
          permissions: permissions,
          hasToken: !!this.expoPushToken,
          projectId: Constants?.expoConfig?.extra?.eas?.projectId,
          isExpoGo: isExpoGo,
          testNotifications: {
            immediate: immediateId,
            thirtySeconds: thirtySecId,
            twoMinutes: twoMinId
          },
          scheduledCount: scheduledNotifications.length,
          timestamp: new Date().toISOString()
        };
        
      } catch (notificationError) {
        console.error('❌ Error programando notificaciones:', notificationError);
        Alert.alert(
          '❌ Error de Notificaciones',
          `No se pudieron programar las notificaciones:\n${notificationError.message}\n\nEsto puede ser debido a limitaciones de Expo Go.`,
          [{ text: 'Entendido' }]
        );
        throw notificationError;
      }
      
    } catch (error) {
      console.error('❌ Error en diagnóstico avanzado:', error);
      return { error: error.message };
    }
  }
}

// Exportar instancia singleton
const notificationService = new NotificationService();
export default notificationService;
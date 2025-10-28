import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notificationService } from '../services';
import CustomButton from '../components/ui/CustomButton';

const TestNotifications = () => {
  const testLoginNotification = async () => {
    await notificationService.showLoginSuccess('Juan Pérez');
  };

  const testAppointmentCreated = async () => {
    const mockAppointment = {
      id: 123,
      fecha: '2024-01-20T14:30:00',
      medico: {
        nombre: 'Dr. García'
      }
    };
    await notificationService.showAppointmentCreated(mockAppointment);
  };

  const testAppointmentConfirmed = async () => {
    const mockAppointment = {
      id: 123,
      fecha: '2024-01-20T14:30:00'
    };
    await notificationService.showAppointmentStatusUpdate(
      mockAppointment,
      'confirmada',
      'Dr. García'
    );
  };

  const testAppointmentCancelled = async () => {
    const mockAppointment = {
      id: 123,
      fecha: '2024-01-20T14:30:00'
    };
    await notificationService.showAppointmentStatusUpdate(
      mockAppointment,
      'cancelada',
      'Dr. García'
    );
  };

  const testAppointmentReminder = async () => {
    const mockAppointment = {
      id: 123,
      fecha: '2024-01-20T14:30:00',
      medico: {
        nombre: 'Dr. García'
      }
    };
    await notificationService.showAppointmentReminder(mockAppointment);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Test de Notificaciones</Text>
        <Text style={styles.subtitle}>Prueba las diferentes notificaciones del sistema</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Autenticación</Text>
          <CustomButton
            title="Notificación de Login"
            onPress={testLoginNotification}
            style={styles.button}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Gestión de Citas</Text>
          
          <CustomButton
            title="Cita Creada"
            onPress={testAppointmentCreated}
            style={styles.button}
            variant="secondary"
          />
          
          <CustomButton
            title="Cita Confirmada"
            onPress={testAppointmentConfirmed}
            style={styles.button}
            variant="success"
          />
          
          <CustomButton
            title="Cita Cancelada"
            onPress={testAppointmentCancelled}
            style={styles.button}
            variant="danger"
          />
          
          <CustomButton
            title="Recordatorio de Cita"
            onPress={testAppointmentReminder}
            style={styles.button}
            variant="outline"
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            💡 Las notificaciones aparecerán como notificaciones locales del sistema.
            Asegúrate de tener los permisos habilitados en tu dispositivo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  button: {
    marginBottom: 12,
  },
  info: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TestNotifications;
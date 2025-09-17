import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomButton from '../../components/ui/CustomButton';

const DoctorAppointments = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const appointmentsData = await apiService.getDoctorAppointments();
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await apiService.updateAppointmentStatus(appointmentId, newStatus);
      // Reload appointments to reflect changes
      await loadAppointments();
      Alert.alert('Éxito', 'Estado de la cita actualizado correctamente');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita');
    }
  };

  const confirmStatusChange = (appointmentId, newStatus, statusText) => {
    Alert.alert(
      'Confirmar cambio',
      `¿Estás seguro de cambiar el estado de esta cita a "${statusText}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Confirmar',
          onPress: () => handleStatusChange(appointmentId, newStatus),
        },
      ]
    );
  };

  const AppointmentCard = ({ appointment }) => {
    const canChangeStatus = appointment.estado?.toLowerCase() === 'pendiente';

    return (
      <View style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentDate}>
            {new Date(appointment.fecha).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <View style={[styles.statusBadge, getStatusStyle(appointment.estado)]}>
            <Text style={styles.statusText}>{getStatusText(appointment.estado)}</Text>
          </View>
        </View>

        <Text style={styles.appointmentTime}>
          {new Date(appointment.fecha).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>

        <Text style={styles.appointmentMotivo}>{appointment.motivo || 'Consulta general'}</Text>

        <View style={styles.patientInfo}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.patientName}>
            {appointment.paciente?.user?.name || 'Paciente'}
          </Text>
        </View>

        {appointment.paciente?.documento && (
          <Text style={styles.patientDocument}>
            Documento: {appointment.paciente.documento}
          </Text>
        )}

        {canChangeStatus && (
          <View style={styles.actionButtons}>
            <CustomButton
              title="Confirmar"
              onPress={() => confirmStatusChange(appointment.id, 'confirmada', 'Confirmada')}
              variant="secondary"
              size="small"
              style={styles.actionButton}
            />
            <CustomButton
              title="Cancelar"
              onPress={() => confirmStatusChange(appointment.id, 'cancelada', 'Cancelada')}
              variant="danger"
              size="small"
              style={styles.actionButton}
            />
          </View>
        )}
      </View>
    );
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
        return styles.statusConfirmed;
      case 'cancelada':
        return styles.statusCancelled;
      case 'realizada':
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      case 'realizada':
        return 'Realizada';
      default:
        return 'Pendiente';
    }
  };

  const pendingAppointments = appointments.filter(apt =>
    apt.estado?.toLowerCase() === 'pendiente'
  );

  const confirmedAppointments = appointments.filter(apt =>
    apt.estado?.toLowerCase() === 'confirmada'
  );

  const completedAppointments = appointments.filter(apt =>
    apt.estado?.toLowerCase() === 'realizada'
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Dr. {user?.name || 'Médico'}</Text>
            <Text style={styles.subtitle}>Panel de Citas</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Pending Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Citas Pendientes ({pendingAppointments.length})</Text>
          {pendingAppointments.length > 0 ? (
            pendingAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay citas pendientes</Text>
            </View>
          )}
        </View>

        {/* Confirmed Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Citas Confirmadas ({confirmedAppointments.length})</Text>
          {confirmedAppointments.length > 0 ? (
            confirmedAppointments.map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay citas confirmadas</Text>
            </View>
          )}
        </View>

        {/* Completed Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Citas ({completedAppointments.length})</Text>
          {completedAppointments.length > 0 ? (
            completedAppointments.slice(0, 5).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay citas completadas</Text>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusPending: {
    backgroundColor: '#FF9500',
  },
  statusConfirmed: {
    backgroundColor: '#34C759',
  },
  statusCancelled: {
    backgroundColor: '#FF3B30',
  },
  statusCompleted: {
    backgroundColor: '#007AFF',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appointmentMotivo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  patientDocument: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default DoctorAppointments;
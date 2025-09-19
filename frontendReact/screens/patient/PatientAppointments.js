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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import apiService from '../../services/api/api';

const PatientAppointments = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  const loadAppointments = async () => {
    try {
      const appointmentsData = await apiService.getPatientAppointments();
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert(
      'Cancelar Cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelAppointment(appointmentId);
              Alert.alert('Éxito', 'Cita cancelada exitosamente');
              loadAppointments(); // Refresh the list
            } catch (error) {
              console.error('Error canceling appointment:', error);
              Alert.alert('Error', 'No se pudo cancelar la cita. Intente nuevamente.');
            }
          },
        },
      ]
    );
  };

  const AppointmentCard = ({ appointment, showCancelButton = false, onCancel }) => {
    const isUpcoming = new Date(appointment.fecha) >= new Date();
    const isNotCancelled = appointment.estado?.toLowerCase() !== 'cancelada';

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

        {appointment.medico && (
          <View style={styles.doctorInfo}>
            <Ionicons name="medical" size={16} color="#666" />
            <Text style={styles.doctorName}>
              Dr. {appointment.medico.user?.name || 'Médico asignado'}
            </Text>
          </View>
        )}

        {appointment.medico?.especialidad && (
          <Text style={styles.specialty}>
            Especialidad: {appointment.medico.especialidad.nombre || 'General'}
          </Text>
        )}

        {showCancelButton && isUpcoming && isNotCancelled && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => onCancel(appointment.id)}
            >
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
              <Text style={styles.cancelButtonText}>Cancelar Cita</Text>
            </TouchableOpacity>
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

  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.fecha) >= new Date() && apt.estado?.toLowerCase() !== 'cancelada'
  );

  const pastAppointments = appointments.filter(apt =>
    new Date(apt.fecha) < new Date() || apt.estado?.toLowerCase() === 'realizada'
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>{user?.name || 'Paciente'}</Text>
            <Text style={styles.subtitle}>Mis Citas</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas Citas ({upcomingAppointments.length})</Text>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                showCancelButton={true}
                onCancel={handleCancelAppointment}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No tienes citas próximas</Text>
              <Text style={styles.emptyStateSubtext}>
                Contacta con tu médico para agendar una cita
              </Text>
            </View>
          )}
        </View>

        {/* Past Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial de Citas ({pastAppointments.length})</Text>
          {pastAppointments.length > 0 ? (
            pastAppointments.slice(0, 10).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay citas anteriores</Text>
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
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  specialty: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default PatientAppointments;
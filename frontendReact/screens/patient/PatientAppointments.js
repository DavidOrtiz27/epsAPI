import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
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
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('proximas'); // 'proximas', 'historial'

  // Helper function to properly handle timezone conversion
  const formatAppointmentDateTime = (fechaString) => {
    // Since Laravel is now configured to use America/Bogota timezone,
    // dates should come in the correct local timezone
    console.log('Formatting date string from backend:', fechaString);
    
    let date;
    
    if (fechaString.includes('T') && fechaString.includes('Z')) {
      // ISO format with UTC timezone - convert to local
      date = new Date(fechaString);
    } else if (fechaString.includes('T')) {
      // ISO format without timezone - assume it's already in local timezone
      date = new Date(fechaString);
    } else {
      // Format like "2024-01-15 14:30:00" - assume it's in local timezone (Colombia)
      date = new Date(fechaString.replace(' ', 'T'));
    }
    
    console.log('Parsed date object:', date);
    console.log('Local time string:', date.toLocaleString());
    
    return date;
  };

  const formatTime12Hour = (fechaString) => {
    const date = formatAppointmentDateTime(fechaString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  const loadAppointments = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      const appointmentsData = await apiService.getPatientAppointments();
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadAppointments(true);
  };

  const handleCancelAppointment = async (appointmentId) => {
    Alert.alert(
      'Cancelar Cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelAppointment(appointmentId);
              Alert.alert('Éxito', 'Cita cancelada exitosamente');
              loadAppointments();
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
    const appointmentDate = formatAppointmentDateTime(appointment.fecha);
    const now = new Date();
    
    // Debug logging for timezone issues
    console.log('Original fecha from backend:', appointment.fecha);
    console.log('Parsed appointmentDate:', appointmentDate);
    console.log('appointmentDate UTC string:', appointmentDate.toISOString());
    console.log('appointmentDate local string:', appointmentDate.toLocaleString());
    console.log('Formatted time 12h:', formatTime12Hour(appointment.fecha));
    
    const isUpcoming = appointmentDate >= now;
    const isCancellable = appointment.estado?.toLowerCase() !== 'cancelada' &&
                         appointment.estado?.toLowerCase() !== 'realizada';

    return (
      <View style={styles.appointmentCard}>
        {/* Fecha + Estado */}
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentDate}>
            {appointmentDate.toLocaleDateString('es-ES', {
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

        {/* Hora */}
        <Text style={styles.appointmentTime}>
          {formatTime12Hour(appointment.fecha)}
        </Text>

        {/* Motivo */}
        <Text style={styles.appointmentMotivo}>
          {appointment.motivo || 'Consulta general'}
        </Text>

        {/* Médico */}
        <View style={styles.doctorInfo}>
          <Ionicons name="medical" size={16} color="#666" />
          <Text style={styles.doctorName}>
            {appointment.medico?.user?.name ? `Dr. ${appointment.medico.user.name}` : 'Médico asignado'}
          </Text>
        </View>

        {/* Especialidad */}
        {appointment.medico?.especialidad?.nombre && (
          <Text style={styles.specialty}>
            Especialidad: {appointment.medico.especialidad.nombre}
          </Text>
        )}

        {/* Botón cancelar */}
        {showCancelButton && isUpcoming && isCancellable && (
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

  // Validar que appointments sea un array antes de filtrar
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const upcomingAppointments = safeAppointments.filter(
    (apt) => {
      const appointmentDate = formatAppointmentDateTime(apt.fecha);
      const now = new Date();
      const isFuture = appointmentDate >= now;
      const isActive = apt.estado?.toLowerCase() !== 'cancelada' && apt.estado?.toLowerCase() !== 'realizada';
      return isFuture && isActive;
    }
  );

  const pastAppointments = safeAppointments.filter(
    (apt) => {
      const appointmentDate = formatAppointmentDateTime(apt.fecha);
      const now = new Date();
      const isPast = appointmentDate < now;
      const isCompleted = apt.estado?.toLowerCase() === 'realizada' || apt.estado?.toLowerCase() === 'cancelada';
      return isPast || isCompleted;
    }
  );

  const getFilteredAppointments = () => {
    switch (activeTab) {
      case 'proximas':
        return upcomingAppointments;
      case 'historial':
        return pastAppointments;
      default:
        return upcomingAppointments;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'proximas':
        return `Próximas Citas (${upcomingAppointments.length})`;
      case 'historial':
        return `Historial de Citas (${pastAppointments.length})`;
      default:
        return 'Citas';
    }
  };

  const getEmptyStateIcon = () => {
    return activeTab === 'historial' ? 'time-outline' : 'calendar-outline';
  };

  const getEmptyStateText = () => {
    return activeTab === 'historial' ? 'No hay citas anteriores' : 'No tienes citas próximas';
  };

  const getEmptyStateSubtext = () => {
    return activeTab === 'proximas' ? 'Contacta con tu médico para agendar una cita' : null;
  };

  const filteredAppointments = getFilteredAppointments();
  const showCancelButton = activeTab === 'proximas';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>{user?.name || 'Paciente'}</Text>
          <Text style={styles.subtitle}>Mis Citas</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PatientBookAppointment')}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'proximas' && styles.activeTab]}
          onPress={() => setActiveTab('proximas')}
        >
          <Text style={[styles.tabText, activeTab === 'proximas' && styles.activeTabText]}>
            Próximas ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'historial' && styles.activeTab]}
          onPress={() => setActiveTab('historial')}
        >
          <Text style={[styles.tabText, activeTab === 'historial' && styles.activeTabText]}>
            Historial ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getTabTitle()}</Text>
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                showCancelButton={showCancelButton}
                onCancel={handleCancelAppointment}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name={getEmptyStateIcon()} size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>{getEmptyStateText()}</Text>
              {getEmptyStateSubtext() && (
                <Text style={styles.emptyStateSubtext}>{getEmptyStateSubtext()}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
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
  welcomeContainer: { flex: 1 },
  welcomeText: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666' },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  addButton: { padding: 8, marginRight: 8 },
  logoutButton: { padding: 8 },
  section: { paddingHorizontal: 24, paddingVertical: 20 },
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
    shadowOffset: { width: 0, height: 2 },
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
  appointmentDate: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  statusPending: { backgroundColor: '#FF9500' },
  statusConfirmed: { backgroundColor: '#34C759' },
  statusCancelled: { backgroundColor: '#FF3B30' },
  statusCompleted: { backgroundColor: '#007AFF' },
  appointmentTime: { fontSize: 14, color: '#666', marginBottom: 4 },
  appointmentMotivo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  doctorInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  doctorName: { fontSize: 14, color: '#666', marginLeft: 4, flexShrink: 1 },
  specialty: { fontSize: 12, color: '#999', marginTop: 4, flexWrap: 'wrap' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: '#007AFF' },
});

export default PatientAppointments;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomButton from '../../components/ui/CustomButton';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Removed modal form state and dropdown states - now using PatientBookAppointment screen

  // Helper function to properly handle timezone conversion
  const formatAppointmentDateTime = (fechaString) => {
    // Since Laravel is now configured to use America/Bogota timezone,
    // dates should come in the correct local timezone
    console.log('Dashboard - Formatting date string from backend:', fechaString);
    
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
    
    console.log('Dashboard - Parsed date object:', date);
    console.log('Dashboard - Local time string:', date.toLocaleString());
    
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
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      const appointmentsData = await apiService.getPatientAppointments();
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (!isRefreshing) {
        Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadDashboardData(true);
  };

  // Removed modal-related functions - now using PatientBookAppointment screen

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const InfoCard = ({ title, value, icon, color = '#007AFF' }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="#fff" />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardValue}>{value}</Text>
        </View>
      </View>
    </View>
  );

  const AppointmentCard = ({ appointment }) => {
    const appointmentDate = formatAppointmentDateTime(appointment.fecha);
    
    return (
      <View style={styles.appointmentCard}>
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
        <Text style={styles.appointmentTime}>
          {formatTime12Hour(appointment.fecha)}
        </Text>
        <Text style={styles.appointmentMotivo}>{appointment.motivo || 'Consulta general'}</Text>
        {appointment.medico && (
          <Text style={styles.appointmentDoctor}>
            {/* Adaptado para la nueva estructura optimizada del backend */}
            Dr. {appointment.medico?.nombre || appointment.medico?.user?.name || 'Médico asignado'}
          </Text>
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

  {/*filter of next appointments*/}
  const upcomingAppointments = safeAppointments.filter(apt => {
    const appointmentDate = formatAppointmentDateTime(apt.fecha);
    const now = new Date();
    const isFuture = appointmentDate >= now;
    const isActive = apt.estado?.toLowerCase() !== 'cancelada' && apt.estado?.toLowerCase() !== 'realizada';
    return isFuture && isActive;
  });

  // Recent appointments (past appointments)
  const recentAppointments = safeAppointments.filter(apt => {
    const appointmentDate = formatAppointmentDateTime(apt.fecha);
    const now = new Date();
    return appointmentDate < now || apt.estado?.toLowerCase() === 'realizada';
  }).slice(0, 3);


  return (
    <SafeAreaView style={styles.container}>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>¡Hola!</Text>
            <Text style={styles.userName}>{user?.name || 'Paciente'}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <InfoCard
            title="Próximas citas"
            value={upcomingAppointments.length.toString()}
            icon="calendar-outline"
            color="#007AFF"
          />
          <InfoCard
            title="Historial médico"
            value={recentAppointments.length.toString()}
            icon="document-text-outline"
            color="#34C759"
          />
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas Citas</Text>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.slice(0, 2).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No tienes citas próximas</Text>
            </View>
          )}

          {/* Solicitar Nueva Cita */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitar Nueva Cita</Text>
            <CustomButton
              title="Solicitar Cita"
              onPress={() => navigation.navigate('Citas', { screen: 'PatientBookAppointment' })}
              backgroundColor="#007AFF"
              textColor="#fff"
            />
          </View>
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
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
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
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 14,
    color: '#666',
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

export default PatientDashboard;
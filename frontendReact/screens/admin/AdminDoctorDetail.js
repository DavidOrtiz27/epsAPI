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
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminDoctorDetail = ({ navigation, route }) => {
  const { user } = useAuth();
  const { doctorId } = route.params;
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDoctor();
  }, [doctorId]);

  const loadDoctor = async () => {
    try {
      const doctorData = await apiService.getDoctor(doctorId);
      setDoctor(doctorData);
    } catch (error) {
      console.error('Error loading doctor:', error);
      Alert.alert('Error', 'No se pudo cargar la información del doctor');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDoctor();
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Doctor',
      `¿Estás seguro de que quieres eliminar al doctor ${doctor?.user?.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteDoctor()
        }
      ]
    );
  };

  const deleteDoctor = async () => {
    try {
      await apiService.deleteDoctor(doctorId);
      Alert.alert('Éxito', 'Doctor eliminado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      Alert.alert('Error', 'No se pudo eliminar el doctor');
    }
  };

  const renderInfoSection = (title, icon, children) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderInfoRow = (label, value, icon = null) => (
    <View style={styles.infoRow}>
      {icon && <Ionicons name={icon} size={16} color="#666" style={styles.infoIcon} />}
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value || 'No especificado'}</Text>
    </View>
  );

  // Función para formatear hora a AM/PM
  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Función para obtener el nombre del día
  const getDayLabel = (dayKey) => {
    const days = {
      lunes: 'Lunes',
      martes: 'Martes',
      miercoles: 'Miércoles',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };
    return days[dayKey] || dayKey;
  };

  // Función para renderizar los horarios detallados
  const renderScheduleItem = (schedule) => (
    <View key={schedule.id} style={styles.scheduleItem}>
      <View style={styles.scheduleDay}>
        <Ionicons name="calendar-outline" size={16} color="#007AFF" />
        <Text style={styles.scheduleDayText}>{getDayLabel(schedule.dia_semana)}</Text>
      </View>
      <View style={styles.scheduleTime}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.scheduleTimeText}>
          {formatTo12Hour(schedule.hora_inicio?.substring(0, 5))} - {formatTo12Hour(schedule.hora_fin?.substring(0, 5))}
        </Text>
      </View>
    </View>
  );

  const renderStatsCard = (title, value, icon, color) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsIcon}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando doctor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Doctor no encontrado</Text>
          <TouchableOpacity
            style={styles.errorBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorBackButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {doctor.user?.name || 'Doctor'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminDoctorForm', { doctorId: doctor.id })}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
      >
        {/* Doctor Info */}
        {renderInfoSection('Información Personal', 'person-outline', (
          <>
            {renderInfoRow('Nombre', doctor.user?.name, 'person')}
            {renderInfoRow('Especialidad', doctor.especialidad, 'medical')}
            {renderInfoRow('Registro Profesional', doctor.registro_profesional, 'card')}
            {renderInfoRow('Teléfono', doctor.telefono, 'call')}
            {renderInfoRow('Email', doctor.user?.email, 'mail')}
          </>
        ))}

        {/* Detailed Schedules */}
        {doctor.horarios_medicos && doctor.horarios_medicos.length > 0 && (
          renderInfoSection('Horarios de Atención', 'time-outline', (
            <View style={styles.schedulesContainer}>
              {doctor.horarios_medicos
                .sort((a, b) => {
                  const daysOrder = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
                  return daysOrder.indexOf(a.dia_semana) - daysOrder.indexOf(b.dia_semana);
                })
                .map(schedule => renderScheduleItem(schedule))
              }
            </View>
          ))
        )}

        {/* No Schedules Message */}
        {(!doctor.horarios_medicos || doctor.horarios_medicos.length === 0) && (
          renderInfoSection('Horarios de Atención', 'time-outline', (
            <View style={styles.noSchedulesContainer}>
              <Ionicons name="time-outline" size={40} color="#999" />
              <Text style={styles.noSchedulesText}>
                Este doctor aún no ha configurado sus horarios de atención
              </Text>
            </View>
          ))
        )}

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Citas Totales',
              doctor.citas?.length || 0,
              'calendar-outline',
              '#007AFF'
            )}
            {renderStatsCard(
              'Pacientes Atendidos',
              [...new Set(doctor.citas?.map(cita => cita.paciente_id) || [])].length,
              'people-outline',
              '#34C759'
            )}
            {renderStatsCard(
              'Horarios Disponibles',
              doctor.horarios_medicos?.length || 0,
              'time-outline',
              '#FF9500'
            )}
            {renderStatsCard(
              'Citas Pendientes',
              doctor.citas?.filter(cita => cita.estado === 'pendiente').length || 0,
              'time-outline',
              '#FF3B30'
            )}
          </View>
        </View>

        

        {/* Recent Activity */}
        {doctor.citas && doctor.citas.length > 0 && (
          renderInfoSection('Citas Recientes', 'calendar-outline', (
            doctor.citas
              .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
              .slice(0, 5)
              .map((cita) => (
                <View key={cita.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name={
                        cita.estado === 'realizada' ? 'checkmark-circle' :
                        cita.estado === 'confirmada' ? 'checkmark-circle-outline' :
                        cita.estado === 'cancelada' ? 'close-circle' : 'time'
                      }
                      size={20}
                      color={
                        cita.estado === 'realizada' ? '#34C759' :
                        cita.estado === 'confirmada' ? '#007AFF' :
                        cita.estado === 'cancelada' ? '#FF3B30' : '#FF9500'
                      }
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>
                      Cita {cita.estado} - {new Date(cita.fecha).toLocaleDateString()}
                    </Text>
                    <Text style={styles.activityTime}>
                      Paciente: {cita.paciente?.user?.name || 'Sin nombre'}
                    </Text>
                  </View>
                </View>
              ))
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f4f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  deleteButton: {
    backgroundColor: '#fff0f0',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // --- Sections ---
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
  },

  // --- Info Rows ---
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: '#222',
    flex: 1,
  },

  // --- Stats ---
  statsSection: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    width: '48%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsIcon: {
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  statsTitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  // --- Activity ---
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  schedulesContainer: {
    marginTop: 5,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  scheduleDay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleDayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  scheduleTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  noSchedulesContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 5,
  },
  noSchedulesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
});


export default AdminDoctorDetail;
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

const AdminPatientDetail = ({ navigation, route }) => {
  const { user } = useAuth();
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      const patientData = await apiService.getPatient(patientId);
      setPatient(patientData);
    } catch (error) {
      console.error('Error loading patient:', error);
      Alert.alert('Error', 'No se pudo cargar la información del paciente');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPatient();
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Paciente',
      `¿Estás seguro de que quieres eliminar al paciente ${patient?.user?.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deletePatient()
        }
      ]
    );
  };

  const deletePatient = async () => {
    try {
      await apiService.deletePatient(patientId);
      Alert.alert('Éxito', 'Paciente eliminado correctamente');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting patient:', error);
      Alert.alert('Error', 'No se pudo eliminar el paciente');
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
          <Text style={styles.loadingText}>Cargando paciente...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Paciente no encontrado</Text>
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

  const genderText = {
    'M': 'Masculino',
    'F': 'Femenino',
    'O': 'Otro',
  }[patient.genero] || 'No especificado';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {patient.user?.name || 'Paciente'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminPatientForm', { patientId: patient.id })}
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
        {/* Patient Info */}
        {renderInfoSection('Información Personal', 'person-outline', (
          <>
            {renderInfoRow('Nombre', patient.user?.name, 'person')}
            {renderInfoRow('Documento', patient.documento, 'card')}
            {renderInfoRow('Teléfono', patient.telefono, 'call')}
            {renderInfoRow('Dirección', patient.direccion, 'location')}
            {renderInfoRow('Fecha de Nacimiento', patient.fecha_nacimiento ?
              new Date(patient.fecha_nacimiento).toLocaleDateString() : null, 'calendar')}
            {renderInfoRow('Género', genderText, 'male-female')}
            {renderInfoRow('Fecha de Registro', patient.created_at ?
              new Date(patient.created_at).toLocaleDateString() : null, 'time')}
          </>
        ))}

        {/* Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard(
              'Citas Totales',
              patient.citas?.length || 0,
              'calendar-outline',
              '#007AFF'
            )}
            {renderStatsCard(
              'Registros Médicos',
              patient.historial_clinico?.length || 0,
              'medical-outline',
              '#34C759'
            )}
            {renderStatsCard(
              'Tratamientos',
              patient.historial_clinico?.reduce((total, record) =>
                total + (record.tratamientos?.length || 0), 0) || 0,
              'medkit-outline',
              '#FF9500'
            )}
            {renderStatsCard(
              'Facturas',
              patient.facturas?.length || 0,
              'receipt-outline',
              '#5856D6'
            )}
          </View>
        </View>

        {/* Recent Activity */}
        {patient.citas && patient.citas.length > 0 && (
          renderInfoSection('Citas Recientes', 'calendar-outline', (
            (Array.isArray(patient.citas) ? patient.citas : [])
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
                      {cita.motivo || 'Sin motivo especificado'}
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
});

export default AdminPatientDetail;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const PatientHistory = () => {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      const historyData = await apiService.getPatientHistory();
      setHistory(historyData || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadHistory(true);
  };

  const HistoryCard = ({ record }) => {
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) + ' a las ' + date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
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

    return (
      <View style={styles.historyCard}>
        {/* Header mejorado con fecha y hora completa */}
        <View style={styles.cardHeader}>
          <View style={styles.dateTimeContainer}>
            <Ionicons name="calendar" size={18} color="#007AFF" />
            <Text style={styles.consultationDateTime}>
              {formatDateTime(record.cita?.fecha || record.fecha || record.created_at)}
            </Text>
          </View>
          {record.cita?.estado && (
            <View style={[styles.statusBadge, getStatusStyle(record.cita.estado)]}>
              <Text style={styles.statusText}>{getStatusText(record.cita.estado)}</Text>
            </View>
          )}
        </View>

        {/* Información del médico */}
        {record.cita?.medico?.name && (
          <View style={styles.doctorSection}>
            <Ionicons name="medical" size={16} color="#4CAF50" />
            <Text style={styles.doctorName}>Dr. {record.cita.medico.name}</Text>
          </View>
        )}

        {/* Motivo de la consulta */}
        {record.cita?.motivo && (
          <View style={styles.reasonSection}>
            <Text style={styles.sectionLabel}>Motivo de consulta:</Text>
            <Text style={styles.reasonText}>{record.cita.motivo}</Text>
          </View>
        )}

        {/* Diagnóstico */}
        {record.diagnostico && (
          <View style={styles.diagnosisSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="clipboard" size={16} color="#FF9800" />
              <Text style={styles.sectionTitle}>Diagnóstico</Text>
            </View>
            <Text style={styles.diagnosisText}>{record.diagnostico}</Text>
          </View>
        )}

        {/* Tratamientos */}
        {record.tratamientos && Array.isArray(record.tratamientos) && record.tratamientos.length > 0 && (
          <View style={styles.treatmentsSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical" size={16} color="#2196F3" />
              <Text style={styles.sectionTitle}>Tratamientos prescritos ({record.tratamientos.length})</Text>
            </View>
            {record.tratamientos
              .filter(tratamiento => tratamiento && tratamiento.descripcion)
              .map((tratamiento, index) => (
                <View key={`treatment-${tratamiento.id || index}`} style={styles.treatmentItem}>
                  <View style={styles.treatmentHeader}>
                    <Text style={styles.treatmentNumber}>{index + 1}.</Text>
                    <Text style={styles.treatmentDescription}>{tratamiento.descripcion}</Text>
                  </View>
                  
                  {/* Fechas del tratamiento */}
                  {(tratamiento.fecha_inicio || tratamiento.fecha_fin) && (
                    <View style={styles.treatmentDates}>
                      {tratamiento.fecha_inicio && (
                        <Text style={styles.treatmentDate}>
                          ⏰ Inicio: {formatDate(tratamiento.fecha_inicio)}
                        </Text>
                      )}
                      {tratamiento.fecha_fin && (
                        <Text style={styles.treatmentDate}>
                          ⏰ Fin: {formatDate(tratamiento.fecha_fin)}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Medicamentos prescritos */}
                  {tratamiento.medicamentos && Array.isArray(tratamiento.medicamentos) && tratamiento.medicamentos.length > 0 && (
                    <View style={styles.medicationsSection}>
                      <Text style={styles.medicationsTitle}>💊 Medicamentos:</Text>
                      {tratamiento.medicamentos.map((medicamento, medIndex) => (
                        <View key={`med-${medicamento.id || medIndex}`} style={styles.medicationItem}>
                          <Text style={styles.medicationName}>{medicamento.nombre}</Text>
                          {medicamento.presentacion && (
                            <Text style={styles.medicationDetail}>📋 {medicamento.presentacion}</Text>
                          )}
                          {medicamento.dosis && (
                            <Text style={styles.medicationDetail}>💊 Dosis: {medicamento.dosis}</Text>
                          )}
                          {medicamento.frecuencia && (
                            <Text style={styles.medicationDetail}>⏰ Frecuencia: {medicamento.frecuencia}</Text>
                          )}
                          {medicamento.duracion && (
                            <Text style={styles.medicationDetail}>📅 Duración: {medicamento.duracion}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {/* Indicador si no hay información clínica */}
        {!record.diagnostico && (!record.tratamientos || record.tratamientos.length === 0) && (
          <View style={styles.noMedicalDataSection}>
            <Ionicons name="information-circle-outline" size={16} color="#9E9E9E" />
            <Text style={styles.noMedicalDataText}>
              Consulta realizada - Información clínica no disponible
            </Text>
          </View>
        )}

      </View>
    );
  };

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
            <Text style={styles.welcomeText}>{user?.name || 'Paciente'}</Text>
            <Text style={styles.subtitle}>Historial Médico</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Medical History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Consultas Médicas ({history.length})</Text>
          {history.length > 0 ? (
            history.map((record) => (
              <HistoryCard key={record._uniqueKey || record.id} record={record} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay consultas registradas</Text>
              <Text style={styles.emptyStateSubtext}>
                Tus consultas médicas aparecerán aquí una vez que visites a un médico
              </Text>
            </View>
          )}
        </View>

        {/* Health Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen de Salud</Text>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{history.length}</Text>
              <Text style={styles.summaryLabel}>Consultas</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {history.filter(h => h.tratamientos && h.tratamientos.length > 0).length}
              </Text>
              <Text style={styles.summaryLabel}>Tratamientos</Text>
            </View>
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Información Importante</Text>
              <Text style={styles.infoText}>
                Esta información es para referencia general. Para cualquier duda sobre su salud,
                tratamientos o resultados, consulte siempre con su médico tratante.
              </Text>
            </View>
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
  historyCard: {
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
  recordType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordTypeText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
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
  appointmentDoctor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appointmentMotivo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  diagnosisSection: {
    marginBottom: 12,
  },
  treatmentsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  diagnosis: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  treatmentItem: {
    marginBottom: 8,
  },
  treatmentText: {
    fontSize: 14,
    color: '#333',
  },
  treatmentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summarySection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  // Important Information styles
  infoSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  // New styles for improved medical history
  cardHeader: {
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  consultationDateTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
    flex: 1,
  },
  doctorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
  reasonSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  diagnosisText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  treatmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  treatmentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginRight: 8,
    minWidth: 20,
  },
  treatmentDescription: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  treatmentDates: {
    marginTop: 4,
    marginLeft: 28,
  },
  medicationsSection: {
    marginTop: 8,
    marginLeft: 28,
    backgroundColor: '#f8f9ff',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  medicationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  medicationItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  medicationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  medicationDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  noMedicalDataSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  noMedicalDataText: {
    fontSize: 12,
    color: '#9E9E9E',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  });

export default PatientHistory;
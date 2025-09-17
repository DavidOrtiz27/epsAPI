import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const PatientHistory = () => {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const historyData = await apiService.getPatientHistory();
      setHistory(historyData || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const HistoryCard = ({ record }) => (
    <View style={styles.historyCard}>
      <View style={styles.historyHeader}>
        <Text style={styles.historyDate}>
          {new Date(record.fecha || record.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <View style={styles.recordType}>
          <Ionicons name="document-text-outline" size={16} color="#007AFF" />
          <Text style={styles.recordTypeText}>Registro Médico</Text>
        </View>
      </View>

      <Text style={styles.diagnosis}>{record.diagnostico || 'Diagnóstico no especificado'}</Text>

      {record.observaciones && (
        <Text style={styles.observations}>{record.observaciones}</Text>
      )}

      {record.medico && (
        <View style={styles.doctorInfo}>
          <Ionicons name="medical" size={16} color="#666" />
          <Text style={styles.doctorName}>
            Dr. {record.medico.user?.name || 'Médico tratante'}
          </Text>
        </View>
      )}

      {record.tratamientos && record.tratamientos.length > 0 && (
        <View style={styles.treatmentsSection}>
          <Text style={styles.sectionTitle}>Tratamientos:</Text>
          {record.tratamientos.map((tratamiento, index) => (
            <View key={index} style={styles.treatmentItem}>
              <Text style={styles.treatmentText}>• {tratamiento.descripcion}</Text>
              {tratamiento.fecha_inicio && (
                <Text style={styles.treatmentDate}>
                  Inicio: {new Date(tratamiento.fecha_inicio).toLocaleDateString('es-ES')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {record.examenes && record.examenes.length > 0 && (
        <View style={styles.examsSection}>
          <Text style={styles.sectionTitle}>Exámenes:</Text>
          {record.examenes.map((examen, index) => (
            <View key={index} style={styles.examItem}>
              <Text style={styles.examText}>• {examen.tipo || 'Examen médico'}</Text>
              {examen.resultado && (
                <Text style={styles.examResult}>{examen.resultado}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.sectionTitle}>Registros Médicos ({history.length})</Text>
          {history.length > 0 ? (
            history.map((record) => (
              <HistoryCard key={record.id} record={record} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay registros médicos</Text>
              <Text style={styles.emptyStateSubtext}>
                Tus registros médicos aparecerán aquí una vez que visites a un médico
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
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>
                {history.filter(h => h.examenes && h.examenes.length > 0).length}
              </Text>
              <Text style={styles.summaryLabel}>Exámenes</Text>
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyDate: {
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
  diagnosis: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  observations: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  treatmentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  examsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  examItem: {
    marginBottom: 8,
  },
  examText: {
    fontSize: 14,
    color: '#333',
  },
  examResult: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
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
});

export default PatientHistory;
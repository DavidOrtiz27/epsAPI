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

const DoctorPatients = () => {
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const patientsData = await apiService.getDoctorPatients();
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes');
    } finally {
      setLoading(false);
    }
  };

  const PatientCard = ({ patient }) => (
    <TouchableOpacity style={styles.patientCard}>
      <View style={styles.patientHeader}>
        <View style={styles.patientAvatar}>
          <Ionicons name="person" size={24} color="#007AFF" />
        </View>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{patient.user?.name || 'Paciente'}</Text>
          <Text style={styles.patientDocument}>Documento: {patient.documento}</Text>
        </View>
      </View>

      {patient.telefono && (
        <View style={styles.patientDetail}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.patientDetailText}>{patient.telefono}</Text>
        </View>
      )}

      {patient.direccion && (
        <View style={styles.patientDetail}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.patientDetailText}>{patient.direccion}</Text>
        </View>
      )}

      {patient.fecha_nacimiento && (
        <View style={styles.patientDetail}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.patientDetailText}>
            {new Date(patient.fecha_nacimiento).toLocaleDateString('es-ES')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Dr. {user?.name || 'Médico'}</Text>
            <Text style={styles.subtitle}>Mis Pacientes</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Patients List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pacientes Asignados ({patients.length})</Text>
          {patients.length > 0 ? (
            patients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No tienes pacientes asignados</Text>
              <Text style={styles.emptyStateSubtext}>
                Los pacientes serán asignados por el administrador del sistema
              </Text>
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
  patientCard: {
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
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  patientDocument: {
    fontSize: 14,
    color: '#666',
  },
  patientDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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

export default DoctorPatients;
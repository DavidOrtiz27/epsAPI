import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminPatients = ({ navigation }) => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [patients, searchQuery]);

  const loadPatients = async () => {
    try {
      const patientsData = await apiService.getPatients();
      setPatients(patientsData);
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterPatients = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const filtered = patients.filter(patient => {
      const fullName = `${patient.user?.name || ''}`.toLowerCase();
      const documento = `${patient.documento || ''}`.toLowerCase();
      const telefono = `${patient.telefono || ''}`.toLowerCase();

      const query = searchQuery.toLowerCase();

      return fullName.includes(query) ||
             documento.includes(query) ||
             telefono.includes(query);
    });

    setFilteredPatients(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPatients();
  };

  const handleDeletePatient = (patient) => {
    Alert.alert(
      'Eliminar Paciente',
      `¿Estás seguro de que quieres eliminar al paciente ${patient.user?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deletePatient(patient.id)
        }
      ]
    );
  };

  const deletePatient = async (patientId) => {
    try {
      await apiService.deletePatient(patientId);
      Alert.alert('Éxito', 'Paciente eliminado correctamente');
      loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      Alert.alert('Error', 'No se pudo eliminar el paciente');
    }
  };

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity
      style={styles.patientCard}
      onPress={() => navigation.navigate('AdminPatientDetail', { patientId: item.id })}
    >
      <View style={styles.patientInfo}>
        <View style={styles.patientHeader}>
          <Text style={styles.patientName} numberOfLines={2}>
            {item.user?.name || 'Sin nombre'}
          </Text>
          <View style={styles.patientActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminPatientForm', { patientId: item.id })}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeletePatient(item)}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.patientDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.documento || 'Sin documento'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.telefono || 'Sin teléfono'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.direccion || 'Sin dirección'}
            </Text>
          </View>
        </View>

        <View style={styles.patientFooter}>
          <Text style={styles.registrationDate}>
            Registrado: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Fecha desconocida'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los pacientes aparecerán aquí cuando sean registrados'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando pacientes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gestión de Pacientes</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AdminPatientForm')}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, documento o teléfono..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Patient List */}
      <FlatList
        data={filteredPatients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={<View style={styles.listFooter} />}
      />

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <Text style={styles.statsText}>
          Total: {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}
          {searchQuery ? ` (filtrado de ${patients.length})` : ''}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: 16,
  },
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  patientInfo: {
    padding: 16,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  patientActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  deleteButton: {
    backgroundColor: '#FFF5F5',
  },
  patientDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  patientFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  registrationDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  listFooter: {
    height: 80, // Space for the stats footer
  },
  statsFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 20, // Account for safe area
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AdminPatients;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminDoctors = ({ navigation }) => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery]);

  // Reload doctors when screen comes into focus (after creating/editing)
  useFocusEffect(
    React.useCallback(() => {
      loadDoctors();
    }, [])
  );

  const loadDoctors = async () => {
    try {
      const doctorsData = await apiService.getDoctors();
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert('Error', 'No se pudieron cargar los doctores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterDoctors = () => {
    if (!searchQuery.trim()) {
      setFilteredDoctors(doctors);
      return;
    }

    const filtered = doctors.filter(doctor => {
      const fullName = `${doctor.user?.name || ''}`.toLowerCase();
      const especialidad = `${doctor.especialidad || ''}`.toLowerCase();
      const registro = `${doctor.registro_profesional || ''}`.toLowerCase();

      const query = searchQuery.toLowerCase();

      return fullName.includes(query) ||
             especialidad.includes(query) ||
             registro.includes(query);
    });

    setFilteredDoctors(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDoctors();
  };

  const handleDeleteDoctor = (doctor) => {
    Alert.alert(
      'Eliminar Doctor',
      `¿Estás seguro de que quieres eliminar al doctor ${doctor.user?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteDoctor(doctor.id)
        }
      ]
    );
  };

  const deleteDoctor = async (doctorId) => {
    try {
      await apiService.deleteDoctor(doctorId);
      Alert.alert('Éxito', 'Doctor eliminado correctamente');
      loadDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      Alert.alert('Error', 'No se pudo eliminar el doctor');
    }
  };

  const renderDoctorItem = ({ item }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => navigation.navigate('AdminDoctorDetail', { doctorId: item.id })}
    >
      <View style={styles.doctorInfo}>
        <View style={styles.doctorHeader}>
          <Text style={styles.doctorName}>{item.user?.name || 'Sin nombre'}</Text>
          <View style={styles.doctorActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminDoctorForm', { doctorId: item.id })}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteDoctor(item)}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.doctorDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="medical" size={16} color="#666" />
            <Text style={styles.detailText}>{item.especialidad || 'Sin especialidad'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="card-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.registro_profesional || 'Sin registro'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.telefono || 'Sin teléfono'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medical-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No se encontraron doctores' : 'No hay doctores registrados'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los doctores aparecerán aquí cuando sean registrados'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando doctores...</Text>
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
          <Text style={styles.headerTitle}>Gestión de Doctores</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AdminDoctorForm')}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, especialidad o registro..."
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

      {/* Doctor List */}
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctorItem}
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
          Total: {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 'es' : ''}
          {searchQuery ? ` (filtrado de ${doctors.length})` : ''}
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
  doctorCard: {
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
  doctorInfo: {
    padding: 16,
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  doctorActions: {
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
  doctorDetails: {
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

export default AdminDoctors;
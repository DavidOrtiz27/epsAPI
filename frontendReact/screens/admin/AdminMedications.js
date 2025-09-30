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

const AdminMedications = ({ navigation }) => {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    filterMedications();
  }, [medications, searchQuery]);

  // Reload medications when screen comes into focus (after creating/editing)
  useFocusEffect(
    React.useCallback(() => {
      loadMedications();
    }, [])
  );

  const loadMedications = async () => {
    try {
      const medicationsData = await apiService.getMedications();
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error loading medications:', error);
      Alert.alert('Error', 'No se pudieron cargar los medicamentos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterMedications = () => {
    if (!searchQuery.trim()) {
      setFilteredMedications(medications);
      return;
    }

    const filtered = medications.filter(medication => {
      const nombre = `${medication.nombre || ''}`.toLowerCase();
      const presentacion = `${medication.presentacion || ''}`.toLowerCase();

      const query = searchQuery.toLowerCase();

      return nombre.includes(query) || presentacion.includes(query);
    });

    setFilteredMedications(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMedications();
  };

  const handleDeleteMedication = (medication) => {
    Alert.alert(
      'Eliminar Medicamento',
      `¿Estás seguro de que quieres eliminar el medicamento "${medication.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteMedication(medication.id)
        }
      ]
    );
  };

  const deleteMedication = async (medicationId) => {
    try {
      await apiService.deleteMedication(medicationId);
      Alert.alert('Éxito', 'Medicamento eliminado correctamente');
      loadMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      Alert.alert('Error', 'No se pudo eliminar el medicamento');
    }
  };

  const renderMedicationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.medicationCard}
      onPress={() => Alert.alert('Información', `Medicamento: ${item.nombre}\nPresentación: ${item.presentacion || 'N/A'}\nDosis: ${item.dosis_recomendada || 'N/A'}`)}
    >
      <View style={styles.medicationInfo}>
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>{item.nombre || 'Sin nombre'}</Text>
          <View style={styles.medicationActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('AdminMedicationForm', { medicationId: item.id })}
            >
              <Ionicons name="pencil" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteMedication(item)}
            >
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.medicationDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="medkit-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.presentacion || 'Sin presentación'}</Text>
          </View>

          {item.dosis_recomendada && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.detailText}>{item.dosis_recomendada}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="medkit-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No se encontraron medicamentos' : 'No hay medicamentos registrados'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los medicamentos aparecerán aquí cuando sean registrados'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando medicamentos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Gestión de Medicamentos</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AdminMedicationForm')}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre o presentación..."
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

      {/* Medication List */}
      <FlatList
        data={filteredMedications}
        renderItem={renderMedicationItem}
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
          Total: {filteredMedications.length} medicamento{filteredMedications.length !== 1 ? 's' : ''}
          {searchQuery ? ` (filtrado de ${medications.length})` : ''}
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
  medicationCard: {
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
  medicationInfo: {
    padding: 16,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicationName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  medicationActions: {
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
  medicationDetails: {
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

export default AdminMedications;
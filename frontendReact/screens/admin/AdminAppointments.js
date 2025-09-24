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

const AdminAppointments = ({ navigation }) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pendiente, confirmada, realizada, cancelada

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, searchQuery, statusFilter]);

  // Reload appointments when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAppointments();
    }, [])
  );

  const loadAppointments = async () => {
    try {
      const appointmentsData = await apiService.getAppointments();
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading appointments:', error);
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.estado === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(appointment => {
        const patientName = `${appointment.paciente?.user?.name || ''}`.toLowerCase();
        const doctorName = `${appointment.medico?.user?.name || ''}`.toLowerCase();
        const motivo = `${appointment.motivo || ''}`.toLowerCase();

        return patientName.includes(query) ||
               doctorName.includes(query) ||
               motivo.includes(query);
      });
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    setFilteredAppointments(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleStatusChange = (appointment, newStatus) => {
    const statusLabels = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      realizada: 'Realizada',
      cancelada: 'Cancelada'
    };

    Alert.alert(
      'Cambiar Estado',
      `¿Cambiar el estado de la cita a "${statusLabels[newStatus]}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => updateAppointmentStatus(appointment.id, newStatus)
        }
      ]
    );
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      // Use the general appointment update endpoint instead of the doctor-specific one
      await apiService.updateAppointment(appointmentId, { estado: newStatus });
      Alert.alert('Éxito', 'Estado de la cita actualizado correctamente');
      loadAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error updating appointment status:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado de la cita');
    }
  };

  const handleDeleteAppointment = (appointment) => {
    Alert.alert(
      'Eliminar Cita',
      `¿Estás seguro de que quieres eliminar la cita de ${appointment.paciente?.user?.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteAppointment(appointment.id)
        }
      ]
    );
  };

  const deleteAppointment = async (appointmentId) => {
    try {
      await apiService.deleteAppointment(appointmentId);
      Alert.alert('Éxito', 'Cita eliminada correctamente');
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      Alert.alert('Error', 'No se pudo eliminar la cita');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente': return '#FF9500';
      case 'confirmada': return '#007AFF';
      case 'realizada': return '#34C759';
      case 'cancelada': return '#FF3B30';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'confirmada': return 'Confirmada';
      case 'realizada': return 'Realizada';
      case 'cancelada': return 'Cancelada';
      default: return status;
    }
  };

  const renderAppointmentItem = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <Text style={styles.patientName}>{item.paciente?.user?.name || 'Paciente desconocido'}</Text>
          <Text style={styles.doctorName}>Dr. {item.medico?.user?.name || 'Médico desconocido'}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.estado) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.estado)}</Text>
        </View>
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(item.fecha).toLocaleDateString()} - {new Date(item.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>

        {item.motivo && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.motivo}</Text>
          </View>
        )}

        {item.notas && (
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.notas}</Text>
          </View>
        )}
      </View>

      <View style={styles.appointmentActions}>
        {item.estado === 'pendiente' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={() => handleStatusChange(item, 'confirmada')}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Confirmar</Text>
          </TouchableOpacity>
        )}

        {item.estado === 'confirmada' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => handleStatusChange(item, 'realizada')}
          >
            <Ionicons name="checkmark-done" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Completar</Text>
          </TouchableOpacity>
        )}

        {item.estado !== 'cancelada' && item.estado !== 'realizada' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleStatusChange(item, 'cancelada')}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteAppointment(item)}
        >
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {statusFilter !== 'all' || searchQuery ? 'No se encontraron citas' : 'No hay citas registradas'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {statusFilter !== 'all' || searchQuery ? 'Intenta con otros filtros' : 'Las citas aparecerán aquí cuando sean agendadas'}
      </Text>
    </View>
  );

  const renderStatusFilter = () => (
    <View style={styles.filterContainer}>
      {[
        { key: 'all', label: 'Todas' },
        { key: 'pendiente', label: 'Pendientes' },
        { key: 'confirmada', label: 'Confirmadas' },
        { key: 'realizada', label: 'Realizadas' },
        { key: 'cancelada', label: 'Canceladas' },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            statusFilter === filter.key && styles.filterButtonActive
          ]}
          onPress={() => setStatusFilter(filter.key)}
        >
          <Text style={[
            styles.filterButtonText,
            statusFilter === filter.key && styles.filterButtonTextActive
          ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando citas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Citas</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por paciente, médico o motivo..."
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

      {/* Status Filters */}
      {renderStatusFilter()}

      {/* Appointments List */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentItem}
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
          Total: {filteredAppointments.length} cita{filteredAppointments.length !== 1 ? 's' : ''}
          {statusFilter !== 'all' ? ` (${statusFilter})` : ''}
          {searchQuery ? ' (filtradas)' : ''}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  appointmentDetails: {
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
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  completeButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF9500',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
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

export default AdminAppointments;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminAudits = ({ navigation }) => {
  const { user } = useAuth();
  const [audits, setAudits] = useState([]);
  const [filteredAudits, setFilteredAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAudits();
  }, []);

  useEffect(() => {
    filterAudits();
  }, [audits, searchQuery]);

  // Reload audits when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadAudits();
    }, [])
  );

  const loadAudits = async () => {
    try {
      const auditsData = await apiService.getAudits();
      // Sort by date descending (most recent first)
      const sortedAudits = auditsData.sort((a, b) => new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at));
      setAudits(sortedAudits);
    } catch (error) {
      console.error('Error loading audits:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros de auditoría');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAudits = () => {
    if (!searchQuery.trim()) {
      setFilteredAudits(audits);
      return;
    }

    const filtered = audits.filter(audit => {
      const userName = `${audit.user?.name || ''}`.toLowerCase();
      const action = `${audit.accion || ''}`.toLowerCase();
      const description = `${audit.descripcion || ''}`.toLowerCase();

      const query = searchQuery.toLowerCase();

      return userName.includes(query) || action.includes(query) || description.includes(query);
    });

    setFilteredAudits(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAudits();
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'CREATE_USER':
      case 'CREATE_DOCTOR':
      case 'CREATE_PATIENT':
        return '#34C759';
      case 'UPDATE':
      case 'UPDATE_USER':
      case 'UPDATE_DOCTOR':
      case 'UPDATE_PATIENT':
        return '#007AFF';
      case 'DELETE':
      case 'DELETE_USER':
      case 'DELETE_DOCTOR':
      case 'DELETE_PATIENT':
        return '#FF3B30';
      case 'LOGIN':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const getActionIcon = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
      case 'CREATE_USER':
      case 'CREATE_DOCTOR':
      case 'CREATE_PATIENT':
        return 'add-circle-outline';
      case 'UPDATE':
      case 'UPDATE_USER':
      case 'UPDATE_DOCTOR':
      case 'UPDATE_PATIENT':
        return 'pencil-outline';
      case 'DELETE':
      case 'DELETE_USER':
      case 'DELETE_DOCTOR':
      case 'DELETE_PATIENT':
        return 'trash-outline';
      case 'LOGIN':
        return 'log-in-outline';
      default:
        return 'document-outline';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha desconocida';

    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const renderAuditItem = ({ item }) => (
    <View style={styles.auditCard}>
      <View style={styles.auditHeader}>
        <View style={[styles.actionIcon, { backgroundColor: getActionColor(item.accion) }]}>
          <Ionicons name={getActionIcon(item.accion)} size={20} color="#FFF" />
        </View>
        <View style={styles.auditInfo}>
          <Text style={styles.auditAction}>{item.accion || 'ACCIÓN DESCONOCIDA'}</Text>
          <Text style={styles.auditUser}>{item.user?.name || 'Usuario desconocido'}</Text>
        </View>
        <Text style={styles.auditDate}>{formatDate(item.fecha || item.created_at)}</Text>
      </View>

      <View style={styles.auditContent}>
        <Text style={styles.auditDescription}>{item.descripcion || 'Sin descripción'}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No se encontraron registros' : 'No hay registros de auditoría'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los registros de auditoría aparecerán aquí cuando se realicen acciones en el sistema'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando registros de auditoría...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Registros de Auditoría</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por usuario, acción o descripción..."
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

      {/* Audits List */}
      <FlatList
        data={filteredAudits}
        renderItem={renderAuditItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={{
          refreshing: refreshing,
          onRefresh: handleRefresh,
          colors: ['#007AFF']
        }}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={<View style={styles.listFooter} />}
      />

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <Text style={styles.statsText}>
          Total: {filteredAudits.length} registro{filteredAudits.length !== 1 ? 's' : ''}
          {searchQuery ? ` (filtrado de ${audits.length})` : ''}
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
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
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
  auditCard: {
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
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  auditInfo: {
    flex: 1,
  },
  auditAction: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  auditUser: {
    fontSize: 14,
    color: '#666',
  },
  auditDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  auditContent: {
    padding: 16,
  },
  auditDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
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
    height: 80,
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
    paddingBottom: 20,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default AdminAudits;
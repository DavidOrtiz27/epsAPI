import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminUsers = ({ navigation }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  // Reload users when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user => {
      const name = `${user.name || ''}`.toLowerCase();
      const email = `${user.email || ''}`.toLowerCase();
      const roles = user.roles?.map(role => role.name).join(' ') || '';

      const query = searchQuery.toLowerCase();

      return name.includes(query) || email.includes(query) || roles.includes(query);
    });

    setFilteredUsers(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleDeleteUser = (userToDelete) => {
    // Prevent deleting the current superadmin user
    if (userToDelete.id === user.id) {
      Alert.alert('Error', 'No puedes eliminar tu propia cuenta');
      return;
    }

    Alert.alert(
      'Eliminar Usuario',
      `¿Estás seguro de que quieres eliminar al usuario "${userToDelete.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteUser(userToDelete.id)
        }
      ]
    );
  };

  const deleteUser = async (userId) => {
    try {
      await apiService.deleteUser(userId);
      Alert.alert('Éxito', 'Usuario eliminado correctamente');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'No se pudo eliminar el usuario');
    }
  };

  const openRoleModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setRoleModalVisible(true);
  };

  const updateUserRoles = async (newRoles) => {
    try {
      await apiService.updateUserRoles(selectedUser.id, { roles: newRoles });
      Alert.alert('Éxito', 'Roles actualizados correctamente');
      setRoleModalVisible(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating user roles:', error);
      Alert.alert('Error', 'No se pudieron actualizar los roles');
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName) {
      case 'superadmin': return '#FF3B30';
      case 'admin': return '#FF9500';
      case 'doctor': return '#34C759';
      case 'paciente': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getRoleDisplayName = (roleName) => {
    switch (roleName) {
      case 'superadmin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'doctor': return 'Doctor';
      case 'paciente': return 'Paciente';
      default: return roleName;
    }
  };

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <View style={styles.userBasicInfo}>
            <Text style={styles.userName}>{item.name || 'Sin nombre'}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={styles.userActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openRoleModal(item)}
            >
              <Ionicons name="settings-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteUser(item)}
              disabled={item.id === user.id}
            >
              <Ionicons name="trash" size={20} color={item.id === user.id ? "#CCC" : "#FF3B30"} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.rolesContainer}>
            <Text style={styles.rolesLabel}>Roles:</Text>
            <View style={styles.rolesList}>
              {item.roles && item.roles.length > 0 ? (
                item.roles.map((role, index) => (
                  <View key={index} style={[styles.roleBadge, { backgroundColor: getRoleColor(role.name) }]}>
                    <Text style={styles.roleText}>{getRoleDisplayName(role.name)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noRolesText}>Sin roles asignados</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery ? 'Intenta con otros términos de búsqueda' : 'Los usuarios aparecerán aquí cuando sean registrados'}
      </Text>
    </View>
  );

  const renderRoleModal = () => {
    const availableRoles = ['superadmin', 'admin', 'doctor', 'paciente'];
    const currentRoles = selectedUser?.roles?.map(role => role.name) || [];

    return (
      <Modal
        visible={roleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gestionar Roles</Text>
              <TouchableOpacity
                onPress={() => setRoleModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Usuario: {selectedUser?.name}
            </Text>

            <View style={styles.rolesGrid}>
              {availableRoles.map((roleName) => {
                const isSelected = currentRoles.includes(roleName);
                return (
                  <TouchableOpacity
                    key={roleName}
                    style={[
                      styles.roleOption,
                      { borderColor: getRoleColor(roleName) },
                      isSelected && { backgroundColor: getRoleColor(roleName) }
                    ]}
                    onPress={() => {
                      let newRoles;
                      if (isSelected) {
                        newRoles = currentRoles.filter(r => r !== roleName);
                      } else {
                        newRoles = [...currentRoles, roleName];
                      }
                      updateUserRoles(newRoles);
                    }}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      isSelected && styles.roleOptionTextSelected
                    ]}>
                      {getRoleDisplayName(roleName)}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.saveRolesButton}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.saveRolesButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando usuarios...</Text>
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
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o rol..."
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

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
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
          Total: {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
          {searchQuery ? ` (filtrado de ${users.length})` : ''}
        </Text>
      </View>

      {renderRoleModal()}
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
  userCard: {
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
  userInfo: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userBasicInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userActions: {
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
  userDetails: {
    marginBottom: 12,
  },
  rolesContainer: {
    marginBottom: 8,
  },
  rolesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  rolesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  noRolesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  rolesGrid: {
    padding: 20,
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  roleOptionTextSelected: {
    color: '#FFF',
  },
  saveRolesButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveRolesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AdminUsers;
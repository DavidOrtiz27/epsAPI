import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';

const AdminProfile = () => {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityFormData, setSecurityFormData] = useState({
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    newPassword_confirmation: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Simulate loading admin data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const updateSecurityFormData = (field, value) => {
    setSecurityFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleUpdateEmail = async () => {
    if (!securityFormData.newEmail || !securityFormData.currentPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      await apiService.updateEmail({
        email: securityFormData.newEmail,
        password: securityFormData.currentPassword,
      });

      // Update user context with new email
      const updatedUser = { ...user, email: securityFormData.newEmail };
      updateUser(updatedUser);

      setSecurityFormData(prev => ({ ...prev, newEmail: '', currentPassword: '' }));
      setShowSecurityModal(false);
      Alert.alert('Éxito', 'Email actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el email');
    }
  };

  const handleUpdatePassword = async () => {
    if (!securityFormData.currentPassword || !securityFormData.newPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (securityFormData.newPassword !== securityFormData.newPassword_confirmation) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    try {
      await apiService.updatePassword({
        current_password: securityFormData.currentPassword,
        password: securityFormData.newPassword,
        password_confirmation: securityFormData.newPassword_confirmation,
      });

      setSecurityFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        newPassword_confirmation: ''
      }));
      setShowSecurityModal(false);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la contraseña');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="person" size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Mi Perfil</Text>
            <Text style={styles.subtitle}>Información administrativa</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('HelpCenter')} style={styles.helpButton}>
              <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSecurityModal(true)} style={styles.securityButton}>
              <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color="#007AFF" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.adminName}>{user?.name || 'Administrador'}</Text>
              <Text style={styles.adminEmail}>{user?.email}</Text>
              <Text style={styles.adminRole}>Administrador</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.profileItem}>
              <View style={styles.profileItemLeft}>
                <Ionicons name="mail-outline" size={20} color="#666" />
                <Text style={styles.profileItemLabel}>Email</Text>
              </View>
              <Text style={styles.profileItemValue}>
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Información de Cuenta</Text>

          <View style={styles.accountCard}>
            <View style={styles.accountItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
              <Text style={styles.accountItemText}>Cuenta verificada</Text>
            </View>
            <View style={styles.accountItem}>
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.accountItemText}>
                Miembro desde {user?.created_at ? new Date(user.created_at).getFullYear() : '2024'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Security Settings Modal */}
      <Modal
        visible={showSecurityModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSecurityModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configuración de Seguridad</Text>
            <TouchableOpacity onPress={() => setShowSecurityModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              {/* Change Email Section */}
              <View style={styles.securitySection}>
                <Text style={styles.sectionTitle}>Cambiar Email</Text>
                <CustomInput
                  label="Nuevo Email"
                  value={securityFormData.newEmail}
                  onChangeText={(value) => updateSecurityFormData('newEmail', value)}
                  placeholder="Ingresa tu nuevo email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon={<Ionicons name="mail-outline" size={20} color="#666" />}
                />
                <CustomInput
                  label="Contraseña Actual"
                  value={securityFormData.currentPassword}
                  onChangeText={(value) => updateSecurityFormData('currentPassword', value)}
                  placeholder="Ingresa tu contraseña actual"
                  secureTextEntry
                  icon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
                />
                <CustomButton
                  title="Actualizar Email"
                  onPress={handleUpdateEmail}
                  style={styles.securityButton}
                />
              </View>

              {/* Change Password Section */}
              <View style={styles.securitySection}>
                <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
                <CustomInput
                  label="Contraseña Actual"
                  value={securityFormData.currentPassword}
                  onChangeText={(value) => updateSecurityFormData('currentPassword', value)}
                  placeholder="Ingresa tu contraseña actual"
                  secureTextEntry
                  icon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
                />
                <CustomInput
                  label="Nueva Contraseña"
                  value={securityFormData.newPassword}
                  onChangeText={(value) => updateSecurityFormData('newPassword', value)}
                  placeholder="Ingresa tu nueva contraseña"
                  secureTextEntry
                  icon={<Ionicons name="lock-open-outline" size={20} color="#666" />}
                />
                <CustomInput
                  label="Confirmar Nueva Contraseña"
                  value={securityFormData.newPassword_confirmation}
                  onChangeText={(value) => updateSecurityFormData('newPassword_confirmation', value)}
                  placeholder="Confirma tu nueva contraseña"
                  secureTextEntry
                  icon={<Ionicons name="lock-open-outline" size={20} color="#666" />}
                />
                <CustomButton
                  title="Actualizar Contraseña"
                  onPress={handleUpdatePassword}
                  style={styles.securityButton}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpButton: {
    padding: 8,
    marginRight: 8,
  },
  securityButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#fff',
    margin: 24,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  adminEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  adminRole: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  profileDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  profileItemValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  accountSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
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
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  accountItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 24,
  },
  securitySection: {
    marginBottom: 32,
  },
  securityButton: {
    marginTop: 16,
    marginBottom: 24,
  },
});

export default AdminProfile;
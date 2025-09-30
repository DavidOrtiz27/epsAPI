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
import CustomButton from '../../components/ui/CustomButton';
import CustomInput from '../../components/ui/CustomInput';

const DoctorProfile = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    registro_profesional: '',
    especialidad: '',
    telefono: '',
  });
  const [securityFormData, setSecurityFormData] = useState({
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    newPassword_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState({
    patients: 0,
    todayAppointments: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    loadDoctorData();
  }, []);

  const loadDoctorData = async () => {
    try {
      // Load doctor data from dedicated profile endpoint
      const doctorInfo = await apiService.request('/medicos/profile');
      setDoctorData(doctorInfo);

      // Initialize form data with current values
      setFormData({
        registro_profesional: doctorInfo.registro_profesional || '',
        especialidad: doctorInfo.especialidad || '',
        telefono: doctorInfo.telefono || '',
      });

      // Load statistics
      await loadStatistics();
    } catch (error) {
      console.error('Error loading doctor data:', error);
      // If doctor data fails to load, show empty data but don't block the profile
      setDoctorData({});
      setFormData({
        registro_profesional: '',
        especialidad: '',
        telefono: '',
      });
      Alert.alert('Aviso', 'No se pudieron cargar los datos profesionales. Puedes editarlos manualmente.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      // Load appointments to calculate statistics
      const appointments = await apiService.getDoctorAppointments();

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate statistics
      const patients = new Set(appointments.map(apt => apt.paciente_id)).size;
      const todayAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.fecha);
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      }).length;
      const thisWeekAppointments = appointments.filter(apt => new Date(apt.fecha) >= weekStart).length;
      const thisMonthAppointments = appointments.filter(apt => new Date(apt.fecha) >= monthStart).length;

      setStats({
        patients,
        todayAppointments,
        thisWeek: thisWeekAppointments,
        thisMonth: thisMonthAppointments,
      });
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Don't show error for statistics, just use defaults
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.registro_profesional && !/^[A-Za-z0-9\-]+$/.test(formData.registro_profesional)) {
      newErrors.registro_profesional = 'Formato de registro inválido';
    }

    if (formData.telefono && !/^[\d\s\-\+\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const updateData = { ...formData };

      // Remove empty fields
      Object.keys(updateData).forEach(key => {
        if (!updateData[key] || updateData[key] === '') {
          delete updateData[key];
        }
      });

      console.log('Sending update data:', updateData);

      // Update doctor profile via API
      await apiService.request('/medicos/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });

      // Reload doctor data to get updated information
      await loadDoctorData();
      setShowEditModal(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Verifica los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values
    if (doctorData) {
      setFormData({
        registro_profesional: doctorData.registro_profesional || '',
        especialidad: doctorData.especialidad || '',
        telefono: doctorData.telefono || '',
      });
    }
    setErrors({});
    setShowEditModal(false);
  };

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

  const ProfileItem = ({ icon, label, value }) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon} size={20} color="#666" />
        <Text style={styles.profileItemLabel}>{label}</Text>
      </View>
      <Text style={styles.profileItemValue}>
        {value || 'No especificado'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Mi Perfil</Text>
            <Text style={styles.subtitle}>Información profesional</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editButton}>
              <Ionicons name="pencil" size={20} color="#007AFF" />
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
              <Text style={styles.doctorName}>Dr. {user?.name || 'Médico'}</Text>
              <Text style={styles.doctorRole}>Médico</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <ProfileItem
              icon="mail-outline"
              label="Email"
              value={user?.email}
            />
            <ProfileItem
              icon="card-outline"
              label="Registro Profesional"
              value={doctorData?.registro_profesional}
            />
            <ProfileItem
              icon="school-outline"
              label="Especialidad"
              value={doctorData?.especialidad}
            />
            <ProfileItem
              icon="call-outline"
              label="Teléfono"
              value={doctorData?.telefono}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.patients}</Text>
              <Text style={styles.statLabel}>Pacientes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
              <Text style={styles.statLabel}>Citas Hoy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.thisWeek}</Text>
              <Text style={styles.statLabel}>Esta Semana</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.thisMonth}</Text>
              <Text style={styles.statLabel}>Este Mes</Text>
            </View>
          </View>
        </View>

        {/* Professional Info & Actions */}
        <View style={styles.actionsSection}>
          
          

           <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Acciones</Text>

           <View style={styles.actionsGrid}>
             <TouchableOpacity
               style={styles.actionCard}
               onPress={() => navigation.navigate('DoctorReports')}
             >
               <Ionicons name="document-text-outline" size={24} color="#007AFF" />
               <Text style={styles.actionCardText}>Reportes</Text>
             </TouchableOpacity>

             <TouchableOpacity
               style={styles.actionCard}
               onPress={() => navigation.navigate('DoctorHelp')}
             >
               <Ionicons name="help-circle-outline" size={24} color="#007AFF" />
               <Text style={styles.actionCardText}>Ayuda</Text>
             </TouchableOpacity>
           </View>

          <Text style={styles.sectionTitle}>Información Profesional</Text>

          <View style={styles.accountCard}>
            <View style={styles.accountItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
              <Text style={styles.accountItemText}>Médico verificado</Text>
            </View>
            <View style={styles.accountItem}>
              <Ionicons name="school-outline" size={20} color="#007AFF" />
              <Text style={styles.accountItemText}>
                Especialidad: {doctorData?.especialidad || 'No especificada'}
              </Text>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.modalContent}>
              <CustomInput
                label="Registro Profesional"
                value={formData.registro_profesional}
                onChangeText={(value) => updateFormData('registro_profesional', value)}
                placeholder="Ingresa tu registro profesional"
                error={errors.registro_profesional}
                icon={<Ionicons name="card-outline" size={20} color="#666" />}
              />

              <CustomInput
                label="Especialidad"
                value={formData.especialidad}
                onChangeText={(value) => updateFormData('especialidad', value)}
                placeholder="Ingresa tu especialidad"
                autoCapitalize="words"
                error={errors.especialidad}
                icon={<Ionicons name="school-outline" size={20} color="#666" />}
              />

              <CustomInput
                label="Teléfono"
                value={formData.telefono}
                onChangeText={(value) => updateFormData('telefono', value)}
                placeholder="Ingresa tu teléfono"
                keyboardType="phone-pad"
                error={errors.telefono}
                icon={<Ionicons name="call-outline" size={20} color="#666" />}
              />

              <View style={styles.modalActions}>
                <CustomButton
                  title="Cancelar"
                  onPress={handleCancel}
                  variant="secondary"
                  style={styles.modalButton}
                  disabled={saving}
                />
                <CustomButton
                  title={saving ? "Guardando..." : "Guardar"}
                  onPress={handleSave}
                  style={styles.modalButton}
                  disabled={saving}
                  loading={saving}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

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
  editButton: {
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
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorRole: {
    fontSize: 14,
    color: '#666',
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
  statsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    bottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
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
  actionsGrid: {
    bottom: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionCardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 32,
  },
  modalButton: {
    flex: 1,
  },
  securityButton: {
    padding: 8,
    marginRight: 8,
  },
  securitySection: {
    marginBottom: 32,
  },
  });

export default DoctorProfile;
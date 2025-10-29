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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import notificationService from '../../services/NotificationService';
import { CustomInput, CustomButton, CustomDatePicker, CustomGenderPicker } from '../../components/ui';

const PatientProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    documento: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    genero: '',
  });
  const [securityFormData, setSecurityFormData] = useState({
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    newPassword_confirmation: '',
  });
  const [errors, setErrors] = useState({});

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      // If it's already in YYYY-MM-DD format, try to parse and format it
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('es-ES');
      }
      // Otherwise, try to parse as Date object
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return as-is if can't parse
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return dateString; // Return as-is if error
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await apiService.getPatientProfile();
      setProfile(profileData);
      // Initialize form data with all editable fields
      setFormData({
        documento: profileData?.documento || '',
        telefono: profileData?.telefono || '',
        direccion: profileData?.direccion || '',
        fecha_nacimiento: profileData?.fecha_nacimiento ? profileData.fecha_nacimiento.split('T')[0] : '',
        genero: profileData?.genero || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil. Intente nuevamente.');
    } finally {
      setLoading(false);
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

    // Validate documento
    if (formData.documento && !/^[A-Za-z0-9\-]+$/.test(formData.documento)) {
      newErrors.documento = 'Formato de documento inválido';
    }

    // Validate telefono
    if (formData.telefono && !/^[\d\s\-\+\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Formato de teléfono inválido';
    }

    // Validate fecha_nacimiento
    if (formData.fecha_nacimiento) {
      const date = new Date(formData.fecha_nacimiento);
      if (isNaN(date.getTime())) {
        newErrors.fecha_nacimiento = 'Fecha inválida';
      } else {
        const today = new Date();
        const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        if (date > today) {
          newErrors.fecha_nacimiento = 'La fecha no puede ser futura';
        } else if (date > minAge) {
          newErrors.fecha_nacimiento = 'Debes tener al menos 18 años';
        }
      }
    }

    // Validate genero
    if (formData.genero && !['M', 'F', 'O'].includes(formData.genero)) {
      newErrors.genero = 'Género inválido';
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

      console.log('Sending update data:', updateData); // Debug log

      await apiService.updatePatientProfile(updateData);
      
      // Send notification for profile update
      try {
        await notificationService.showUserAction(
          'update',
          user?.name || 'Tu perfil',
          'Perfil actualizado correctamente'
        );
      } catch (notificationError) {
        console.log('⚠️ Could not send profile update notification:', notificationError);
      }
      
      await loadProfile(); // Reload profile data
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
    if (profile) {
      setFormData({
        documento: profile.documento || '',
        telefono: profile.telefono || '',
        direccion: profile.direccion || '',
        fecha_nacimiento: profile.fecha_nacimiento ? profile.fecha_nacimiento.split('T')[0] : '',
        genero: profile.genero || '',
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

      // Send notification for email update
      try {
        await notificationService.showUserAction(
          'update',
          user?.name || 'Tu cuenta',
          'Email actualizado correctamente'
        );
      } catch (notificationError) {
        console.log('⚠️ Could not send email update notification:', notificationError);
      }

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

      // Send notification for password update
      try {
        await notificationService.showUserAction(
          'update',
          user?.name || 'Tu cuenta',
          'Contraseña actualizada correctamente'
        );
      } catch (notificationError) {
        console.log('⚠️ Could not send password update notification:', notificationError);
      }

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
            <Text style={styles.subtitle}>Información personal</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('HelpCenter')} style={styles.helpButton}>
              <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
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
              <Text style={styles.patientName}>{user?.name || 'Paciente'}</Text>
              <Text style={styles.patientEmail}>{user?.email}</Text>
              <Text style={styles.patientRole}>Paciente</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <ProfileItem
              icon="card-outline"
              label="Documento"
              value={profile?.documento}
            />
            <ProfileItem
              icon="call-outline"
              label="Teléfono"
              value={profile?.telefono}
            />
            <ProfileItem
              icon="location-outline"
              label="Dirección"
              value={profile?.direccion}
            />
            <ProfileItem
              icon="calendar-outline"
              label="Fecha de nacimiento"
              value={profile?.fecha_nacimiento ? formatDate(profile.fecha_nacimiento) : null}
            />
            <ProfileItem
              icon="male-female-outline"
              label="Género"
              value={profile?.genero === 'M' ? 'Masculino' : profile?.genero === 'F' ? 'Femenino' : profile?.genero === 'O' ? 'Otro' : null}
            />
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
               label="Documento"
               value={formData.documento}
               onChangeText={(value) => updateFormData('documento', value)}
               placeholder="Ingresa tu documento"
               error={errors.documento}
               icon={<Ionicons name="card-outline" size={20} color="#666" />}
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

             <CustomInput
               label="Dirección"
               value={formData.direccion}
               onChangeText={(value) => updateFormData('direccion', value)}
               placeholder="Ingresa tu dirección"
               autoCapitalize="words"
               error={errors.direccion}
               icon={<Ionicons name="location-outline" size={20} color="#666" />}
             />

             <CustomDatePicker
               label="Fecha de Nacimiento"
               value={formData.fecha_nacimiento}
               onDateChange={(date) => updateFormData('fecha_nacimiento', date)}
               placeholder="Seleccionar fecha de nacimiento"
               error={errors.fecha_nacimiento}
               maximumDate={new Date()}
               minimumDate={new Date(new Date().getFullYear() - 120, 0, 1)}
             />

             <CustomGenderPicker
               label="Género"
               value={formData.genero}
               onGenderChange={(gender) => updateFormData('genero', gender)}
               placeholder="Seleccionar género"
               error={errors.genero}
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

     {/* Date Picker */}


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
  editButton: {
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
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  patientEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  patientRole: {
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 32,
  },
  modalButton: {
    flex: 1,
  },
  // Date input styles
  dateInputContainer: {
    marginBottom: 16,
  },
  dateInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  dateInputError: {
    borderColor: '#ff3b30',
  },
  dateInputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dateInputPlaceholder: {
    color: '#999',
  },
  securityButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  securitySection: {
    marginBottom: 32,
  },
  // Medical Services styles
  medicalSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  medicalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  medicalActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicalActionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  medicalActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  medicalActionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  });

export default PatientProfile;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';

const PatientProfile = () => {
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    telefono: '',
    direccion: '',
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
      // Initialize form data with only editable fields
      setFormData({
        telefono: profileData?.telefono || '',
        direccion: profileData?.direccion || '',
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

    // Only validate editable fields
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

      console.log('Sending update data:', updateData); // Debug log

      await apiService.updatePatientProfile(updateData);
      await loadProfile(); // Reload profile data
      setEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil. Verifica los datos e intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original values (only editable fields)
    if (profile) {
      setFormData({
        telefono: profile.telefono || '',
        direccion: profile.direccion || '',
      });
    }
    setErrors({});
    setEditing(false);
  };

  const ProfileItem = ({ icon, label, value, editable = false, field }) => (
    <View style={styles.profileItem}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon} size={20} color="#666" />
        <Text style={styles.profileItemLabel}>{label}</Text>
      </View>
      {editing && editable ? (
        <View style={styles.editContainer}>
          <TextInput
            style={[styles.editInput, errors[field] && styles.editInputError]}
            value={formData[field]}
            onChangeText={(value) => updateFormData(field, value)}
            placeholder={`Ingresa ${label.toLowerCase()}`}
            keyboardType={field === 'telefono' ? 'phone-pad' : 'default'}
            autoCapitalize={field === 'direccion' ? 'words' : 'none'}
          />
          {errors[field] && (
            <Text style={styles.errorText}>{errors[field]}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.profileItemValue}>
          {value || 'No especificado'}
        </Text>
      )}
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
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
                <Ionicons name="pencil" size={20} color="#007AFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton} disabled={saving}>
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
                  {saving ? (
                    <Ionicons name="hourglass" size={20} color="#34C759" />
                  ) : (
                    <Ionicons name="checkmark" size={20} color="#34C759" />
                  )}
                </TouchableOpacity>
              </View>
            )}
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
              editable={true}
              field="telefono"
            />
            <ProfileItem
              icon="location-outline"
              label="Dirección"
              value={profile?.direccion}
              editable={true}
              field="direccion"
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
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
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
  editContainer: {
    flex: 1,
    marginLeft: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  editInputError: {
    borderColor: '#ff3b30',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    marginBottom: 8,
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
});

export default PatientProfile;
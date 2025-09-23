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
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomButton from '../../components/ui/CustomButton';

const DoctorProfile = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    registro_profesional: '',
    especialidad: '',
    telefono: '',
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
    // Reset form data to original values
    if (doctorData) {
      setFormData({
        registro_profesional: doctorData.registro_profesional || '',
        especialidad: doctorData.especialidad || '',
        telefono: doctorData.telefono || '',
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
            autoCapitalize={field === 'especialidad' ? 'words' : 'none'}
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
              editable={true}
              field="registro_profesional"
            />
            <ProfileItem
              icon="school-outline"
              label="Especialidad"
              value={doctorData?.especialidad}
              editable={true}
              field="especialidad"
            />
            <ProfileItem
              icon="call-outline"
              label="Teléfono"
              value={doctorData?.telefono}
              editable={true}
              field="telefono"
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
 });

export default DoctorProfile;
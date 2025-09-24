import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminDoctorForm = ({ navigation, route }) => {
  const { user } = useAuth();
  const { doctorId } = route.params || {};
  const isEditing = !!doctorId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    // User information
    name: '',
    email: '',
    password: '',
    password_confirmation: '',

    // Doctor information
    especialidad: '',
    selectedSpecialty: null,
    registro_profesional: '',
    telefono: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadInitialData();
    if (isEditing) {
      loadDoctor();
    }
  }, [doctorId]);

  const loadInitialData = async () => {
    try {
      // Load specialties
      const specialtiesData = await apiService.getSpecialties();
      setSpecialties(specialtiesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadDoctor = async () => {
    try {
      const doctor = await apiService.getDoctor(doctorId);
      setFormData({
        // User information (read-only when editing)
        name: doctor.user?.name || '',
        email: doctor.user?.email || '',

        // Doctor information
        especialidad: doctor.especialidad || '',
        selectedSpecialty: null, // We'll set this from the specialties list
        registro_profesional: doctor.registro_profesional || '',
        telefono: doctor.telefono || '',

        // Password fields (empty for editing)
        password: '',
        password_confirmation: '',
      });
    } catch (error) {
      console.error('Error loading doctor:', error);
      Alert.alert('Error', 'No se pudo cargar la información del doctor');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // User information validation (only for creating new doctors)
    if (!isEditing) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'El email es requerido';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'El email no es válido';
      }

      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      }

      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Las contraseñas no coinciden';
      }
    }

    // Doctor information validation
    if (!formData.especialidad.trim()) {
      newErrors.especialidad = 'La especialidad es requerida';
    }

    if (!formData.registro_profesional.trim()) {
      newErrors.registro_profesional = 'El registro profesional es requerido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        // For editing, only update doctor information
        const dataToSend = {
          especialidad: formData.especialidad,
          registro_profesional: formData.registro_profesional,
          telefono: formData.telefono,
        };

        await apiService.updateDoctor(doctorId, dataToSend);
        Alert.alert(
          'Éxito',
          'Doctor actualizado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // For creating, create both user and doctor
        const dataToSend = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          especialidad: formData.especialidad,
          registro_profesional: formData.registro_profesional,
          telefono: formData.telefono,
        };

        await apiService.createDoctorWithUser(dataToSend);
        Alert.alert(
          'Éxito',
          'Doctor registrado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error saving doctor:', error);
      const errorMessage = error.message || 'No se pudo guardar el doctor';

      if (error.status === 422 && error.errors) {
        setErrors(error.errors);
        Alert.alert('Error de validación', 'Por favor corrige los errores marcados');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const selectSpecialty = (specialty) => {
    setFormData(prev => ({
      ...prev,
      especialidad: specialty.nombre,
      selectedSpecialty: specialty
    }));
    setSpecialtyModalVisible(false);
    if (errors.especialidad) {
      setErrors(prev => ({ ...prev, especialidad: undefined }));
    }
  };

  const renderInput = (field, label, placeholder, keyboardType = 'default', multiline = false, secureTextEntry = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errors[field] && styles.inputError
        ]}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => updateFormData(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={!saving}
        secureTextEntry={secureTextEntry}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderSelector = (field, label, placeholder, value, onPress, displayValue) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selector, errors[field] && styles.selectorError]}
        onPress={onPress}
        disabled={saving}
      >
        <Text style={[styles.selectorText, !value && styles.selectorPlaceholder]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando información...</Text>
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
          disabled={saving}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Doctor' : 'Registrar Nuevo Doctor'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Information Section (only for creating new doctors) */}
        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Usuario</Text>

            {renderInput('name', 'Nombre Completo', 'Ej: Dr. Juan Pérez García')}

            {renderInput('email', 'Correo Electrónico', 'Ej: juan.perez@hospital.com', 'email-address')}

            {renderInput('password', 'Contraseña', 'Mínimo 8 caracteres', 'default', false, true)}

            {renderInput('password_confirmation', 'Confirmar Contraseña', 'Repite la contraseña', 'default', false, true)}
          </View>
        )}

        {/* Doctor Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Profesional</Text>

          {/* Specialty Selection */}
          {renderSelector(
            'especialidad',
            'Especialidad Médica',
            'Seleccionar especialidad...',
            formData.selectedSpecialty,
            () => setSpecialtyModalVisible(true),
            formData.selectedSpecialty ? formData.selectedSpecialty.nombre : formData.especialidad
          )}

          {renderInput('registro_profesional', 'Registro Profesional', 'Ej: 12345-ABC')}

          {renderInput('telefono', 'Teléfono de Contacto', 'Ej: +57 300 123 4567', 'phone-pad')}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.saveButtonText, saving && styles.saveButtonTextDisabled]}>
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar Doctor' : 'Registrar Doctor')}
          </Text>
        </TouchableOpacity>
      </ScrollView>


      {/* Specialty Selection Modal */}
      <Modal
        visible={specialtyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Especialidad</Text>
              <TouchableOpacity
                onPress={() => setSpecialtyModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={specialties}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => selectSpecialty(item)}
                >
                  <Text style={styles.specialtyName}>{item.nombre}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay especialidades disponibles</Text>
              }
            />
          </View>
        </View>
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  selector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorError: {
    borderColor: '#FF3B30',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#999',
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
  searchInput: {
    margin: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  specialtyName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 32,
  },
});

export default AdminDoctorForm;
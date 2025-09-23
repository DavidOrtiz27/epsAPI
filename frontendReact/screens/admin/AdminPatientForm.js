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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminPatientForm = ({ navigation, route }) => {
  const { user } = useAuth();
  const { patientId } = route.params || {};
  const isEditing = !!patientId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    documento: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    genero: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    try {
      const patient = await apiService.getPatient(patientId);
      setFormData({
        user_id: patient.user_id?.toString() || '',
        documento: patient.documento || '',
        telefono: patient.telefono || '',
        direccion: patient.direccion || '',
        fecha_nacimiento: patient.fecha_nacimiento || '',
        genero: patient.genero || '',
      });
    } catch (error) {
      console.error('Error loading patient:', error);
      Alert.alert('Error', 'No se pudo cargar la información del paciente');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Only validate user_id when creating new patient
    if (!isEditing && !formData.user_id.trim()) {
      newErrors.user_id = 'El ID de usuario es requerido';
    }

    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es requerido';
    } else if (formData.documento.length < 5) {
      newErrors.documento = 'El documento debe tener al menos 5 caracteres';
    }

    if (formData.fecha_nacimiento && !isValidDate(formData.fecha_nacimiento)) {
      newErrors.fecha_nacimiento = 'Fecha de nacimiento inválida (formato: YYYY-MM-DD)';
    }

    if (formData.genero && !['M', 'F', 'O'].includes(formData.genero.toUpperCase())) {
      newErrors.genero = 'Género debe ser M, F u O';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidDate = (dateString) => {
    if (!dateString || !dateString.trim()) return true; // Allow empty dates

    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    if (!(date instanceof Date) || isNaN(date)) return false;

    // Check if date is not in the future and not too old
    const now = new Date();
    const minDate = new Date('1900-01-01');
    return date <= now && date >= minDate;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        user_id: parseInt(formData.user_id),
        genero: formData.genero.toUpperCase(),
      };

      if (isEditing) {
        await apiService.updatePatient(patientId, dataToSend);
        Alert.alert(
          'Éxito',
          'Paciente actualizado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        await apiService.createPatient(dataToSend);
        Alert.alert(
          'Éxito',
          'Paciente creado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error saving patient:', error);
      const errorMessage = error.message || 'No se pudo guardar el paciente';

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
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderInput = (field, label, placeholder, keyboardType = 'default', multiline = false, readOnly = false) => (
    <View style={styles.inputContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {readOnly && <Text style={styles.readOnlyLabel}>(Solo lectura)</Text>}
      </View>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          errors[field] && styles.inputError,
          readOnly && styles.inputReadOnly
        ]}
        placeholder={placeholder}
        value={formData[field]}
        onChangeText={(value) => updateFormData(field, value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        editable={!saving && !readOnly}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const renderGenderSelector = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Género</Text>
      <View style={styles.genderContainer}>
        {[
          { value: 'M', label: 'Masculino' },
          { value: 'F', label: 'Femenino' },
          { value: 'O', label: 'Otro' },
        ].map((option, index) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.genderOption,
              index < 2 && styles.genderOptionWithMargin, // Only add margin to first two options
              formData.genero.toUpperCase() === option.value && styles.genderOptionSelected,
              errors.genero && styles.genderOptionError,
            ]}
            onPress={() => updateFormData('genero', option.value)}
            disabled={saving}
          >
            <Text
              style={[
                styles.genderOptionText,
                formData.genero.toUpperCase() === option.value && styles.genderOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {errors.genero && <Text style={styles.errorText}>{errors.genero}</Text>}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando paciente...</Text>
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
          {isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form Fields */}
        {renderInput('user_id', 'ID de Usuario', 'Ingrese el ID del usuario', 'numeric', false, isEditing)}

        {renderInput('documento', 'Documento', 'Número de documento de identidad')}

        {renderInput('telefono', 'Teléfono', 'Número de teléfono', 'phone-pad')}

        {renderInput('direccion', 'Dirección', 'Dirección completa', 'default', true)}

        {renderInput('fecha_nacimiento', 'Fecha de Nacimiento', 'YYYY-MM-DD (ej: 1990-01-15)', 'default')}

        {renderGenderSelector()}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[styles.saveButtonText, saving && styles.saveButtonTextDisabled]}>
            {saving ? 'Guardando...' : (isEditing ? 'Actualizar Paciente' : 'Crear Paciente')}
          </Text>
        </TouchableOpacity>
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
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  inputReadOnly: {
    backgroundColor: '#f8f9fa',
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  genderOptionWithMargin: {
    marginRight: 12,
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionError: {
    borderColor: '#FF3B30',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#333',
  },
  genderOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
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
});

export default AdminPatientForm;
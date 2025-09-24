import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';

const AdminPatientForm = ({ navigation, route }) => {
  const { user } = useAuth();
  const { patientId } = route.params || {};
  const isEditing = !!patientId;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [formData, setFormData] = useState({
    // User information
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    
    // Patient information
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
      const birthDate = patient.fecha_nacimiento ? new Date(patient.fecha_nacimiento) : new Date();
      
      setFormData({
        // User information (read-only when editing)
        name: patient.user?.name || '',
        email: patient.user?.email || '',
        password: '',
        password_confirmation: '',
        
        // Patient information
        documento: patient.documento || '',
        telefono: patient.telefono || '',
        direccion: patient.direccion || '',
        fecha_nacimiento: patient.fecha_nacimiento || '',
        genero: patient.genero || '',
      });
      
      if (patient.fecha_nacimiento) {
        setSelectedDate(birthDate);
      }
    } catch (error) {
      console.error('Error loading patient:', error);
      Alert.alert('Error', 'No se pudo cargar la información del paciente');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      updateFormData('fecha_nacimiento', formattedDate);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // User information validation (only for creating new patients)
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

    // Patient information validation
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
      if (isEditing) {
        // For editing, only update patient information
        const dataToSend = {
          documento: formData.documento,
          telefono: formData.telefono,
          direccion: formData.direccion,
          fecha_nacimiento: formData.fecha_nacimiento,
          genero: formData.genero.toUpperCase(),
        };

        await apiService.updatePatient(patientId, dataToSend);
        Alert.alert(
          'Éxito',
          'Paciente actualizado correctamente',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // For creating, create both user and patient
        const dataToSend = {
          // User information
          name: formData.name,
          email: formData.email,
          password: formData.password,
          
          // Patient information
          documento: formData.documento,
          telefono: formData.telefono,
          direccion: formData.direccion,
          fecha_nacimiento: formData.fecha_nacimiento,
          genero: formData.genero.toUpperCase(),
        };

        // Use register API to create user and patient together
        await apiService.register(dataToSend);
        Alert.alert(
          'Éxito',
          'Paciente registrado correctamente',
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

  const renderDatePicker = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>Fecha de Nacimiento</Text>
      <TouchableOpacity
        style={[styles.dateSelector, errors.fecha_nacimiento && styles.dateSelectorError]}
        onPress={() => setShowDatePicker(true)}
        disabled={saving}
      >
        <Ionicons name="calendar-outline" size={20} color="#666" style={styles.dateIcon} />
        <Text style={[styles.dateText, !formData.fecha_nacimiento && styles.datePlaceholder]}>
          {formData.fecha_nacimiento ? formatDisplayDate(formData.fecha_nacimiento) : 'Seleccionar fecha de nacimiento'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {errors.fecha_nacimiento && <Text style={styles.errorText}>{errors.fecha_nacimiento}</Text>}
    </View>
  );

  const renderGenderSelector = () => {
    const getGenderDisplayValue = () => {
      const genderMap = { 'M': 'Masculino', 'F': 'Femenino', 'O': 'Otro' };
      return genderMap[formData.genero.toUpperCase()] || '';
    };

    return (
      <CustomInput
        label="Género"
        value={getGenderDisplayValue()}
        placeholder="M (Masculino), F (Femenino), O (Otro)"
        onChangeText={(value) => updateFormData('genero', value.toUpperCase())}
        autoCapitalize="characters"
        error={errors.genero}
        icon={<Ionicons name="male-female-outline" size={20} color="#666" />}
        editable={!saving}
      />
    );
  };

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
        {/* Header */}
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            {isEditing ? 'Editar Información del Paciente' : 'Registrar Nuevo Paciente'}
          </Text>
          <Text style={styles.formSubtitle}>
            Complete los datos del paciente para {isEditing ? 'actualizar' : 'crear'} el registro
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* User Information Section (only for creating new patients) */}
          {!isEditing && (
            <>
              <CustomInput
                label="Nombre completo"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Ingresa el nombre completo"
                error={errors.name}
                icon={<Ionicons name="person-outline" size={20} color="#666" />}
                editable={!saving}
              />

              <CustomInput
                label="Correo electrónico"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                icon={<Ionicons name="mail-outline" size={20} color="#666" />}
                editable={!saving}
              />

              <CustomInput
                label="Contraseña"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                error={errors.password}
                icon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
                editable={!saving}
              />

              <CustomInput
                label="Confirmar contraseña"
                value={formData.password_confirmation}
                onChangeText={(value) => updateFormData('password_confirmation', value)}
                placeholder="Repite la contraseña"
                secureTextEntry
                error={errors.password_confirmation}
                icon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
                editable={!saving}
              />
            </>
          )}

          {/* Patient Information Section */}
          <CustomInput
            label="Número de documento"
            value={formData.documento}
            onChangeText={(value) => updateFormData('documento', value)}
            placeholder="1234567890"
            keyboardType="numeric"
            error={errors.documento}
            icon={<Ionicons name="card-outline" size={20} color="#666" />}
            editable={!saving}
          />

          <CustomInput
            label="Teléfono"
            value={formData.telefono}
            onChangeText={(value) => updateFormData('telefono', value)}
            placeholder="3001234567"
            keyboardType="phone-pad"
            error={errors.telefono}
            icon={<Ionicons name="call-outline" size={20} color="#666" />}
            editable={!saving}
          />

          <CustomInput
            label="Dirección"
            value={formData.direccion}
            onChangeText={(value) => updateFormData('direccion', value)}
            placeholder="Calle 123 #45-67, Ciudad"
            error={errors.direccion}
            icon={<Ionicons name="location-outline" size={20} color="#666" />}
            multiline={true}
            numberOfLines={3}
            editable={!saving}
          />

          {renderDatePicker()}

          {renderGenderSelector()}

          <CustomButton
            title={saving ? 'Guardando...' : (isEditing ? 'Actualizar Paciente' : 'Registrar Paciente')}
            onPress={handleSave}
            loading={saving}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date('1900-01-01')}
        />
      )}
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
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
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateSelectorError: {
    borderColor: '#ff3b30',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#ff3b30',
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    marginTop: 16,
    marginBottom: 24,
  },
});

export default AdminPatientForm;
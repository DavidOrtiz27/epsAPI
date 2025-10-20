import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import { showErrorAlert } from '../../utils/errorHandler';
import { CustomInput, CustomButton, CustomDatePicker, CustomGenderPicker } from '../../components/ui';

const RegisterScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    documento: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    genero: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigation = useNavigation();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else {
      // Validación detallada de contraseña
      const password = formData.password;
      const passwordErrors = [];

      if (password.length < 8) {
        passwordErrors.push('Mínimo 8 caracteres');
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('Al menos una minúscula (a-z)');
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('Al menos una MAYÚSCULA (A-Z)');
      }
      if (!/\d/.test(password)) {
        passwordErrors.push('Al menos un número (0-9)');
      }

      if (passwordErrors.length > 0) {
        newErrors.password = 'Falta: ' + passwordErrors.join(', ');
      }
    }

    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es requerido';
    } else if (!/^\d+$/.test(formData.documento)) {
      newErrors.documento = 'El documento debe contener solo números';
    }

    // Validate fecha_nacimiento
    if (formData.fecha_nacimiento) {
      const date = new Date(formData.fecha_nacimiento);
      if (isNaN(date.getTime())) {
        newErrors.fecha_nacimiento = 'Fecha inválida';
      } else {
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        
        if (date > today) {
          newErrors.fecha_nacimiento = 'La fecha no puede ser futura';
        } else if (age < 18 || (age === 18 && monthDiff < 0)) {
          newErrors.fecha_nacimiento = 'Debes tener al menos 18 años';
        } else if (age > 120) {
          newErrors.fecha_nacimiento = 'Fecha de nacimiento no válida';
        }
      }
    }

    if (formData.genero && !['M', 'F', 'O'].includes(formData.genero.toUpperCase())) {
      newErrors.genero = 'Género debe ser M, F u O';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    if (loading) return; // Prevent multiple calls

    setLoading(true);
    try {
      // Clean up the data
      const registerData = {
        ...formData,
        documento: formData.documento.trim(),
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        genero: formData.genero ? formData.genero.toUpperCase() : undefined,
      };

      // Remove empty optional fields
      Object.keys(registerData).forEach(key => {
        if (!registerData[key] || registerData[key] === '') {
          delete registerData[key];
        }
      });

      const response = await register(registerData);
      
      console.log('Registration successful:', response);

      // If registration includes auto-login (token provided), no need to redirect to login
      if (response.token && response.user) {
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta ha sido creada y has iniciado sesión automáticamente.',
          [{ text: 'Continuar', onPress: () => {} }]
        );
        // The AuthContext will handle the navigation automatically
      } else {
        Alert.alert(
          'Registro exitoso',
          'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
          [
            {
              text: 'Ir al Login',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Ocurrió un error al crear tu cuenta. Por favor, intenta nuevamente.';
      let errorDetails = '';
      
      // Si es un error de validación de contraseña, mostrar requisitos
      if (error.message?.includes('requisitos de seguridad') || error.message?.includes('validación')) {
        errorMessage = 'La contraseña no cumple con los requisitos';
        
        // Construir lista de requisitos
        const requirements = [
          '• Mínimo 8 caracteres',
          '• Al menos una letra minúscula (a-z)',
          '• Al menos una letra MAYÚSCULA (A-Z)',
          '• Al menos un número (0-9)'
        ];
        
        errorDetails = '\n\nRequisitos de contraseña:\n' + requirements.join('\n') + '\n\nEjemplo: MiClave123';
      } else if (error.message?.includes('email') && error.message?.includes('taken')) {
        errorMessage = 'Este correo electrónico ya está registrado. Intenta con otro correo.';
      } else if (error.message?.includes('conexión')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage + errorDetails);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Registro de Paciente</Text>
              <Text style={styles.subtitle}>
                Crea tu cuenta para acceder a nuestros servicios médicos
              </Text>
            </View>

            {/* Registration Form */}
            <View style={styles.form}>
              <CustomInput
                label="Nombre completo"
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                placeholder="Ingresa tu nombre completo"
                error={errors.name}
                icon={<Ionicons name="person-outline" size={20} color="#666" />}
              />

              <CustomInput
                label="Correo electrónico"
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                icon={<Ionicons name="mail-outline" size={20} color="#666" />}
              />

              <CustomInput
                label="Contraseña"
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                error={errors.password}
                icon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
              />

              <PasswordRequirements password={formData.password} />

              <CustomInput
                label="Número de documento"
                value={formData.documento}
                onChangeText={(value) => updateFormData('documento', value)}
                placeholder="1234567890"
                keyboardType="numeric"
                error={errors.documento}
                icon={<Ionicons name="card-outline" size={20} color="#666" />}
              />

              <CustomInput
                label="Teléfono"
                value={formData.telefono}
                onChangeText={(value) => updateFormData('telefono', value)}
                placeholder="3001234567"
                keyboardType="phone-pad"
                error={errors.telefono}
                icon={<Ionicons name="call-outline" size={20} color="#666" />}
              />

              <CustomInput
                label="Dirección"
                value={formData.direccion}
                onChangeText={(value) => updateFormData('direccion', value)}
                placeholder="Calle 123 #45-67, Ciudad"
                error={errors.direccion}
                icon={<Ionicons name="location-outline" size={20} color="#666" />}
              />

              <CustomDatePicker
                label="Fecha de nacimiento"
                value={formData.fecha_nacimiento}
                onDateChange={(date) => updateFormData('fecha_nacimiento', date)}
                placeholder="Seleccionar fecha de nacimiento"
                error={errors.fecha_nacimiento}
                maximumDate={new Date()} // No fechas futuras
                minimumDate={new Date(new Date().getFullYear() - 120, 0, 1)} // Máximo 120 años atrás
              />

              <CustomGenderPicker
                label="Género"
                value={formData.genero}
                onGenderChange={(gender) => updateFormData('genero', gender)}
                placeholder="Seleccionar género"
                error={errors.genero}
              />

              <CustomButton
                title="Crear Cuenta"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Componente para mostrar requisitos de contraseña
const PasswordRequirements = ({ password }) => {
  const requirements = [
    { 
      key: 'length', 
      label: 'Mínimo 8 caracteres', 
      test: (pwd) => pwd.length >= 8 
    },
    { 
      key: 'lowercase', 
      label: 'Una letra minúscula (a-z)', 
      test: (pwd) => /[a-z]/.test(pwd) 
    },
    { 
      key: 'uppercase', 
      label: 'Una letra MAYÚSCULA (A-Z)', 
      test: (pwd) => /[A-Z]/.test(pwd) 
    },
    { 
      key: 'number', 
      label: 'Un número (0-9)', 
      test: (pwd) => /\d/.test(pwd) 
    },
  ];

  if (!password) return null;

  return (
    <View style={styles.passwordRequirements}>
      <Text style={styles.requirementsTitle}>Requisitos de contraseña:</Text>
      {requirements.map((req) => {
        const isValid = req.test(password);
        return (
          <View key={req.key} style={styles.requirementItem}>
            <Ionicons 
              name={isValid ? "checkmark-circle" : "close-circle"} 
              size={16} 
              color={isValid ? "#22c55e" : "#ef4444"} 
            />
            <Text style={[
              styles.requirementText, 
              { color: isValid ? "#22c55e" : "#6b7280" }
            ]}>
              {req.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: 16,
    marginBottom: 24,
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});

export default RegisterScreen;
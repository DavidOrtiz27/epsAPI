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
import CustomInput from '../../components/ui/CustomInput';
import CustomButton from '../../components/ui/CustomButton';

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
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (!formData.documento.trim()) {
      newErrors.documento = 'El documento es requerido';
    } else if (!/^\d+$/.test(formData.documento)) {
      newErrors.documento = 'El documento debe contener solo números';
    }

    if (formData.fecha_nacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(formData.fecha_nacimiento)) {
      newErrors.fecha_nacimiento = 'Formato de fecha: YYYY-MM-DD';
    }

    if (formData.genero && !['M', 'F', 'O'].includes(formData.genero.toUpperCase())) {
      newErrors.genero = 'Género debe ser M, F u O';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

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

      await register(registerData);

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
    } catch (error) {
      console.error('Register error:', error);
      showErrorAlert(error, 'Ocurrió un error al crear tu cuenta. Por favor, intenta nuevamente.');
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

              <CustomInput
                label="Fecha de nacimiento"
                value={formData.fecha_nacimiento}
                onChangeText={(value) => updateFormData('fecha_nacimiento', value)}
                placeholder="YYYY-MM-DD"
                error={errors.fecha_nacimiento}
                icon={<Ionicons name="calendar-outline" size={20} color="#666" />}
              />

              <CustomInput
                label="Género"
                value={formData.genero}
                onChangeText={(value) => updateFormData('genero', value)}
                placeholder="M (Masculino), F (Femenino), O (Otro)"
                autoCapitalize="characters"
                error={errors.genero}
                icon={<Ionicons name="male-female-outline" size={20} color="#666" />}
              />

              <CustomButton
                title="Crear Cuenta"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
});

export default RegisterScreen;
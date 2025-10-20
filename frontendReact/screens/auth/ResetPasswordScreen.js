import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaWrapper } from '../../components';
import { CustomInput } from '../../components/ui';
import ApiService from '../../services/api/api';

const ResetPasswordScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState(route.params?.email || '');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validaciones
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu correo electrónico');
      return;
    }

    if (!token.trim()) {
      Alert.alert('Error', 'Por favor, ingresa el código de verificación');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu nueva contraseña');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    
    try {
      const response = await ApiService.resetPassword({
        email: email.trim().toLowerCase(),
        token: token.trim(),
        password: password,
        password_confirmation: confirmPassword,
      });
      
      Alert.alert(
        'Contraseña Restablecida',
        'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
        [
          {
            text: 'Iniciar Sesión',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Error al restablecer la contraseña';
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
      } else if (error.message?.includes('Token inválido')) {
        errorMessage = 'El código de verificación es inválido o ha expirado';
      } else if (error.message?.includes('Token expirado')) {
        errorMessage = 'El código de verificación ha expirado. Solicita un nuevo código';
      } else if (error.message?.includes('no está registrado')) {
        errorMessage = 'Este correo electrónico no está registrado en el sistema';
      } else if (error.message?.includes('conexión')) {
        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error', errorMessage + errorDetails);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor, ingresa tu correo electrónico primero');
      return;
    }

    try {
      await ApiService.forgotPassword(email.trim().toLowerCase());
      Alert.alert(
        'Código Enviado',
        'Se ha enviado un nuevo código de verificación a tu correo electrónico'
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar un nuevo código');
    }
  };

  return (
    <SafeAreaWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#007bff" />
            </TouchableOpacity>
            <Text style={styles.title}>Restablecer Contraseña</Text>
          </View>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={80} color="#007bff" />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>Ingresa el código de verificación</Text>
            <Text style={styles.instructionsText}>
              Revisa tu correo electrónico y ingresa el código de 64 caracteres
              junto con tu nueva contraseña.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="tu-email@ejemplo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          {/* Token Input */}
          <View style={styles.inputContainer}>
            <View style={styles.labelContainer}>
              <Text style={styles.inputLabel}>Código de Verificación</Text>
              <TouchableOpacity onPress={handleRequestNewCode}>
                <Text style={styles.requestNewCodeText}>Solicitar nuevo código</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Pega aquí el código del correo"
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                editable={!loading}
                multiline={false}
              />
            </View>
          </View>

          {/* New Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nueva Contraseña</Text>
            <CustomInput
              label="Nueva Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
              editable={!loading}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar Nueva Contraseña</Text>
            <CustomInput
              label="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color="#666" />}
              editable={!loading}
            />
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                <Text style={styles.resetButtonText}>Restablecer Contraseña</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Back to Login */}
          <View style={styles.backToLoginContainer}>
            <Text style={styles.backToLoginText}>¿Ya tienes tu contraseña? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.backToLoginLink}>Iniciar Sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Help Section */}
          <View style={styles.helpContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.helpText}>
              El código de verificación expira en 60 minutos. Si necesitas un nuevo código,
              usa el enlace "Solicitar nuevo código" arriba.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  instructionsContainer: {
    marginBottom: 30,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  requestNewCodeText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  eyeIcon: {
    padding: 5,
  },
  resetButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 15,
  },
  resetButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#666',
  },
  backToLoginLink: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    color: '#0c5aa6',
    marginLeft: 10,
    lineHeight: 20,
  },
});

export default ResetPasswordScreen;
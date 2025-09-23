import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const DoctorHelp = () => {
  const navigation = useNavigation();

  const HelpSection = ({ title, icon, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={24} color="#007AFF" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const HelpItem = ({ title, description }) => (
    <View style={styles.helpItem}>
      <Text style={styles.helpItemTitle}>{title}</Text>
      <Text style={styles.helpItemDescription}>{description}</Text>
    </View>
  );

  const contactSupport = () => {
    Alert.alert(
      'Contactar Soporte',
      '¿Cómo deseas contactar al soporte técnico?',
      [
        {
          text: 'Llamar',
          onPress: () => Alert.alert('Llamar', 'Llamar al: +57 300 123 4567'),
        },
        {
          text: 'Email',
          onPress: () => Alert.alert('Email', 'Enviar email a: soporte@medapp.com'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Centro de Ayuda</Text>
            <Text style={styles.headerSubtitle}>Guía para médicos</Text>
          </View>
        </View>

        {/* Getting Started */}
        <HelpSection title="Primeros Pasos" icon="rocket-outline">
          <HelpItem
            title="Inicio de Sesión"
            description="Ingresa con tu email y contraseña proporcionados por el administrador del sistema."
          />
          <HelpItem
            title="Perfil Profesional"
            description="Completa tu información profesional incluyendo especialidad, registro médico y datos de contacto."
          />
          <HelpItem
            title="Horarios de Atención"
            description="Configura tus horarios de disponibilidad para que los pacientes puedan agendar citas."
          />
        </HelpSection>

        {/* Appointments Management */}
        <HelpSection title="Gestión de Citas" icon="calendar-outline">
          <HelpItem
            title="Ver Citas"
            description="En la pestaña 'Citas' puedes ver todas tus citas programadas, pendientes, confirmadas y realizadas."
          />
          <HelpItem
            title="Confirmar Citas"
            description="Las citas pendientes pueden ser confirmadas o canceladas. Una vez confirmadas, aparecerán en tu agenda."
          />
          <HelpItem
            title="Marcar como Realizada"
            description="Después de atender a un paciente, marca la cita como 'Realizada' para actualizar el estado."
          />
          <HelpItem
            title="Editar Citas"
            description="Usa el botón de edición (lápiz) en el header para modificar fecha, hora o motivo de la cita."
          />
        </HelpSection>

        {/* Patient Management */}
        <HelpSection title="Gestión de Pacientes" icon="people-outline">
          <HelpItem
            title="Ver Pacientes"
            description="Accede a la lista de todos tus pacientes con su información básica y historial de citas."
          />
          <HelpItem
            title="Historial Médico"
            description="Revisa el historial clínico completo de cada paciente, incluyendo diagnósticos previos y tratamientos."
          />
          <HelpItem
            title="Información de Contacto"
            description="Cada perfil de paciente incluye teléfono, dirección y fecha de nacimiento para referencia rápida."
          />
        </HelpSection>

        {/* Medical Operations */}
        <HelpSection title="Operaciones Médicas" icon="medical-outline">
          <HelpItem
            title="Registro Médico"
            description="Crea nuevos registros médicos con diagnóstico y observaciones para documentar consultas."
          />
          <HelpItem
            title="Tratamientos"
            description="Inicia tratamientos con descripción, fecha de inicio y duración estimada."
          />
          <HelpItem
            title="Recetas Médicas"
            description="Emite recetas médicas especificando medicamento, dosis, frecuencia y duración del tratamiento."
          />
          <HelpItem
            title="Tratamiento + Receta"
            description="Opción combinada para crear tratamiento y receta médica en un solo paso."
          />
          <HelpItem
            title="Exámenes"
            description="Solicita exámenes médicos especificando el tipo y descripción del procedimiento requerido."
          />
        </HelpSection>

        {/* Reports */}
        <HelpSection title="Reportes y Estadísticas" icon="document-text-outline">
          <HelpItem
            title="Acceder a Reportes"
            description="Desde tu perfil, selecciona 'Reportes' para ver estadísticas completas de tu práctica médica."
          />
          <HelpItem
            title="Estadísticas Disponibles"
            description="Visualiza métricas de citas, pacientes, tratamientos, recetas y tendencias mensuales."
          />
          <HelpItem
            title="Exportar Reportes"
            description="Comparte tus reportes por email, WhatsApp u otras aplicaciones usando el botón 'Compartir Reporte'."
          />
          <HelpItem
            title="Actualizar Datos"
            description="Los reportes se actualizan automáticamente. Usa 'Actualizar Reporte' para datos en tiempo real."
          />
        </HelpSection>

        {/* Profile Management */}
        <HelpSection title="Gestión de Perfil" icon="person-outline">
          <HelpItem
            title="Editar Información"
            description="Mantén actualizada tu información profesional, especialidad y datos de contacto."
          />
          <HelpItem
            title="Registro Profesional"
            description="Asegúrate de que tu número de registro profesional esté correctamente registrado."
          />
          <HelpItem
            title="Cambiar Contraseña"
            description="Para cambiar tu contraseña, contacta al administrador del sistema."
          />
        </HelpSection>

        {/* Troubleshooting */}
        <HelpSection title="Solución de Problemas" icon="help-circle-outline">
          <HelpItem
            title="Problemas de Conexión"
            description="Verifica tu conexión a internet. Si persiste, reinicia la aplicación."
          />
          <HelpItem
            title="Datos No Se Guardan"
            description="Asegúrate de completar todos los campos requeridos marcados con asterisco (*)."
          />
          <HelpItem
            title="Citas No Aparecen"
            description="Las citas aparecen según tu ID de médico asignado. Contacta al administrador si no ves tus citas."
          />
          <HelpItem
            title="Error al Iniciar Sesión"
            description="Verifica que tu email y contraseña sean correctos. Las mayúsculas/minúsculas importan."
          />
        </HelpSection>

        {/* Contact Support */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>¿Necesitas Ayuda Adicional?</Text>
          <Text style={styles.contactDescription}>
            Nuestro equipo de soporte está disponible para ayudarte con cualquier duda o problema técnico.
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={contactSupport}>
            <Ionicons name="call-outline" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contactar Soporte</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>MedApp v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2025 MedApp. Todos los derechos reservados.</Text>
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
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  sectionContent: {
    padding: 16,
  },
  helpItem: {
    marginBottom: 16,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  helpItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactSection: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: '#999',
  },
});

export default DoctorHelp;
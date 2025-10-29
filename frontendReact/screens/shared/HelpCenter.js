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
import { useAuth } from '../../utils/context/AuthContext';

const HelpCenter = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  // Determine user role
  const getUserRole = () => {
    if (!user?.roles) return 'guest';
    
    if (user.roles.some(role => role.name === 'admin' || role.name === 'superadmin')) {
      return 'admin';
    } else if (user.roles.some(role => role.name === 'doctor')) {
      return 'doctor';
    } else if (user.roles.some(role => role.name === 'paciente' || role.name === 'patient')) {
      return 'patient';
    }
    
    return 'guest';
  };

  const userRole = getUserRole();

  // Get role-specific title and subtitle
  const getRoleInfo = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'Centro de Ayuda',
          subtitle: 'Guía para administradores',
          icon: 'shield-checkmark-outline'
        };
      case 'doctor':
        return {
          title: 'Centro de Ayuda',
          subtitle: 'Guía para médicos',
          icon: 'medical-outline'
        };
      case 'patient':
        return {
          title: 'Centro de Ayuda',
          subtitle: 'Guía para pacientes',
          icon: 'person-outline'
        };
      default:
        return {
          title: 'Centro de Ayuda',
          subtitle: 'Guía de usuario',
          icon: 'help-circle-outline'
        };
    }
  };

  const roleInfo = getRoleInfo();

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

  // Common sections for all users
  const renderCommonSections = () => (
    <>
      {/* Getting Started */}
      <HelpSection title="Primeros Pasos" icon="rocket-outline">
        <HelpItem
          title="Inicio de Sesión"
          description="Ingresa con tu email y contraseña proporcionados por el administrador del sistema."
        />
        <HelpItem
          title="Navegación"
          description="Utiliza las pestañas inferiores para navegar entre las diferentes secciones de la aplicación."
        />
        <HelpItem
          title="Perfil de Usuario"
          description="Mantén actualizada tu información personal en la sección de perfil."
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
          title="Error al Iniciar Sesión"
          description="Verifica que tu email y contraseña sean correctos. Las mayúsculas/minúsculas importan."
        />
      </HelpSection>
    </>
  );

  // Admin-specific sections
  const renderAdminSections = () => (
    <>
      <HelpSection title="Gestión del Sistema" icon="settings-outline">
        <HelpItem
          title="Dashboard Principal"
          description="El dashboard muestra estadísticas generales del sistema: usuarios, citas, médicos activos y actividad reciente."
        />
        <HelpItem
          title="Gestión de Usuarios"
          description="Administra todos los usuarios del sistema, asigna roles y controla accesos desde la sección de reportes."
        />
        <HelpItem
          title="Auditoría"
          description="Revisa el registro de todas las acciones realizadas en el sistema para mantener control y seguridad."
        />
      </HelpSection>

      <HelpSection title="Gestión de Personal Médico" icon="medical-outline">
        <HelpItem
          title="Registro de Médicos"
          description="Agrega nuevos médicos al sistema con su información profesional, especialidad y datos de contacto."
        />
        <HelpItem
          title="Especialidades"
          description="Gestiona las especialidades médicas disponibles en el sistema para categorizar a los doctores."
        />
        <HelpItem
          title="Horarios Médicos"
          description="Los médicos pueden configurar sus horarios, pero como admin puedes supervisar la disponibilidad general."
        />
      </HelpSection>

      <HelpSection title="Gestión de Pacientes" icon="people-outline">
        <HelpItem
          title="Registro de Pacientes"
          description="Administra el registro de pacientes con información personal, contacto y datos médicos básicos."
        />
        <HelpItem
          title="Historial Médico"
          description="Supervisa los historiales médicos y registros de atención de todos los pacientes."
        />
        <HelpItem
          title="Informes de Pacientes"
          description="Genera reportes sobre la actividad de pacientes y estadísticas de atención."
        />
      </HelpSection>

      <HelpSection title="Administración de Medicamentos" icon="medkit-outline">
        <HelpItem
          title="Catálogo de Medicamentos"
          description="Mantén actualizado el catálogo de medicamentos disponibles para prescripción médica."
        />
        <HelpItem
          title="Agregar Medicamentos"
          description="Registra nuevos medicamentos con nombre, descripción, dosificación y contraindicaciones."
        />
        <HelpItem
          title="Control de Inventario"
          description="Supervisa el uso de medicamentos prescritos y mantén control del inventario."
        />
      </HelpSection>

      <HelpSection title="Gestión de Citas" icon="calendar-outline">
        <HelpItem
          title="Supervisión de Citas"
          description="Monitorea todas las citas del sistema: programadas, confirmadas, realizadas y canceladas."
        />
        <HelpItem
          title="Conflictos de Horarios"
          description="Identifica y resuelve conflictos de programación entre médicos y pacientes."
        />
        <HelpItem
          title="Estadísticas de Citas"
          description="Analiza patrones de citas, picos de demanda y eficiencia de atención."
        />
      </HelpSection>

      <HelpSection title="Reportes y Análisis" icon="document-text-outline">
        <HelpItem
          title="Dashboard de Estadísticas"
          description="Accede a métricas completas del sistema: usuarios activos, citas, tratamientos y actividad médica."
        />
        <HelpItem
          title="Reportes Personalizados"
          description="Genera reportes específicos para análisis de rendimiento y toma de decisiones."
        />
        <HelpItem
          title="Exportar Datos"
          description="Exporta información del sistema para análisis externos o respaldos."
        />
      </HelpSection>
    </>
  );

  // Doctor-specific sections
  const renderDoctorSections = () => (
    <>
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
    </>
  );

  // Patient-specific sections
  const renderPatientSections = () => (
    <>
      <HelpSection title="Gestión de Citas" icon="calendar-outline">
        <HelpItem
          title="Agendar Citas"
          description="Desde la pestaña 'Citas', usa el botón '+' para agendar una nueva cita médica seleccionando doctor y fecha."
        />
        <HelpItem
          title="Ver Mis Citas"
          description="Revisa todas tus citas: programadas, confirmadas, realizadas y canceladas con detalles completos."
        />
        <HelpItem
          title="Estados de Citas"
          description="Las citas pueden estar: Pendientes (esperando confirmación), Confirmadas (aprobadas por el doctor) o Realizadas."
        />
        <HelpItem
          title="Cancelar Citas"
          description="Puedes cancelar citas pendientes o confirmadas. Las citas realizadas no se pueden modificar."
        />
      </HelpSection>

      <HelpSection title="Historial Médico" icon="document-text-outline">
        <HelpItem
          title="Ver Historial"
          description="En la pestaña 'Historial' puedes revisar todos tus registros médicos, diagnósticos y tratamientos."
        />
        <HelpItem
          title="Registros Médicos"
          description="Cada consulta genera un registro con fecha, médico, diagnóstico y observaciones importantes."
        />
        <HelpItem
          title="Tratamientos Activos"
          description="Revisa tus tratamientos en curso con fechas de inicio, duración y descripción detallada."
        />
        <HelpItem
          title="Recetas Médicas"
          description="Accede a todas tus recetas médicas con información de medicamentos, dosis y duración."
        />
        <HelpItem
          title="Exámenes Solicitados"
          description="Consulta los exámenes médicos que te han sido solicitados con detalles del tipo y procedimiento."
        />
      </HelpSection>

      <HelpSection title="Perfil del Paciente" icon="person-outline">
        <HelpItem
          title="Información Personal"
          description="Mantén actualizada tu información de contacto: teléfono, dirección y email."
        />
        <HelpItem
          title="Datos Médicos"
          description="Tu información médica básica como fecha de nacimiento y datos de contacto para emergencias."
        />
        <HelpItem
          title="Seguridad"
          description="Para cambiar tu contraseña o actualizar datos sensibles, contacta al administrador."
        />
      </HelpSection>

      <HelpSection title="Uso de la Aplicación" icon="phone-portrait-outline">
        <HelpItem
          title="Dashboard Inicial"
          description="La pantalla de inicio muestra un resumen de tus próximas citas y actividad médica reciente."
        />
        <HelpItem
          title="Navegación"
          description="Usa las pestañas inferiores: Inicio, Citas, Historial y Perfil para acceder a diferentes secciones."
        />
        <HelpItem
          title="Notificaciones"
          description="Recibirás notificaciones sobre confirmación de citas, recordatorios y actualizaciones importantes."
        />
      </HelpSection>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Ionicons name={roleInfo.icon} size={24} color="#007AFF" style={styles.titleIcon} />
              <View>
                <Text style={styles.headerTitle}>{roleInfo.title}</Text>
                <Text style={styles.headerSubtitle}>{roleInfo.subtitle}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Role-specific content */}
        {userRole === 'admin' && renderAdminSections()}
        {userRole === 'doctor' && renderDoctorSections()}
        {userRole === 'patient' && renderPatientSections()}

        {/* Common sections for all users */}
        {renderCommonSections()}

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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 12,
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

export default HelpCenter;
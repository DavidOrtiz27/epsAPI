import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const { width } = Dimensions.get('window');

const AdminReports = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState({
    appointments: {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    },
    patients: {
      total: 0,
      active: 0,
      newThisMonth: 0,
    },
    doctors: {
      total: 0,
      active: 0,
      bySpecialty: [],
    },
  });

  useEffect(() => {
    loadReportData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadReportData();
    }, [])
  );

  const loadReportData = async () => {
    try {
      // Load dashboard data which contains comprehensive statistics
      const dashboardData = await apiService.getAdminDashboard();

      // Extract and organize data for reports
      const estadisticasBasicas = dashboardData.estadisticas_basicas || {};
      const estadisticasTiempo = dashboardData.estadisticas_tiempo || {};
      const actividadMedica = dashboardData.actividad_medica || {};
      const actividadPacientes = dashboardData.actividad_pacientes || {};
      const actividadDoctores = dashboardData.actividad_doctores || {};
      const distribucionEstados = dashboardData.distribucion_estados_citas || {};
      const actividadReciente = dashboardData.actividad_reciente || {};
      const saludSistema = dashboardData.salud_sistema || {};

      setReportData({
        appointments: {
          total: estadisticasBasicas.total_citas || 0,
          pending: estadisticasBasicas.citas_pendientes || 0,
          confirmed: estadisticasBasicas.citas_confirmadas || 0,
          completed: estadisticasBasicas.citas_realizadas || 0,
          cancelled: estadisticasBasicas.citas_canceladas || 0,
          today: estadisticasTiempo.citas_hoy || 0,
          thisWeek: estadisticasTiempo.citas_semana || 0,
          thisMonth: estadisticasTiempo.citas_mes || 0,
        },
        patients: {
          total: estadisticasBasicas.total_pacientes || 0,
          withAppointments: actividadPacientes.pacientes_con_citas || 0,
          withHistory: actividadPacientes.pacientes_con_historial || 0,
          activityRate: actividadPacientes.tasa_actividad_pacientes || 0,
        },
        doctors: {
          total: estadisticasBasicas.total_doctores || 0,
          active: actividadDoctores.doctores_activos || 0,
          activityRate: actividadDoctores.tasa_actividad_doctores || 0,
          specialties: actividadDoctores.especialidades || [],
        },
        medicalActivity: {
          registrosMedicos: actividadMedica.registros_medicos || 0,
          tratamientos: actividadMedica.tratamientos || 0,
          recetasMedicas: actividadMedica.recetas_medicas || 0,
        },
        recentActivity: {
          citasCreadas: actividadReciente.citas_creadas || 0,
          pacientesRegistrados: actividadReciente.pacientes_registrados || 0,
          registrosMedicos: actividadReciente.registros_medicos || 0,
          tratamientosIniciados: actividadReciente.tratamientos_iniciados || 0,
          recetasEmitidas: actividadReciente.recetas_emitidas || 0,
        },
        systemHealth: {
          totalUsuarios: saludSistema.total_usuarios || 0,
          usuariosActivos30Dias: saludSistema.usuarios_activos_30_dias || 0,
          tasaOcupacionCitas: saludSistema.tasa_ocupacion_citas || 0,
          tasaConfirmacionCitas: saludSistema.tasa_confirmacion_citas || 0,
          promedioCitasPorDia: saludSistema.promedio_citas_por_dia || 0,
          promedioCitasPorPaciente: saludSistema.promedio_citas_por_paciente || 0,
          promedioRegistrosPorPaciente: saludSistema.promedio_registros_por_paciente || 0,
        },
        appointmentDistribution: {
          pendientes: distribucionEstados.pendientes || { cantidad: 0, porcentaje: 0 },
          confirmadas: distribucionEstados.confirmadas || { cantidad: 0, porcentaje: 0 },
          realizadas: distribucionEstados.realizadas || { cantidad: 0, porcentaje: 0 },
          canceladas: distribucionEstados.canceladas || { cantidad: 0, porcentaje: 0 },
        },
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos de reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadReportData();
  };

  const StatCard = ({ title, value, subtitle, icon, color, trend }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {trend && (
          <View style={[styles.trendBadge, trend.type === 'up' ? styles.trendUp : styles.trendDown]}>
            <Ionicons
              name={trend.type === 'up' ? 'trending-up' : 'trending-down'}
              size={12}
              color={trend.type === 'up' ? '#34C759' : '#FF3B30'}
            />
            <Text style={[styles.trendText, { color: trend.type === 'up' ? '#34C759' : '#FF3B30' }]}>
              {trend.value}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );

  const ProgressBar = ({ label, value, maxValue, color }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>{value}/{maxValue}</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%`, backgroundColor: color }
            ]}
          />
        </View>
      </View>
    );
  };

  const ReportSection = ({ title, icon, children }) => (
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

  const generateDetailedReport = (type) => {
    let reportTitle = '';
    let reportContent = '';

    switch (type) {
      case 'appointments':
        reportTitle = 'Reporte de Citas Médicas';
        reportContent = `
📊 ESTADÍSTICAS DE CITAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total de Citas Registradas: ${reportData.appointments.total}
• Citas Pendientes: ${reportData.appointments.pending}
• Citas Confirmadas: ${reportData.appointments.confirmed}
• Citas Completadas: ${reportData.appointments.completed}
• Citas Canceladas: ${reportData.appointments.cancelled}

📅 ACTIVIDAD TEMPORAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Citas de Hoy: ${reportData.appointments.today}
• Citas de Esta Semana: ${reportData.appointments.thisWeek}
• Citas de Este Mes: ${reportData.appointments.thisMonth}

📈 MÉTRICAS DE RENDIMIENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Tasa de Confirmación: ${reportData.appointments.total > 0 ? Math.round((reportData.appointments.confirmed / reportData.appointments.total) * 100) : 0}%
• Tasa de Completación: ${reportData.appointments.total > 0 ? Math.round((reportData.appointments.completed / reportData.appointments.total) * 100) : 0}%
• Tasa de Cancelación: ${reportData.appointments.total > 0 ? Math.round((reportData.appointments.cancelled / reportData.appointments.total) * 100) : 0}%

💡 INFORMACIÓN IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Los datos mostrados provienen directamente de la API del sistema médico.
        `;
        break;

      case 'patients':
        reportTitle = 'Reporte de Pacientes';
        reportContent = `
👥 REGISTRO DE PACIENTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total de Pacientes Registrados: ${reportData.patients.total}

📊 INFORMACIÓN DISPONIBLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actualmente solo se muestra el conteo total de pacientes.
Para información detallada por paciente, use la sección de gestión de pacientes.

💡 NOTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Información adicional como pacientes activos, nuevos registros mensuales, etc., estará disponible en futuras actualizaciones del sistema.
        `;
        break;

      case 'doctors':
        reportTitle = 'Reporte de Médicos';
        reportContent = `
🏥 REGISTRO DE MÉDICOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total de Médicos Registrados: ${reportData.doctors.total}

📊 INFORMACIÓN DISPONIBLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actualmente solo se muestra el conteo total de médicos.
Para información detallada por médico, use la sección de gestión de médicos.

💡 NOTA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Información adicional como especialidades, médicos activos, etc., estará disponible en futuras actualizaciones del sistema.
        `;
        break;

      case 'financial':
        reportTitle = 'Información Financiera - Próximamente';
        reportContent = `
💰 MÓDULO FINANCIERO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

El sistema de reportes financieros está en desarrollo y estará disponible en futuras versiones.

📋 FUNCIONALIDADES PLANIFICADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Ingresos totales y por período
• Control de pagos pendientes
• Reportes de facturación
• Análisis de cobranza
• Estadísticas financieras detalladas

⏰ ESTADO ACTUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Esta funcionalidad estará disponible próximamente.
        `;
        break;
    }

    Alert.alert(
      reportTitle,
      reportContent,
      [
        { text: 'Cerrar' },
        {
          text: 'Exportar',
          onPress: () => Alert.alert('Exportar', 'Funcionalidad de exportación estará disponible próximamente')
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando reportes...</Text>
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
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reportes y Estadísticas</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
        >
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
      >
        {/* Overview Cards */}
        <View style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, { backgroundColor: '#E3F2FD' }]}>
              <View style={styles.overviewIcon}>
                <Ionicons name="calendar" size={32} color="#1976D2" />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewValue}>{reportData.appointments.total}</Text>
                <Text style={styles.overviewLabel}>Citas Totales</Text>
              </View>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: '#E8F5E8' }]}>
              <View style={styles.overviewIcon}>
                <Ionicons name="people" size={32} color="#388E3C" />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewValue}>{reportData.patients.total}</Text>
                <Text style={styles.overviewLabel}>Pacientes</Text>
              </View>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: '#FFF3E0' }]}>
              <View style={styles.overviewIcon}>
                <Ionicons name="medical" size={32} color="#F57C00" />
              </View>
              <View style={styles.overviewContent}>
                <Text style={styles.overviewValue}>{reportData.doctors.total}</Text>
                <Text style={styles.overviewLabel}>Médicos</Text>
              </View>
            </View>

          </View>
        </View>

        {/* Appointments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Citas Médicas</Text>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{reportData.appointments.today}</Text>
                <Text style={styles.metricLabel}>Hoy</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{reportData.appointments.thisWeek}</Text>
                <Text style={styles.metricLabel}>Esta Semana</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{reportData.appointments.thisMonth}</Text>
                <Text style={styles.metricLabel}>Este Mes</Text>
              </View>
            </View>
          </View>

          <View style={styles.statusBreakdown}>
            <Text style={styles.breakdownTitle}>Estado de Citas</Text>
            <View style={styles.statusGrid}>
              <View style={[styles.statusItem, { backgroundColor: '#FFF3CD' }]}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
                  <Text style={styles.statusLabel}>Pendientes</Text>
                </View>
                <Text style={styles.statusValue}>{reportData.appointments.pending}</Text>
              </View>

              <View style={[styles.statusItem, { backgroundColor: '#D1ECF1' }]}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#007AFF' }]} />
                  <Text style={styles.statusLabel}>Confirmadas</Text>
                </View>
                <Text style={styles.statusValue}>{reportData.appointments.confirmed}</Text>
              </View>

              <View style={[styles.statusItem, { backgroundColor: '#D4EDDA' }]}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
                  <Text style={styles.statusLabel}>Completadas</Text>
                </View>
                <Text style={styles.statusValue}>{reportData.appointments.completed}</Text>
              </View>

              <View style={[styles.statusItem, { backgroundColor: '#F8D7DA' }]}>
                <View style={styles.statusIndicator}>
                  <View style={[styles.statusDot, { backgroundColor: '#FF3B30' }]} />
                  <Text style={styles.statusLabel}>Canceladas</Text>
                </View>
                <Text style={styles.statusValue}>{reportData.appointments.cancelled}</Text>
              </View>
            </View>
          </View>

        </View>

        {/* Medical Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Actividad Médica</Text>
          </View>

          <View style={styles.activityGrid}>
            <View style={[styles.activityCard, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="document-text" size={24} color="#34C759" />
              <View style={styles.activityContent}>
                <Text style={styles.activityValue}>{reportData.medicalActivity.registrosMedicos}</Text>
                <Text style={styles.activityLabel}>Registros Médicos</Text>
              </View>
            </View>

            <View style={[styles.activityCard, { backgroundColor: '#FFF3CD' }]}>
              <Ionicons name="medical" size={24} color="#FF9500" />
              <View style={styles.activityContent}>
                <Text style={styles.activityValue}>{reportData.medicalActivity.tratamientos}</Text>
                <Text style={styles.activityLabel}>Tratamientos</Text>
              </View>
            </View>

            <View style={[styles.activityCard, { backgroundColor: '#D1ECF1' }]}>
              <Ionicons name="medkit" size={24} color="#007AFF" />
              <View style={styles.activityContent}>
                <Text style={styles.activityValue}>{reportData.medicalActivity.recetasMedicas}</Text>
                <Text style={styles.activityLabel}>Recetas Médicas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Actividad Reciente (7 días)</Text>
          </View>

          <View style={styles.recentActivityGrid}>
            <View style={styles.recentActivityItem}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
              <View style={styles.recentActivityContent}>
                <Text style={styles.recentActivityValue}>{reportData.recentActivity.citasCreadas}</Text>
                <Text style={styles.recentActivityLabel}>Citas Creadas</Text>
              </View>
            </View>

            <View style={styles.recentActivityItem}>
              <Ionicons name="person-add" size={20} color="#34C759" />
              <View style={styles.recentActivityContent}>
                <Text style={styles.recentActivityValue}>{reportData.recentActivity.pacientesRegistrados}</Text>
                <Text style={styles.recentActivityLabel}>Pacientes Nuevos</Text>
              </View>
            </View>

            <View style={styles.recentActivityItem}>
              <Ionicons name="document-text" size={20} color="#FF9500" />
              <View style={styles.recentActivityContent}>
                <Text style={styles.recentActivityValue}>{reportData.recentActivity.registrosMedicos}</Text>
                <Text style={styles.recentActivityLabel}>Registros Médicos</Text>
              </View>
            </View>

            <View style={styles.recentActivityItem}>
              <Ionicons name="medical" size={20} color="#C2185B" />
              <View style={styles.recentActivityContent}>
                <Text style={styles.recentActivityValue}>{reportData.recentActivity.tratamientosIniciados}</Text>
                <Text style={styles.recentActivityLabel}>Tratamientos</Text>
              </View>
            </View>
          </View>
        </View>

        {/* System Health Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart-outline" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Métricas del Sistema</Text>
          </View>

          <View style={styles.systemMetricsGrid}>
            <View style={styles.systemMetricGroup}>
              <Text style={styles.metricGroupTitle}>Usuarios</Text>
              <View style={styles.metricGroupItems}>
                <View style={styles.systemMetricItem}>
                  <Text style={styles.systemMetricValue}>{reportData.systemHealth.totalUsuarios}</Text>
                  <Text style={styles.systemMetricLabel}>Total</Text>
                </View>
                <View style={styles.systemMetricItem}>
                  <Text style={styles.systemMetricValue}>{reportData.systemHealth.usuariosActivos30Dias}</Text>
                  <Text style={styles.systemMetricLabel}>Activos (30d)</Text>
                </View>
              </View>
            </View>

            <View style={styles.systemMetricGroup}>
              <Text style={styles.metricGroupTitle}>Rendimiento de Citas</Text>
              <View style={styles.metricGroupItems}>
                <View style={styles.systemMetricItem}>
                  <Text style={styles.systemMetricValue}>{reportData.systemHealth.tasaOcupacionCitas}%</Text>
                  <Text style={styles.systemMetricLabel}>Tasa Ocupación</Text>
                </View>
                <View style={styles.systemMetricItem}>
                  <Text style={styles.systemMetricValue}>{reportData.systemHealth.tasaConfirmacionCitas}%</Text>
                  <Text style={styles.systemMetricLabel}>Tasa Confirmación</Text>
                </View>
              </View>
            </View>

            <View style={styles.systemMetricGroup}>
              <Text style={styles.metricGroupTitle}>Promedios</Text>
              <View style={styles.metricGroupItems}>
                <View style={styles.systemMetricItem}>
                  <Text style={styles.systemMetricValue}>{reportData.systemHealth.promedioCitasPorDia}</Text>
                  <Text style={styles.systemMetricLabel}>Citas/Día</Text>
                </View>
                <View style={styles.systemMetricItem}>
                  <Text style={styles.systemMetricValue}>{reportData.systemHealth.promedioCitasPorPaciente}</Text>
                  <Text style={styles.systemMetricLabel}>Citas/Paciente</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Patients & Doctors Section */}
        <View style={styles.twoColumnSection}>
          <View style={[styles.halfSection, styles.section]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Pacientes</Text>
            </View>

            <View style={styles.simpleMetrics}>
              <View style={styles.simpleMetric}>
                <Text style={styles.simpleMetricValue}>{reportData.patients.total}</Text>
                <Text style={styles.simpleMetricLabel}>Total Registrados</Text>
              </View>
              <View style={styles.simpleMetric}>
                <Text style={styles.simpleMetricValue}>{reportData.patients.withAppointments}</Text>
                <Text style={styles.simpleMetricLabel}>Con Citas</Text>
              </View>
              <View style={styles.simpleMetric}>
                <Text style={styles.simpleMetricValue}>{reportData.patients.withHistory}</Text>
                <Text style={styles.simpleMetricLabel}>Con Historial</Text>
              </View>
            </View>

          </View>

          <View style={[styles.halfSection, styles.section]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medical-outline" size={20} color="#007AFF" />
              <Text style={styles.sectionTitle}>Médicos</Text>
            </View>

            <View style={styles.simpleMetrics}>
              <View style={styles.simpleMetric}>
                <Text style={styles.simpleMetricValue}>{reportData.doctors.total}</Text>
                <Text style={styles.simpleMetricLabel}>Total Registrados</Text>
              </View>
              <View style={styles.simpleMetric}>
                <Text style={styles.simpleMetricValue}>{reportData.doctors.active}</Text>
                <Text style={styles.simpleMetricLabel}>Activos (30d)</Text>
              </View>
              <View style={styles.simpleMetric}>
                <Text style={styles.simpleMetricValue}>{reportData.doctors.activityRate}%</Text>
                <Text style={styles.simpleMetricLabel}>Tasa Actividad</Text>
              </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // Overview Section
  overviewSection: {
    marginBottom: 24,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    flex: 1,
    minWidth: (width - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewIcon: {
    marginRight: 12,
  },
  overviewContent: {
    flex: 1,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Section Styles
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },

  // Metrics
  metricsGrid: {
    padding: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // Status Breakdown
  statusBreakdown: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: (width - 56) / 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },

  // Two Column Layout
  twoColumnSection: {
    flexDirection: 'row',
    gap: 16,
  },
  halfSection: {
    flex: 1,
  },

  // Simple Metrics
  simpleMetrics: {
    padding: 16,
  },
  simpleMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  simpleMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  simpleMetricLabel: {
    fontSize: 14,
    color: '#666',
  },

  // Financial Section
  financialGrid: {
    padding: 16,
    gap: 12,
  },
  financialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  financialContent: {
    marginLeft: 12,
    flex: 1,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  financialLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  smallActionButton: {
    alignSelf: 'stretch',
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    margin: 16,
  },
  smallActionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Export Section
  exportSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  exportSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  exportGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  exportCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  exportLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },

  // Medical Activity Styles
  activityGrid: {
    padding: 16,
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  activityLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },

  // Recent Activity Styles
  recentActivityGrid: {
    padding: 16,
    gap: 12,
  },
  recentActivityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  recentActivityContent: {
    marginLeft: 12,
    flex: 1,
  },
  recentActivityValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  recentActivityLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // System Health Styles
  systemMetricsGrid: {
    padding: 16,
    gap: 20,
  },
  systemMetricGroup: {
    marginBottom: 16,
  },
  metricGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  metricGroupItems: {
    flexDirection: 'row',
    gap: 12,
  },
  systemMetricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  systemMetricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  systemMetricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },

  // Coming Soon Styles
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AdminReports;
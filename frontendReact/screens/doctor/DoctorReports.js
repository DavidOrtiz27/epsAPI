import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/api/api';
import CustomButton from '../../components/ui/CustomButton';

const DoctorReports = () => {
  const navigation = useNavigation();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const reportData = await apiService.getDoctorReports();
      setReports(reportData);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const generateReportText = () => {
    if (!reports) return '';

    const { estadisticas_citas, estadisticas_pacientes, actividad_reciente, tendencia_mensual } = reports;

    let reportText = `REPORTE MÉDICO - ${new Date().toLocaleDateString('es-ES')}\n\n`;

    reportText += `📊 ESTADÍSTICAS DE CITAS:\n`;
    reportText += `• Total de citas: ${estadisticas_citas.total}\n`;
    reportText += `• Pendientes: ${estadisticas_citas.pendientes}\n`;
    reportText += `• Confirmadas: ${estadisticas_citas.confirmadas}\n`;
    reportText += `• Canceladas: ${estadisticas_citas.canceladas}\n`;
    reportText += `• Realizadas: ${estadisticas_citas.realizadas}\n`;
    reportText += `• Citas hoy: ${estadisticas_citas.hoy}\n`;
    reportText += `• Esta semana: ${estadisticas_citas.semana}\n`;
    reportText += `• Este mes: ${estadisticas_citas.mes}\n\n`;

    reportText += `👥 ESTADÍSTICAS DE PACIENTES:\n`;
    reportText += `• Total de pacientes: ${estadisticas_pacientes.total_pacientes}\n`;
    reportText += `• Registros médicos: ${estadisticas_pacientes.registros_medicos}\n`;
    reportText += `• Tratamientos: ${estadisticas_pacientes.tratamientos}\n`;
    reportText += `• Recetas médicas: ${estadisticas_pacientes.recetas_medicas}\n\n`;

    reportText += `📈 ACTIVIDAD RECIENTE (últimos 30 días):\n`;
    reportText += `• Citas realizadas: ${actividad_reciente.citas_realizadas}\n`;
    reportText += `• Registros creados: ${actividad_reciente.registros_creados}\n`;
    reportText += `• Tratamientos iniciados: ${actividad_reciente.tratamientos_iniciados}\n\n`;

    reportText += `📊 TENDENCIA MENSUAL:\n`;
    tendencia_mensual.forEach(item => {
      reportText += `• ${item.mes}: ${item.citas} citas, ${item.pacientes_unicos} pacientes únicos\n`;
    });

    reportText += `\nGenerado el: ${new Date(reports.generado_en).toLocaleString('es-ES')}`;

    return reportText;
  };

  const shareReport = async () => {
    try {
      const reportText = generateReportText();
      await Share.share({
        message: reportText,
        title: 'Reporte Médico',
      });
    } catch (error) {
      console.error('Error sharing report:', error);
      Alert.alert('Error', 'No se pudo compartir el reporte');
    }
  };

  const StatCard = ({ title, value, icon, color = '#007AFF' }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={24} color={color} />
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const TrendItem = ({ month, appointments, patients }) => (
    <View style={styles.trendItem}>
      <Text style={styles.trendMonth}>{month}</Text>
      <View style={styles.trendStats}>
        <Text style={styles.trendValue}>{appointments} citas</Text>
        <Text style={styles.trendSubValue}>{patients} pacientes</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="document-text-outline" size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Generando reporte...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reports) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>No se pudieron cargar los reportes</Text>
          <CustomButton
            title="Reintentar"
            onPress={loadReports}
            backgroundColor="#007AFF"
            textColor="#fff"
          />
        </View>
      </SafeAreaView>
    );
  }

  const { estadisticas_citas, estadisticas_pacientes, actividad_reciente, tendencia_mensual } = reports;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Reportes Médicos</Text>
            <Text style={styles.headerSubtitle}>
              Estadísticas y análisis de tu práctica
            </Text>
          </View>
          <TouchableOpacity onPress={shareReport} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Appointment Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estadísticas de Citas</Text>
          <View style={styles.statsGrid}>
            <StatCard title="Total" value={estadisticas_citas.total} icon="calendar-outline" />
            <StatCard title="Hoy" value={estadisticas_citas.hoy} icon="today-outline" color="#34C759" />
            <StatCard title="Esta Semana" value={estadisticas_citas.semana} icon="time-outline" color="#FF9500" />
            <StatCard title="Este Mes" value={estadisticas_citas.mes} icon="calendar" color="#007AFF" />
          </View>

          <View style={styles.statusGrid}>
            <StatCard title="Pendientes" value={estadisticas_citas.pendientes} icon="time-outline" color="#FF9500" />
            <StatCard title="Confirmadas" value={estadisticas_citas.confirmadas} icon="checkmark-circle-outline" color="#34C759" />
            <StatCard title="Realizadas" value={estadisticas_citas.realizadas} icon="checkmark-done-circle-outline" color="#007AFF" />
            <StatCard title="Canceladas" value={estadisticas_citas.canceladas} icon="close-circle-outline" color="#FF3B30" />
          </View>
        </View>

        {/* Patient Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Estadísticas de Pacientes</Text>
          <View style={styles.statsGrid}>
            <StatCard title="Total Pacientes" value={estadisticas_pacientes.total_pacientes} icon="people-outline" />
            <StatCard title="Registros Médicos" value={estadisticas_pacientes.registros_medicos} icon="document-text-outline" color="#FF9500" />
            <StatCard title="Tratamientos" value={estadisticas_pacientes.tratamientos} icon="medical-outline" color="#34C759" />
            <StatCard title="Recetas" value={estadisticas_pacientes.recetas_medicas} icon="medkit-outline" color="#007AFF" />
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Actividad Reciente (30 días)</Text>
          <View style={styles.activityGrid}>
            <StatCard title="Citas Realizadas" value={actividad_reciente.citas_realizadas} icon="checkmark-done-outline" color="#34C759" />
            <StatCard title="Registros Creados" value={actividad_reciente.registros_creados} icon="create-outline" color="#FF9500" />
            <StatCard title="Tratamientos Iniciados" value={actividad_reciente.tratamientos_iniciados} icon="medical-outline" color="#007AFF" />
          </View>
        </View>

        {/* Monthly Trends */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Tendencia Mensual</Text>
          <View style={styles.trendsContainer}>
            {tendencia_mensual.map((item, index) => (
              <TrendItem
                key={index}
                month={item.mes}
                appointments={item.citas}
                patients={item.pacientes_unicos}
              />
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <CustomButton
            title="Actualizar Reporte"
            onPress={loadReports}
            backgroundColor="#007AFF"
            textColor="#fff"
            style={styles.actionButton}
          />
          <CustomButton
            title="Compartir Reporte"
            onPress={shareReport}
            backgroundColor="#34C759"
            textColor="#fff"
            style={styles.actionButton}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
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
  shareButton: {
    padding: 8,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statusGrid: {
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
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trendsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  trendMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  trendStats: {
    alignItems: 'flex-end',
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  trendSubValue: {
    fontSize: 14,
    color: '#666',
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
  },
});

export default DoctorReports;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalPacientes: 0,
    totalDoctores: 0,
    totalCitas: 0,
    citasPendientes: 0,
    citasConfirmadas: 0,
    citasRealizadas: 0,
    citasCanceladas: 0,
    citasHoy: 0,
    citasSemana: 0,
    citasMes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const dashboardData = await apiService.getAdminDashboard();

      // Extract the basic statistics from the API response
      const estadisticasBasicas = dashboardData.estadisticas_basicas;
      const estadisticasTiempo = dashboardData.estadisticas_tiempo;

      if (estadisticasBasicas && estadisticasTiempo) {
        setStats({
          totalPacientes: estadisticasBasicas.total_pacientes || 0,
          totalDoctores: estadisticasBasicas.total_doctores || 0,
          totalCitas: estadisticasBasicas.total_citas || 0,
          citasPendientes: estadisticasBasicas.citas_pendientes || 0,
          citasConfirmadas: estadisticasBasicas.citas_confirmadas || 0,
          citasRealizadas: estadisticasBasicas.citas_realizadas || 0,
          citasCanceladas: estadisticasBasicas.citas_canceladas || 0,
          citasHoy: estadisticasTiempo.citas_hoy || 0,
          citasSemana: estadisticasTiempo.citas_semana || 0,
          citasMes: estadisticasTiempo.citas_mes || 0,
        });
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      console.error('Error details:', error.message, error.status);

      // Check if it's an authentication error
      if (error.status === 401 || error.message?.includes('Sesión expirada')) {
        Alert.alert(
          'Acceso Denegado',
          'No tienes permisos de administrador para ver estas estadísticas. Contacta al administrador del sistema.',
          [{ text: 'OK', onPress: () => logout() }]
        );
      } else {
        // Fallback to placeholder data if API fails
        setStats({
          totalPacientes: 0,
          totalDoctores: 0,
          totalCitas: 0,
          citasPendientes: 0,
          citasConfirmadas: 0,
          citasRealizadas: 0,
          citasCanceladas: 0,
          citasHoy: 0,
          citasSemana: 0,
          citasMes: 0,
        });
        Alert.alert('Error', 'No se pudieron cargar las estadísticas del servidor. Mostrando datos de demostración.');
      }
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  const QuickAction = ({ title, icon, onPress, color = '#007AFF' }) => (
    <TouchableOpacity style={[styles.actionCard, { borderColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.actionTitle, { color }]}>{title}</Text>
    </TouchableOpacity>
  );

  const handleQuickAction = async (action) => {
    switch (action) {
      case 'Gestionar Pacientes':
        navigation.navigate('AdminPatients');
        break;
      case 'Gestionar Doctores':
        navigation.navigate('AdminDoctors');
        break;
      case 'Ver Citas':
        navigation.navigate('AdminAppointments');
        break;
      case 'Reportes':
        navigation.navigate('AdminReports');
        break;
      case 'Medicamentos':
        navigation.navigate('AdminMedications');
        break;
      default:
        Alert.alert('Funcionalidad en desarrollo', `La acción "${action}" estará disponible próximamente.`);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    loadDashboardStats();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Panel Administrativo</Text>
            <Text style={styles.userName}>{user?.name || 'Administrador'}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Estadísticas Generales</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Pacientes"
              value={stats.totalPacientes}
              icon="people-outline"
              color="#007AFF"
            />
            <StatCard
              title="Total Doctores"
              value={stats.totalDoctores}
              icon="medical-outline"
              color="#34C759"
            />
            <StatCard
              title="Total Citas"
              value={stats.totalCitas}
              icon="calendar-outline"
              color="#FF9500"
            />
            <StatCard
              title="Citas Hoy"
              value={stats.citasHoy}
              icon="today-outline"
              color="#5856D6"
            />
          </View>

          {/* Additional Stats Row */}
          <View style={[styles.statsGrid, { marginTop: 12 }]}>
            <StatCard
              title="Citas Pendientes"
              value={stats.citasPendientes}
              icon="time-outline"
              color="#FF3B30"
            />
            <StatCard
              title="Citas Confirmadas"
              value={stats.citasConfirmadas}
              icon="checkmark-circle-outline"
              color="#34C759"
            />
            <StatCard
              title="Citas Realizadas"
              value={stats.citasRealizadas}
              icon="checkmark-done-circle-outline"
              color="#007AFF"
            />
            <StatCard
              title="Citas Canceladas"
              value={stats.citasCanceladas}
              icon="close-circle-outline"
              color="#8E8E93"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              title="Gestionar Pacientes"
              icon="people-circle-outline"
              onPress={() => handleQuickAction('Gestionar Pacientes')}
            />
            <QuickAction
              title="Gestionar Doctores"
              icon="medical-outline"
              onPress={() => handleQuickAction('Gestionar Doctores')}
            />
            <QuickAction
              title="Ver Citas"
              icon="calendar-outline"
              onPress={() => handleQuickAction('Ver Citas')}
            />
            <QuickAction
              title="Reportes"
              icon="bar-chart-outline"
              onPress={() => handleQuickAction('Reportes')}
            />
            <QuickAction
              title="Medicamentos"
              icon="medkit-outline"
              onPress={() => handleQuickAction('Medicamentos')}
            />

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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  welcomeContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userName: {
    fontSize: 14,
    color: '#666',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutButton: {
    padding: 8,
  },
  statsSection: {
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
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    flex: 1,
    minWidth: '48%', // Slightly larger for better mobile display
    marginBottom: 8,
  },
  statIcon: {
    marginRight: 16,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  activitySection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default AdminDashboard;
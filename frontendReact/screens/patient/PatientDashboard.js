import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  SafeAreaProvider,
  Pressable,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomButton from '../../components/ui/CustomButton';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  // Modal form state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [appointmentTime, setAppointmentTime] = useState(new Date());
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dropdown states
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const appointmentsData = await apiService.getPatientAppointments();
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadModalData = async () => {
    try {
      const [specialtiesData, doctorsData] = await Promise.all([
        apiService.getSpecialties(),
        apiService.getDoctors()
      ]);
      setSpecialties(specialtiesData || []);
      setDoctors(doctorsData || []);
      setFilteredDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error loading modal data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos para el formulario');
    }
  };

  const handleSpecialtyChange = (specialty) => {
    setSelectedSpecialty(specialty);
    if (specialty) {
      const filtered = doctors.filter(doctor =>
        doctor.especialidades && doctor.especialidades.some(spec => spec.id == specialty.id)
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(doctors);
    }
    setSelectedDoctor(null); // Reset doctor selection
    setShowSpecialtyDropdown(false);
  };

  const handleDoctorChange = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorDropdown(false);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setAppointmentDate(selectedDate);
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      // Create a new date with today's date but the selected time
      const now = new Date();
      const timeOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                               selectedTime.getHours(), selectedTime.getMinutes(), 0);
      setAppointmentTime(timeOnly);
    }
  };

  const handleSubmitAppointment = async () => {
    if (!selectedDoctor || !appointmentDate || !appointmentTime) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return;
    }

    setSubmitting(true);
    try {
      // Get paciente ID - fetch if not available
      let pacienteId = user.paciente?.id;
      if (!pacienteId) {
        try {
          const profileData = await apiService.getPatientProfile();
          pacienteId = profileData.id;
        } catch (profileError) {
          console.error('Error fetching patient profile:', profileError);
          Alert.alert('Error', 'No se pudo obtener la información del paciente. Intente iniciar sesión nuevamente.');
          setSubmitting(false);
          return;
        }
      }

      // Create combined datetime object
      const combinedDateTime = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        appointmentDate.getDate(),
        appointmentTime.getHours(),
        appointmentTime.getMinutes(),
        0
      );

      // Send as ISO string to preserve timezone information
      const fecha = combinedDateTime.toISOString();

      const appointmentData = {
        paciente_id: pacienteId,
        medico_id: selectedDoctor.id,
        fecha: fecha,
        motivo: motivo || 'Consulta general',
      };

      await apiService.createAppointment(appointmentData);
      Alert.alert('Éxito', 'Cita solicitada exitosamente');
      setModalVisible(false);
      resetForm();
      loadDashboardData(); // Refresh appointments
    } catch (error) {
      console.error('Error creating appointment:', error);
      Alert.alert('Error', 'No se pudo solicitar la cita. Intente nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSpecialty(null);
    setSelectedDoctor(null);
    setAppointmentDate(new Date());
    setAppointmentTime(new Date());
    setMotivo('');
    setFilteredDoctors(doctors);
  };

  const openModal = () => {
    loadModalData();
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const InfoCard = ({ title, value, icon, color = '#007AFF' }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="#fff" />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardValue}>{value}</Text>
        </View>
      </View>
    </View>
  );

  const AppointmentCard = ({ appointment }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentDate}>
          {new Date(appointment.fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <View style={[styles.statusBadge, getStatusStyle(appointment.estado)]}>
          <Text style={styles.statusText}>{getStatusText(appointment.estado)}</Text>
        </View>
      </View>
      <Text style={styles.appointmentTime}>
        {new Date(appointment.fecha).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
      <Text style={styles.appointmentMotivo}>{appointment.motivo || 'Consulta general'}</Text>
      {appointment.medico && (
        <Text style={styles.appointmentDoctor}>
          Dr. {appointment.medico.user?.name || 'Médico asignado'}
        </Text>
      )}
    </View>
  );

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
        return styles.statusConfirmed;
      case 'cancelada':
        return styles.statusCancelled;
      case 'realizada':
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmada':
        return 'Confirmada';
      case 'cancelada':
        return 'Cancelada';
      case 'realizada':
        return 'Realizada';
      default:
        return 'Pendiente';
    }
  };

  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.fecha) >= new Date() && apt.estado?.toLowerCase() !== 'cancelada'
  );

  const recentAppointments = appointments.filter(apt =>
    new Date(apt.fecha) < new Date() || apt.estado?.toLowerCase() === 'realizada'
  ).slice(0, 3);


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>¡Hola!</Text>
            <Text style={styles.userName}>{user?.name || 'Paciente'}</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <InfoCard
            title="Próximas citas"
            value={upcomingAppointments.length.toString()}
            icon="calendar-outline"
            color="#007AFF"
          />
          <InfoCard
            title="Historial médico"
            value={recentAppointments.length.toString()}
            icon="document-text-outline"
            color="#34C759"
          />
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximas Citas</Text>
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.slice(0, 2).map((appointment) => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No tienes citas próximas</Text>
            </View>
          )}

          {/* Solicitar Nueva Cita */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Solicitar Nueva Cita</Text>
            <CustomButton
              title="Solicitar Cita"
              onPress={openModal}
              backgroundColor="#007AFF"
              textColor="#fff"
            />

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Solicitar Nueva Cita</Text>

                  <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
                    {/* Specialty Selection */}
                    <Text style={styles.label}>Especialidad (Opcional)</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowSpecialtyDropdown(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {selectedSpecialty ? selectedSpecialty.nombre : 'Seleccionar especialidad...'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* Doctor Selection */}
                    <Text style={styles.label}>Médico *</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowDoctorDropdown(true)}
                      disabled={filteredDoctors.length === 0}
                    >
                      <Text style={[styles.dropdownText, filteredDoctors.length === 0 && styles.disabledText]}>
                        {selectedDoctor ? `Dr. ${selectedDoctor.user?.name || 'Médico'}` : 'Seleccionar médico...'}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* Date Selection */}
                    <Text style={styles.label}>Fecha *</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {appointmentDate.toLocaleDateString('es-ES')}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* Time Selection */}
                    <Text style={styles.label}>Hora *</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.dropdownText}>
                        {appointmentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Ionicons name="time-outline" size={20} color="#666" />
                    </TouchableOpacity>

                    {/* Motivo */}
                    <Text style={styles.label}>Motivo de la consulta</Text>
                    <TextInput
                      placeholder="Describa el motivo de la consulta"
                      value={motivo}
                      onChangeText={setMotivo}
                      style={[styles.input, styles.textArea]}
                      multiline
                      numberOfLines={3}
                    />
                  </ScrollView>

                  {/* Specialty Dropdown Modal */}
                  <Modal
                    visible={showSpecialtyDropdown}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowSpecialtyDropdown(false)}
                  >
                    <Pressable
                      style={styles.dropdownOverlay}
                      onPress={() => setShowSpecialtyDropdown(false)}
                    >
                      <View style={styles.dropdownContent}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => handleSpecialtyChange(null)}
                        >
                          <Text style={styles.dropdownItemText}>Todas las especialidades</Text>
                        </TouchableOpacity>
                        {specialties.map((specialty) => (
                          <TouchableOpacity
                            key={specialty.id}
                            style={styles.dropdownItem}
                            onPress={() => handleSpecialtyChange(specialty)}
                          >
                            <Text style={styles.dropdownItemText}>{specialty.nombre}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </Pressable>
                  </Modal>

                  {/* Doctor Dropdown Modal */}
                  <Modal
                    visible={showDoctorDropdown}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowDoctorDropdown(false)}
                  >
                    <Pressable
                      style={styles.dropdownOverlay}
                      onPress={() => setShowDoctorDropdown(false)}
                    >
                      <View style={styles.dropdownContent}>
                        <FlatList
                          data={filteredDoctors}
                          keyExtractor={(item) => item.id.toString()}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleDoctorChange(item)}
                            >
                              <Text style={styles.dropdownItemText}>
                                Dr. {item.user?.name || 'Médico'}
                              </Text>
                            </TouchableOpacity>
                          )}
                          ListEmptyComponent={
                            <Text style={styles.emptyText}>No hay médicos disponibles</Text>
                          }
                        />
                      </View>
                    </Pressable>
                  </Modal>

                  {/* Date Picker */}
                  {showDatePicker && (
                    <DateTimePicker
                      value={appointmentDate}
                      mode="date"
                      display="default"
                      onChange={handleDateChange}
                      minimumDate={new Date()}
                    />
                  )}

                  {/* Time Picker */}
                  {showTimePicker && (
                    <DateTimePicker
                      value={appointmentTime}
                      mode="time"
                      display="default"
                      onChange={handleTimeChange}
                    />
                  )}

                  <View style={styles.buttonContainer}>
                    <CustomButton
                      title="Cancelar"
                      onPress={() => setModalVisible(false)}
                      backgroundColor="#FF3B30"
                      textColor="#fff"
                      style={styles.cancelButton}
                    />
                    <CustomButton
                      title={submitting ? "Solicitando..." : "Solicitar Cita"}
                      onPress={handleSubmitAppointment}
                      backgroundColor="#007AFF"
                      textColor="#fff"
                      disabled={submitting}
                      style={styles.submitButton}
                    />
                  </View>
                </View>
              </View>
            </Modal>
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
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 16,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  statusPending: {
    backgroundColor: '#FF9500',
  },
  statusConfirmed: {
    backgroundColor: '#34C759',
  },
  statusCancelled: {
    backgroundColor: '#FF3B30',
  },
  statusCompleted: {
    backgroundColor: '#007AFF',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  appointmentMotivo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  appointmentDoctor: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    maxHeight: 800,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
  },
  submitButton: {
    flex: 1,
    marginLeft: 10,
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  disabledText: {
    color: '#ccc',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: '50%',
    width: '80%',
    elevation: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default PatientDashboard;
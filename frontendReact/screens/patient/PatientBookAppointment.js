import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';

const PatientBookAppointment = ({ navigation }) => {
  const { user } = useAuth();

  const [specialties, setSpecialties] = useState([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    filterDoctorsBySpecialty();
  }, [doctors, selectedSpecialty]);

  const loadSpecialties = async () => {
    try {
      const specialtiesData = await apiService.getSpecialties();
      setSpecialties(specialtiesData || []);
      setFilteredSpecialties(specialtiesData || []);
    } catch (error) {
      console.error('Error loading specialties:', error);
      Alert.alert('Error', 'No se pudieron cargar las especialidades');
    }
  };

  const loadDoctors = async () => {
    try {
      const doctorsData = await apiService.request('/medicos');
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert('Error', 'No se pudieron cargar los médicos');
    }
  };

  const filterDoctorsBySpecialty = () => {
    if (!selectedSpecialty) {
      setFilteredDoctors([]);
      return;
    }
    const filtered = doctors.filter(
      (doctor) => doctor.especialidad === selectedSpecialty.nombre
    );
    setFilteredDoctors(filtered);
  };

  const loadAvailableSlots = async (doctorId, date) => {
    try {
      setLoading(true);
      const response = await apiService.getAvailableSlots(doctorId, date);
      // Remove duplicates and sort slots
      const uniqueSlots = [...new Set(response.available_slots || [])].sort();
      setAvailableSlots(uniqueSlots);
      console.log('Available slots for', date, ':', uniqueSlots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
      Alert.alert('Error', 'No se pudieron cargar los horarios disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtySelect = async (specialty) => {
    setSelectedSpecialty(specialty);
    setSpecialtyModalVisible(false);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
    if (doctors.length === 0) {
      await loadDoctors();
    }
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (selectedDoctor) {
      loadAvailableSlots(selectedDoctor.id, date);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !motivo.trim()) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }
    try {
      setLoading(true);
      const appointmentData = {
        paciente_id: user.paciente?.id,
        medico_id: selectedDoctor.id,
        fecha: `${selectedDate} ${selectedSlot}:00`,
        motivo: motivo.trim(),
      };
      await apiService.createAppointment(appointmentData);

      // Clear all form state
      setSelectedSpecialty(null);
      setSelectedDoctor(null);
      setSelectedDate(null);
      setSelectedSlot(null);
      setMotivo('');
      setAvailableSlots([]);
      setFilteredDoctors([]);

      Alert.alert(
        'Éxito',
        'Cita agendada correctamente. Espera la confirmación del médico.',
        [{ text: 'OK', onPress: () => navigation.navigate('PatientAppointments') }]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'No se pudo agendar la cita. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderSelector = (field, label, placeholder, value, onPress, displayValue) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.selector, errors[field] && styles.selectorError]}
        onPress={onPress}
      >
        <Text style={[styles.selectorText, !value && styles.selectorPlaceholder]}>
          {displayValue || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  const generateNextDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDate = (date) => date.toISOString().split('T')[0];
  const formatDisplayDate = (date) =>
    date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

  const nextDates = generateNextDates();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.navigate('PatientAppointments')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Solicitar Cita Médica</Text>
            <Text style={styles.headerSubtitle}>Proceso guiado en 5 pasos</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Cancelar Solicitud',
                '¿Estás seguro de que quieres salir sin agendar la cita?',
                [
                  { text: 'No, continuar', style: 'cancel' },
                  { text: 'Sí, salir', style: 'destructive', onPress: () => navigation.navigate('PatientAppointments') }
                ]
              );
            }}
            style={styles.cancelButton}
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressStep,
                (selectedSpecialty ||
                  selectedDoctor ||
                  selectedDate ||
                  selectedSlot) &&
                styles.progressStepActive,
              ]}
            />
            <View
              style={[
                styles.progressStep,
                (selectedDoctor || selectedDate || selectedSlot) &&
                styles.progressStepActive,
              ]}
            />
            <View
              style={[
                styles.progressStep,
                (selectedDate || selectedSlot) && styles.progressStepActive,
              ]}
            />
            <View
              style={[
                styles.progressStep,
                selectedSlot && styles.progressStepActive,
              ]}
            />
            <View
              style={[
                styles.progressStep,
                selectedSlot && styles.progressStepActive,
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Paso{' '}
            {selectedSpecialty
              ? selectedDoctor
                ? selectedDate
                  ? selectedSlot
                    ? '5'
                    : '4'
                  : '3'
                : '2'
              : '1'}{' '}
            de 5
          </Text>
        </View>

        {/* Step 1: Select Specialty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Profesional</Text>

          {renderSelector(
            'especialidad',
            'Especialidad Médica',
            'Seleccionar especialidad...',
            selectedSpecialty,
            () => setSpecialtyModalVisible(true),
            selectedSpecialty ? selectedSpecialty.nombre : null
          )}
        </View>

        {/* Step 2: Select Doctor */}
        {selectedSpecialty && (
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="person" size={20} color="#007AFF" /> Seleccionar
                  Médico
                </Text>
                <Text style={styles.stepDescription}>
                  Elige el médico especialista para tu consulta
                </Text>
              </View>
            </View>

            {filteredDoctors.length > 0 ? (
              <View style={styles.doctorsList}>
                {filteredDoctors.map((item) => (
                  <TouchableOpacity
                    key={item.id.toString()}
                    style={[
                      styles.doctorCard,
                      selectedDoctor?.id === item.id && styles.doctorCardSelected,
                    ]}
                    onPress={() => handleDoctorSelect(item)}
                  >
                    <View style={styles.doctorInfo}>
                      <Text style={styles.doctorName}>Dr. {item.user?.name || 'Nombre no disponible'}</Text>
                      <Text style={styles.doctorSpecialty}>{item.especialidad}</Text>
                      <Text style={styles.doctorPhone}>📞 {item.telefono}</Text>
                    </View>
                    {selectedDoctor?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No hay médicos disponibles para esta especialidad
              </Text>
            )}
          </View>
        )}

        {/* Step 3: Select Date */}
        {selectedDoctor && (
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="calendar" size={20} color="#007AFF" /> Seleccionar
                  Fecha
                </Text>
                <Text style={styles.stepDescription}>
                  Elige la fecha para tu cita médica
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.dateContainer}>
                {nextDates.map((date, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dateCard,
                      selectedDate === formatDate(date) && styles.dateCardSelected,
                    ]}
                    onPress={() => handleDateSelect(formatDate(date))}
                  >
                    <Text style={[
                      styles.dateDay,
                      selectedDate === formatDate(date) && styles.dateDaySelected,
                    ]}>
                      {formatDisplayDate(date).split(' ')[0]}
                    </Text>
                    <Text style={[
                      styles.dateNumber,
                      selectedDate === formatDate(date) && styles.dateNumberSelected,
                    ]}>
                      {formatDisplayDate(date).split(' ')[1]}
                    </Text>
                    <Text style={[
                      styles.dateMonth,
                      selectedDate === formatDate(date) && styles.dateMonthSelected,
                    ]}>
                      {formatDisplayDate(date).split(' ')[2]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Step 4: Select Time Slot */}
        {selectedDate && (
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="time" size={20} color="#007AFF" /> Seleccionar
                  Horario
                </Text>
                <Text style={styles.stepDescription}>
                  Elige el horario disponible para tu cita
                </Text>
              </View>
            </View>

            {loading ? (
              <Text style={styles.loadingText}>Cargando horarios...</Text>
            ) : availableSlots.length > 0 ? (
              <View style={styles.slotsContainer}>
                {availableSlots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.slotCard,
                      selectedSlot === slot && styles.slotCardSelected,
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[
                      styles.slotText,
                      selectedSlot === slot && styles.slotTextSelected,
                    ]}>
                      {slot}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No hay horarios disponibles para esta fecha
              </Text>
            )}
          </View>
        )}

        {/* Step 5: Appointment Details */}
        {selectedSlot && (
          <View style={styles.section}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.sectionTitle}>
                  <Ionicons name="document-text" size={20} color="#007AFF" /> Detalles
                  de la Cita
                </Text>
                <Text style={styles.stepDescription}>
                  Describe el motivo de tu consulta
                </Text>
              </View>
            </View>

            <TextInput
              style={styles.motivoInput}
              placeholder="Describe el motivo de tu consulta..."
              value={motivo}
              onChangeText={setMotivo}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Resumen de la Cita:</Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Especialidad:</Text> {selectedSpecialty.nombre}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Médico:</Text> Dr. {selectedDoctor.user?.name}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Fecha:</Text> {selectedDate}
              </Text>
              <Text style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Hora:</Text> {selectedSlot}:00
              </Text>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBookAppointment}
            >
              <Text style={styles.bookButtonText}>Agendar Cita</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Specialty Selection Modal */}
      <Modal visible={specialtyModalVisible} animationType="slide" transparent={true} onRequestClose={() => setSpecialtyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Especialidad</Text>
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar especialidad..."
              placeholderTextColor="#999"
              onChangeText={text => {
                if (!text.trim()) {
                  setFilteredSpecialties(specialties);
                } else {
                  setFilteredSpecialties(
                    specialties.filter(s => s.nombre.toLowerCase().includes(text.toLowerCase())),
                  );
                }
              }}
            />

            {/* Lista de especialidades */}
            <FlatList
              data={filteredSpecialties}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    selectedSpecialty?.id === item.id && { backgroundColor: '#f0f8ff' },
                  ]}
                  onPress={() => handleSpecialtySelect(item)}
                >
                  <Ionicons name="medkit-outline" size={20} color="#007AFF" style={{ marginRight: 10 }} />
                  <Text style={styles.specialtyName}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron especialidades</Text>}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: { padding: 8 },
  cancelButton: { padding: 8 },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  headerSubtitle: { fontSize: 14, color: '#666' },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressStep: {
    flex: 1,
    height: 3,
    backgroundColor: '#ddd',
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  progressStepActive: { backgroundColor: '#007AFF' },
  progressText: { fontSize: 12, color: '#666', fontWeight: '500' },
  stepHeader: { flexDirection: 'row', marginBottom: 16 },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  stepContent: { flex: 1 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepDescription: { fontSize: 14, color: '#666', marginTop: 4 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 4,
  },
  specialtyName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
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
  selector: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorError: {
    borderColor: '#FF3B30',
  },
  selectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectorPlaceholder: {
    color: '#999',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 32,
  },
  // Doctor selection styles
  doctorsList: {
    maxHeight: 300, // Limit height to prevent excessive scrolling
  },
  doctorCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  doctorPhone: {
    fontSize: 14,
    color: '#666',
  },
  // Date selection styles
  dateContainer: {
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  dateCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
    minWidth: 70,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dateDay: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  dateDaySelected: {
    color: '#fff',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 2,
  },
  dateNumberSelected: {
    color: '#fff',
  },
  dateMonth: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  dateMonthSelected: {
    color: '#fff',
  },
  // Time slot styles
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    padding: 20,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  slotText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  slotTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Appointment details styles
  motivoInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 20,
    minHeight: 100,
  },
  summaryContainer: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PatientBookAppointment;

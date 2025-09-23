import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/api/api';
import CustomButton from '../../components/ui/CustomButton';

const PatientBookAppointment = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const doctorsData = await apiService.request('/medicos');
      setDoctors(doctorsData || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      Alert.alert('Error', 'No se pudieron cargar los médicos');
    }
  };

  const loadAvailableSlots = async (doctorId, date) => {
    try {
      setLoading(true);
      const response = await apiService.getAvailableSlots(doctorId, date);
      setAvailableSlots(response.available_slots || []);
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
      Alert.alert('Error', 'No se pudieron cargar los horarios disponibles');
    } finally {
      setLoading(false);
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
        medico_id: selectedDoctor.id,
        fecha: `${selectedDate} ${selectedSlot}:00`,
        motivo: motivo.trim(),
      };

      await apiService.createAppointment(appointmentData);
      Alert.alert(
        'Éxito',
        'Cita agendada correctamente. Espera la confirmación del médico.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'No se pudo agendar la cita. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const generateNextDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 14; i++) { // Next 14 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const nextDates = generateNextDates();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Agendar Cita</Text>
            <Text style={styles.headerSubtitle}>Selecciona médico y horario</Text>
          </View>
        </View>

        {/* Step 1: Select Doctor */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="medical" size={20} color="#007AFF" />
            {' '}Paso 1: Seleccionar Médico
          </Text>

          {doctors.length > 0 ? (
            <View style={styles.doctorsGrid}>
              {doctors.map(doctor => (
                <TouchableOpacity
                  key={doctor.id}
                  style={[
                    styles.doctorCard,
                    selectedDoctor?.id === doctor.id && styles.doctorCardSelected,
                  ]}
                  onPress={() => handleDoctorSelect(doctor)}
                >
                  <View style={styles.doctorAvatar}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                  </View>
                  <Text style={styles.doctorName}>{doctor.user?.name || 'Médico'}</Text>
                  <Text style={styles.doctorSpecialty}>
                    {doctor.especialidad || 'General'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medical" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No hay médicos disponibles</Text>
            </View>
          )}
        </View>

        {/* Step 2: Select Date */}
        {selectedDoctor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="calendar" size={20} color="#007AFF" />
              {' '}Paso 2: Seleccionar Fecha
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
              {nextDates.map(date => (
                <TouchableOpacity
                  key={formatDate(date)}
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
                    {formatDisplayDate(date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 3: Select Time Slot */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="time" size={20} color="#007AFF" />
              {' '}Paso 3: Seleccionar Horario
            </Text>

            {loading ? (
              <View style={styles.loadingState}>
                <Ionicons name="hourglass" size={24} color="#007AFF" />
                <Text style={styles.loadingText}>Cargando horarios disponibles...</Text>
              </View>
            ) : availableSlots.length > 0 ? (
              <View style={styles.slotsGrid}>
                {availableSlots.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.slotCard,
                      selectedSlot === slot && styles.slotCardSelected,
                    ]}
                    onPress={() => setSelectedSlot(slot)}
                  >
                    <Text style={[
                      styles.slotTime,
                      selectedSlot === slot && styles.slotTimeSelected,
                    ]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color="#ccc" />
                <Text style={styles.emptyStateText}>
                  No hay horarios disponibles para esta fecha
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Selecciona otra fecha o contacta al médico
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Step 4: Appointment Details */}
        {selectedSlot && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="document-text" size={20} color="#007AFF" />
              {' '}Paso 4: Detalles de la Cita
            </Text>

            <View style={styles.appointmentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Médico:</Text>
                <Text style={styles.summaryValue}>{selectedDoctor?.user?.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fecha:</Text>
                <Text style={styles.summaryValue}>
                  {selectedDate ? new Date(selectedDate).toLocaleDateString('es-ES') : ''}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Hora:</Text>
                <Text style={styles.summaryValue}>{selectedSlot}</Text>
              </View>
            </View>

            <Text style={styles.label}>Motivo de la consulta *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Describe brevemente el motivo de tu consulta..."
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <CustomButton
              title="Agendar Cita"
              onPress={handleBookAppointment}
              backgroundColor="#007AFF"
              textColor="#fff"
              loading={loading}
              style={styles.bookButton}
            />
          </View>
        )}
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  doctorCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  doctorCardSelected: {
    borderColor: '#007AFF',
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  datesScroll: {
    marginBottom: 8,
  },
  dateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateCardSelected: {
    borderColor: '#007AFF',
  },
  dateDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  dateDaySelected: {
    color: '#007AFF',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  slotTimeSelected: {
    color: '#007AFF',
  },
  appointmentSummary: {
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  bookButton: {
    marginTop: 8,
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
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default PatientBookAppointment;
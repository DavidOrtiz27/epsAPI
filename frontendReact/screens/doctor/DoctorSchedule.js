import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import CustomButton from '../../components/ui/CustomButton';

const DoctorSchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  
  // Estados para los time pickers
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  
  const [formData, setFormData] = useState({
    dia_semana: 'lunes',
    hora_inicio: '',
    hora_fin: '',
  });

  const daysOfWeek = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' },
  ];

  useEffect(() => {
    loadDoctorProfile();
    loadSchedules();
  }, []);

  const loadDoctorProfile = async () => {
    try {
      const response = await apiService.request('/medicos/profile');
      console.log('🔍 Doctor profile loaded:', response);
      setDoctorProfile(response);
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await apiService.request('/medicos/horarios');
      setSchedules(response || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      Alert.alert('Error', 'No se pudieron cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    console.log('🔍 Debugging - User object:', user);
    console.log('🔍 Debugging - User.medico:', user.medico);
    console.log('🔍 Debugging - Doctor profile:', doctorProfile);
    console.log('🔍 Debugging - User.id:', user.id);
    
    if (!formData.hora_inicio || !formData.hora_fin) {
      Alert.alert('Error', 'Debe ingresar hora de inicio y fin');
      return;
    }

    if (formData.hora_inicio >= formData.hora_fin) {
      Alert.alert('Error', 'La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Obtener el medico_id de manera más robusta
    let medico_id = null;
    
    if (doctorProfile?.id) {
      medico_id = doctorProfile.id;
    } else if (user.medico?.id) {
      medico_id = user.medico.id;
    } else if (user.id) {
      // Si no hay relación medico, usar el user_id directamente
      medico_id = user.id;
    }
    
    console.log('🔍 Debugging - medico_id to use:', medico_id);
    
    if (!medico_id) {
      Alert.alert('Error', 'No se pudo obtener el ID del médico. Inténtelo de nuevo.');
      return;
    }

    try {
      const scheduleData = {
        medico_id: medico_id,
        ...formData,
      };
      
      console.log('🔍 Debugging - Schedule data to send:', scheduleData);

      if (editingSchedule) {
        await apiService.request(`/medicos/horarios/${editingSchedule.id}`, {
          method: 'PUT',
          body: JSON.stringify(scheduleData),
        });
        Alert.alert('Éxito', 'Horario actualizado correctamente');
      } else {
        await apiService.request('/medicos/horarios', {
          method: 'POST',
          body: JSON.stringify(scheduleData),
        });
        Alert.alert('Éxito', 'Horario creado correctamente');
      }

      setShowScheduleModal(false);
      setEditingSchedule(null);
      resetForm();
      loadSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      Alert.alert('Error', 'No se pudo guardar el horario');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    Alert.alert(
      'Eliminar Horario',
      '¿Estás seguro de que quieres eliminar este horario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.request(`/medicos/horarios/${scheduleId}`, {
                method: 'DELETE',
              });
              Alert.alert('Éxito', 'Horario eliminado correctamente');
              loadSchedules();
            } catch (error) {
              console.error('Error deleting schedule:', error);
              Alert.alert('Error', 'No se pudo eliminar el horario');
            }
          },
        },
      ]
    );
  };

  const handleEditSchedule = (schedule) => {
    setEditingSchedule(schedule);
    const horaInicio = schedule.hora_inicio ? schedule.hora_inicio.substring(0, 5) : '';
    const horaFin = schedule.hora_fin ? schedule.hora_fin.substring(0, 5) : '';
    
    setFormData({
      dia_semana: schedule.dia_semana,
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });
    
    // Configurar los time pickers con las horas existentes
    if (horaInicio) {
      setStartTime(timeStringToDate(horaInicio));
    }
    if (horaFin) {
      setEndTime(timeStringToDate(horaFin));
    }
    
    setShowScheduleModal(true);
  };

  const resetForm = () => {
    setFormData({
      dia_semana: 'lunes',
      hora_inicio: '',
      hora_fin: '',
    });
    // Reset time pickers to default times (9:00 AM y 5:00 PM)
    setStartTime(new Date(2024, 0, 1, 9, 0)); // 9:00 AM
    setEndTime(new Date(2024, 0, 1, 17, 0)); // 5:00 PM
  };

  // Funciones para manejar los time pickers
  const handleStartTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    
    if (selectedTime) {
      setStartTime(selectedTime);
      // Guardar en formato 24h para el backend
      const timeString24h = selectedTime.toTimeString().substring(0, 5);
      setFormData(prev => ({ ...prev, hora_inicio: timeString24h }));
      
      // En iOS, cerrar automáticamente después de seleccionar
      if (Platform.OS === 'ios') {
        setTimeout(() => setShowStartTimePicker(false), 100);
      }
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    
    if (selectedTime) {
      setEndTime(selectedTime);
      // Guardar en formato 24h para el backend
      const timeString24h = selectedTime.toTimeString().substring(0, 5);
      setFormData(prev => ({ ...prev, hora_fin: timeString24h }));
      
      // En iOS, cerrar automáticamente después de seleccionar
      if (Platform.OS === 'ios') {
        setTimeout(() => setShowEndTimePicker(false), 100);
      }
    }
  };

  const openStartTimePicker = () => {
    setShowStartTimePicker(true);
  };

  const openEndTimePicker = () => {
    setShowEndTimePicker(true);
  };

  // Función para convertir string de hora a Date object
  const timeStringToDate = (timeString) => {
    if (!timeString) return new Date(2024, 0, 1, 9, 0);
    const [hours, minutes] = timeString.split(':');
    return new Date(2024, 0, 1, parseInt(hours), parseInt(minutes));
  };

  // Función para convertir de formato 24h a 12h (AM/PM)
  const formatTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Función para convertir de formato 12h (AM/PM) a 24h
  const formatTo24Hour = (time12) => {
    if (!time12) return '';
    const timeString = time12.replace(/\s?(AM|PM)/i, '');
    const isPM = /PM/i.test(time12);
    const [hours, minutes] = timeString.split(':');
    let hour = parseInt(hours);
    
    if (isPM && hour !== 12) hour += 12;
    if (!isPM && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const getDayLabel = (dayKey) => {
    return daysOfWeek.find(day => day.key === dayKey)?.label || dayKey;
  };

  const groupSchedulesByDay = () => {
    const grouped = {};
    schedules.forEach(schedule => {
      if (!grouped[schedule.dia_semana]) {
        grouped[schedule.dia_semana] = [];
      }
      grouped[schedule.dia_semana].push(schedule);
    });
    return grouped;
  };

  const groupedSchedules = groupSchedulesByDay();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="time-outline" size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Cargando horarios...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Mis Horarios</Text>
            <Text style={styles.subtitle}>
              {doctorProfile ? 'Gestiona tu disponibilidad' : 'Cargando perfil...'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (!doctorProfile?.id) {
                Alert.alert(
                  'Error', 
                  'Cargando perfil del médico. Inténtelo en unos segundos.',
                  [{ text: 'Aceptar' }]
                );
                return;
              }
              resetForm();
              setEditingSchedule(null);
              setShowScheduleModal(true);
            }}
            style={[
              styles.addButton,
              !doctorProfile && styles.addButtonDisabled
            ]}
            disabled={!doctorProfile}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Schedules by Day */}
        {daysOfWeek.map(day => (
          <View key={day.key} style={styles.daySection}>
            <Text style={styles.dayTitle}>{day.label}</Text>
            {groupedSchedules[day.key]?.length > 0 ? (
              groupedSchedules[day.key].map(schedule => (
                <View key={schedule.id} style={styles.scheduleCard}>
                  <View style={styles.scheduleInfo}>
                    <Ionicons name="time-outline" size={20} color="#666" />
                    <Text style={styles.scheduleTime}>
                      {formatTo12Hour(schedule.hora_inicio?.substring(0, 5))} - {formatTo12Hour(schedule.hora_fin?.substring(0, 5))}
                    </Text>
                  </View>
                  <View style={styles.scheduleActions}>
                    <TouchableOpacity
                      onPress={() => handleEditSchedule(schedule)}
                      style={styles.editButtonSmall}
                    >
                      <Ionicons name="pencil" size={16} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteSchedule(schedule.id)}
                      style={styles.deleteButtonSmall}
                    >
                      <Ionicons name="trash" size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyDay}>
                <Text style={styles.emptyDayText}>Sin horarios programados</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowScheduleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSchedule ? 'Editar Horario' : 'Nuevo Horario'}
            </Text>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Día de la Semana</Text>
              <View style={styles.daySelector}>
                {daysOfWeek.map(day => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.dayOption,
                      formData.dia_semana === day.key && styles.dayOptionSelected,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, dia_semana: day.key }))}
                  >
                    <Text
                      style={[
                        styles.dayOptionText,
                        formData.dia_semana === day.key && styles.dayOptionTextSelected,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Hora de Inicio</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={openStartTimePicker}
              >
                <Text style={styles.timePickerText}>
                  {formData.hora_inicio ? formatTo12Hour(formData.hora_inicio) : 'Seleccionar hora de inicio'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
              </TouchableOpacity>

              <Text style={styles.label}>Hora de Fin</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={openEndTimePicker}
              >
                <Text style={styles.timePickerText}>
                  {formData.hora_fin ? formatTo12Hour(formData.hora_fin) : 'Seleccionar hora de fin'}
                </Text>
                <Ionicons name="time-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancelar"
                onPress={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                  resetForm();
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title={editingSchedule ? "Actualizar" : "Guardar"}
                onPress={handleSaveSchedule}
                backgroundColor="#007AFF"
                textColor="#fff"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
        
        {/* Time Pickers */}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartTimeChange}
          />
        )}
        
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndTimeChange}
          />
        )}
      </Modal>
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
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
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
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  addButton: {
    padding: 8,
  },
  daySection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scheduleTime: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButtonSmall: {
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
  },
  deleteButtonSmall: {
    padding: 8,
    backgroundColor: '#ffeaea',
    borderRadius: 6,
  },
  emptyDay: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  daySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dayOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  dayOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dayOptionText: {
    fontSize: 14,
    color: '#666',
  },
  dayOptionTextSelected: {
    color: '#fff',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  timePickerButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  timePickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
});

export default DoctorSchedule;
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../utils/context/AuthContext';
import apiService from '../../services/api/api';
import { CommonActions } from '@react-navigation/native';
import CustomButton from '../../components/ui/CustomButton';

const DoctorAppointmentDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { appointmentId } = route.params;

  const [appointment, setAppointment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [medicalRecords, setMedicalRecords] = useState([]);

  // Modal states
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showTreatmentPrescriptionModal, setShowTreatmentPrescriptionModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);

  // Form states
  const [medicalRecordForm, setMedicalRecordForm] = useState({
    diagnostico: '',
    observaciones: '',
  });
  const [treatmentForm, setTreatmentForm] = useState({
    descripcion: '',
    fecha_inicio: new Date(),
    duracion_dias: '',
  });
  const [prescriptionForm, setPrescriptionForm] = useState({
    selectedMedicamento: null,
    dosis: '',
    frecuencia: '',
    duracion_dias: '',
    instrucciones: '',
  });
  const [examForm, setExamForm] = useState({
    tipo: '',
    descripcion: '',
  });
  const [treatmentPrescriptionForm, setTreatmentPrescriptionForm] = useState({
    // Treatment fields
    descripcionTratamiento: '',
    fecha_inicio: new Date(),
    // Prescription fields
    selectedMedicamento: null,
    dosis: '',
    frecuencia: '',
    duracion_dias: '', // Combined duration for both treatment and prescription
    instrucciones: '',
  });
  const [editAppointmentForm, setEditAppointmentForm] = useState({
    fecha: new Date(),
    hora: new Date(),
    motivo: '',
  });

  // Data states
  const [medicamentos, setMedicamentos] = useState([]);
  const [filteredMedicamentos, setFilteredMedicamentos] = useState([]);

  // Lista de medicamentos comunes para desarrollo/testing
  const medicamentosComunes = [
    { id: 1, nombre: 'Paracetamol 500mg', descripcion: 'Analgésico y antipirético' },
    { id: 2, nombre: 'Ibuprofeno 400mg', descripcion: 'Antiinflamatorio no esteroideo' },
    { id: 3, nombre: 'Amoxicilina 500mg', descripcion: 'Antibiótico de amplio espectro' },
    { id: 4, nombre: 'Omeprazol 20mg', descripcion: 'Inhibidor de la bomba de protones' },
    { id: 5, nombre: 'Loratadina 10mg', descripcion: 'Antihistamínico' },
    { id: 6, nombre: 'Metformina 850mg', descripcion: 'Antidiabético oral' },
    { id: 7, nombre: 'Enalapril 10mg', descripcion: 'Inhibidor de la ECA' },
    { id: 8, nombre: 'Aspirina 100mg', descripcion: 'Antiagregante plaquetario' },
    { id: 9, nombre: 'Simvastatina 20mg', descripcion: 'Estatina para colesterol' },
    { id: 10, nombre: 'Prednisona 5mg', descripcion: 'Corticosteroide' },
  ];

  // Date/Time picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showTreatmentDatePicker, setShowTreatmentDatePicker] = useState(false);
  const [showTreatmentPrescriptionDatePicker, setShowTreatmentPrescriptionDatePicker] = useState(false);
  const [showMedicamentoDropdown, setShowMedicamentoDropdown] = useState(false);
  const [showMedicamentoDropdownTP, setShowMedicamentoDropdownTP] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: null,
    });
  }, [navigation]);

  useEffect(() => {
    checkAuthentication();
    loadAppointmentData();
  }, [appointmentId]);

  const checkAuthentication = async () => {
    try {
      const isAuth = await apiService.isAuthenticated();
      if (!isAuth) {
        Alert.alert('Sesión requerida', 'Debes iniciar sesión para acceder a esta funcionalidad.');
        logout();
        return;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      logout();
    }
  };

  const loadAppointmentData = async () => {
    try {
      const appointmentData = await apiService.getAppointment(appointmentId);
      setAppointment(appointmentData);
      setPatient(appointmentData.paciente);

      // Load medical records for this patient
      if (appointmentData.paciente?.id) {
        try {
          const records = await apiService.request(`/medicos/pacientes/${appointmentData.paciente.id}/historial`);
          setMedicalRecords(records || []);
        } catch (error) {
          console.error('Error loading medical records:', error);
        }
      }

      // Initialize edit form with current data
      if (appointmentData.fecha) {
        const fecha = new Date(appointmentData.fecha);
        setEditAppointmentForm({
          fecha: fecha,
          hora: fecha,
          motivo: appointmentData.motivo || '',
        });
      }
    } catch (error) {
      console.error('Error loading appointment:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la cita');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiService.updateAppointmentStatus(appointmentId, newStatus);
      Alert.alert('Éxito', 'Estado de la cita actualizado correctamente');

      // If marking as completed, navigate back to appointments list
      if (newStatus === 'realizada') {
        navigation.goBack();
        return;
      }

      loadAppointmentData(); // Refresh data for other status changes
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.sessionExpired) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleCreateMedicalRecord = async () => {
    if (!medicalRecordForm.diagnostico.trim()) {
      Alert.alert('Error', 'El diagnóstico es obligatorio');
      return;
    }

    try {
      const recordData = {
        paciente_id: patient.id,
        cita_id: appointmentId,
        diagnostico: medicalRecordForm.diagnostico,
        observaciones: medicalRecordForm.observaciones,
      };

      await apiService.createMedicalRecord(recordData);
      Alert.alert('Éxito', 'Registro médico creado correctamente');
      setShowMedicalRecordModal(false);
      setMedicalRecordForm({ diagnostico: '', observaciones: '' });
      loadAppointmentData(); // Refresh medical records
    } catch (error) {
      console.error('Error creating medical record:', error);
      Alert.alert('Error', 'No se pudo crear el registro médico');
    }
  };

  const handleCreateTreatment = async () => {
    if (!treatmentForm.descripcion.trim()) {
      Alert.alert('Error', 'La descripción del tratamiento es obligatoria');
      return;
    }

    try {
      // First, ensure there's a medical record for this patient
      let historialId = null;

      if (medicalRecords.length > 0) {
        // Use the most recent medical record
        historialId = medicalRecords[0].id;
      } else {
        // Create a new medical record first
        try {
          const medicalRecordData = {
            paciente_id: patient.id,
            diagnostico: 'Consulta en proceso',
            observaciones: 'Registro creado automáticamente para tratamiento',
          };

          const newRecord = await apiService.createMedicalRecord(medicalRecordData);
          historialId = newRecord.id;

          // Refresh medical records
          const updatedRecords = await apiService.request(`/medicos/pacientes/${patient.id}/historial`);
          setMedicalRecords(updatedRecords || []);
        } catch (recordError) {
          console.error('Error creating medical record:', recordError);
          Alert.alert('Error', 'No se pudo crear el registro médico necesario para el tratamiento');
          return;
        }
      }

      // Now create the treatment
      const treatmentData = {
        historial_id: historialId,
        descripcion: treatmentForm.descripcion,
        fecha_inicio: treatmentForm.fecha_inicio.toISOString().split('T')[0],
      };

      // Calculate fecha_fin if duracion_dias is provided
      if (treatmentForm.duracion_dias && !isNaN(parseInt(treatmentForm.duracion_dias))) {
        try {
          const fechaInicio = new Date(treatmentForm.fecha_inicio);
          const fechaFin = new Date(fechaInicio.getTime() + (parseInt(treatmentForm.duracion_dias) * 24 * 60 * 60 * 1000));
          treatmentData.fecha_fin = fechaFin.toISOString().split('T')[0];
        } catch (dateError) {
          console.error('Error calculating end date:', dateError);
          // Don't set fecha_fin if calculation fails
        }
      }

      await apiService.createTreatment(treatmentData);
      Alert.alert('Éxito', 'Tratamiento creado correctamente');
      setShowTreatmentModal(false);
      setTreatmentForm({
        descripcion: '',
        fecha_inicio: new Date(),
        duracion_dias: '',
      });
    } catch (error) {
      console.error('Error creating treatment:', error);
      Alert.alert('Error', 'No se pudo crear el tratamiento');
    }
  };

  const handleCreatePrescription = async () => {
    if (!prescriptionForm.selectedMedicamento || !prescriptionForm.dosis.trim()) {
      Alert.alert('Error', 'Debe seleccionar un medicamento y especificar la dosis');
      return;
    }

    try {
      // For now, we'll create a basic treatment if none exists
      // In a real implementation, prescriptions should be linked to specific treatments
      let tratamientoId = null;

      // Try to find an existing treatment for this patient
      try {
        // Check if user is authenticated
        const isAuth = await apiService.isAuthenticated();
        if (!isAuth) {
          Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          logout();
          return;
        }

        const treatmentsResponse = await apiService.getTreatments();
        const patientTreatments = treatmentsResponse.filter(t =>
          t.historialClinico && t.historialClinico.paciente_id == patient.id
        );

        if (patientTreatments.length > 0) {
          // Use the most recent treatment
          tratamientoId = patientTreatments.sort((a, b) =>
            new Date(b.created_at || b.fecha_inicio) - new Date(a.created_at || a.fecha_inicio)
          )[0].id;
        } else {
          // Try to create a basic treatment
          try {
            const basicTreatmentData = {
              historial_id: medicalRecords.length > 0 ? medicalRecords[0].id : null,
              descripcion: 'Tratamiento básico para receta médica',
              fecha_inicio: new Date().toISOString().split('T')[0],
            };

            if (basicTreatmentData.historial_id) {
              const newTreatment = await apiService.createTreatment(basicTreatmentData);
              tratamientoId = newTreatment.id;
            } else {
              // If no medical record, create one first
              try {
                const medicalRecordData = {
                  paciente_id: patient.id,
                  diagnostico: 'Consulta para receta médica',
                  observaciones: 'Registro creado automáticamente',
                };
                const newRecord = await apiService.createMedicalRecord(medicalRecordData);
                basicTreatmentData.historial_id = newRecord.id;
                const newTreatment = await apiService.createTreatment(basicTreatmentData);
                tratamientoId = newTreatment.id;
              } catch (recordError) {
                console.error('Error creating medical record:', recordError);
                if (recordError.status === 401 || recordError.status === 403) {
                  Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                  logout();
                  return;
                }
                // Continue without treatment - create prescription directly
                tratamientoId = null;
              }
            }
          } catch (createTreatmentError) {
            console.error('Error creating treatment:', createTreatmentError);
            if (createTreatmentError.status === 401 || createTreatmentError.status === 403) {
              Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
              logout();
              return;
            }
            // Continue without treatment
            tratamientoId = null;
          }
        }
      } catch (treatmentError) {
        console.error('Error loading treatments:', treatmentError);
        if (treatmentError.status === 401 || treatmentError.status === 403) {
          Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          logout();
          return;
        }
        // Continue without treatment
        tratamientoId = null;
      }

      if (!tratamientoId) {
        Alert.alert(
          'Tratamiento requerido',
          'Para crear una receta médica, primero debe crear un tratamiento. Use el botón "Tratamiento" para crear uno.',
          [{ text: 'Entendido' }]
        );
        return;
      }

      const medicamentoId = prescriptionForm.selectedMedicamento.id.toString();

      const prescriptionData = {
        tratamiento_id: tratamientoId,
        medicamento_id: medicamentoId,
        dosis: prescriptionForm.dosis,
        frecuencia: prescriptionForm.frecuencia,
        duracion: prescriptionForm.duracion_dias ? `${prescriptionForm.duracion_dias} días` : null,
      };

      await apiService.createPrescription(prescriptionData);
      Alert.alert('Éxito', 'Receta médica creada correctamente');
      setShowPrescriptionModal(false);
      setPrescriptionForm({
        selectedMedicamento: null,
        dosis: '',
        frecuencia: '',
        duracion_dias: '',
        instrucciones: '',
      });
      setFilteredMedicamentos(medicamentos);
    } catch (error) {
      console.error('Error creating prescription:', error);
      if (error.sessionExpired) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }
      Alert.alert('Error', 'No se pudo crear la receta médica');
    }
  };

  const handleCreateTreatmentPrescription = async () => {
    if (!treatmentPrescriptionForm.descripcionTratamiento.trim()) {
      Alert.alert('Error', 'La descripción del tratamiento es obligatoria');
      return;
    }

    if (!treatmentPrescriptionForm.selectedMedicamento || !treatmentPrescriptionForm.dosis.trim()) {
      Alert.alert('Error', 'Debe seleccionar un medicamento y especificar la dosis');
      return;
    }

    try {
      // First, ensure there's a medical record for this patient
      let historialId = null;

      if (medicalRecords.length > 0) {
        // Use the most recent medical record
        historialId = medicalRecords[0].id;
      } else {
        // Create a new medical record first
        try {
          const medicalRecordData = {
            paciente_id: patient.id,
            cita_id: appointmentId,
            diagnostico: 'Consulta en proceso - Tratamiento y Receta',
            observaciones: 'Registro creado automáticamente para tratamiento y receta médica',
          };

          const newRecord = await apiService.createMedicalRecord(medicalRecordData);
          historialId = newRecord.id;

          // Refresh medical records
          const updatedRecords = await apiService.request(`/medicos/pacientes/${patient.id}/historial`);
          setMedicalRecords(updatedRecords || []);
        } catch (recordError) {
          console.error('Error creating medical record:', recordError);
          Alert.alert('Error', 'No se pudo crear el registro médico necesario');
          return;
        }
      }

      // Create the treatment
      const treatmentData = {
        historial_id: historialId,
        descripcion: treatmentPrescriptionForm.descripcionTratamiento,
        fecha_inicio: treatmentPrescriptionForm.fecha_inicio.toISOString().split('T')[0],
      };

      // Calculate fecha_fin if duracion_dias is provided (used for both treatment and prescription)
      if (treatmentPrescriptionForm.duracion_dias && !isNaN(parseInt(treatmentPrescriptionForm.duracion_dias))) {
        try {
          const fechaInicio = new Date(treatmentPrescriptionForm.fecha_inicio);
          const fechaFin = new Date(fechaInicio.getTime() + (parseInt(treatmentPrescriptionForm.duracion_dias) * 24 * 60 * 60 * 1000));
          treatmentData.fecha_fin = fechaFin.toISOString().split('T')[0];
        } catch (dateError) {
          console.error('Error calculating end date:', dateError);
          // Don't set fecha_fin if calculation fails
        }
      }

      const newTreatment = await apiService.createTreatment(treatmentData);

      // Now create the prescription
      const medicamentoId = treatmentPrescriptionForm.selectedMedicamento.id.toString();

      const prescriptionData = {
        tratamiento_id: newTreatment.id,
        medicamento_id: medicamentoId,
        dosis: treatmentPrescriptionForm.dosis,
        frecuencia: treatmentPrescriptionForm.frecuencia,
        duracion: treatmentPrescriptionForm.duracion_dias ? `${treatmentPrescriptionForm.duracion_dias} días` : null,
      };

      await apiService.createPrescription(prescriptionData);

      Alert.alert('Éxito', 'Tratamiento y receta médica creados correctamente');
      setShowTreatmentPrescriptionModal(false);
      setTreatmentPrescriptionForm({
        descripcionTratamiento: '',
        fecha_inicio: new Date(),
        selectedMedicamento: null,
        dosis: '',
        frecuencia: '',
        duracion_dias: '',
        instrucciones: '',
      });
    } catch (error) {
      console.error('Error creating treatment and prescription:', error);
      if (error.sessionExpired) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }
      Alert.alert('Error', 'No se pudo crear el tratamiento y la receta médica');
    }
  };

  const handleCreateExam = async () => {
    if (!examForm.tipo.trim()) {
      Alert.alert('Error', 'El tipo de examen es obligatorio');
      return;
    }

    try {
      const examData = {
        paciente_id: patient.id,
        tipo: examForm.tipo,
        resultado: examForm.descripcion, // Map descripcion to resultado
        fecha: new Date().toISOString().split('T')[0],
      };

      await apiService.createExam(examData);
      Alert.alert('Éxito', 'Examen creado correctamente');
      setShowExamModal(false);
      setExamForm({
        tipo: '',
        descripcion: '',
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      Alert.alert('Error', 'No se pudo crear el examen');
    }
  };

  const handleUpdateAppointment = async () => {
    try {
      const combinedDateTime = new Date(
        editAppointmentForm.fecha.getFullYear(),
        editAppointmentForm.fecha.getMonth(),
        editAppointmentForm.fecha.getDate(),
        editAppointmentForm.hora.getHours(),
        editAppointmentForm.hora.getMinutes(),
        0
      );

      const updateData = {
        fecha: combinedDateTime.toISOString(),
        motivo: editAppointmentForm.motivo,
      };

      await apiService.updateAppointment(appointmentId, updateData);
      Alert.alert('Éxito', 'Cita actualizada correctamente');
      setShowEditAppointmentModal(false);
      loadAppointmentData(); // Refresh data
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'No se pudo actualizar la cita');
    }
  };

  const handleCancelAppointment = async () => {
    Alert.alert(
      'Cancelar Cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.updateAppointmentStatus(appointmentId, 'cancelada');
              Alert.alert('Éxito', 'Cita cancelada correctamente');
              loadAppointmentData(); // Refresh data to show updated status
            } catch (error) {
              console.error('Error canceling appointment:', error);
              Alert.alert('Error', 'No se pudo cancelar la cita');
            }
          },
        },
      ]
    );
  };

  const loadMedicamentos = async () => {
    try {
      // Check if user is authenticated
      const isAuth = await apiService.isAuthenticated();
      if (!isAuth) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }

      const medicamentosData = await apiService.getMedications();
      setMedicamentos(medicamentosData || []);
      setFilteredMedicamentos(medicamentosData || []);
    } catch (error) {
      console.error('Error loading medicamentos:', error);
  
      if (error.sessionExpired || error.status === 401 || error.status === 403) {
        Alert.alert('Sesión expirada', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        logout();
        return;
      }
  
      // Si falla la carga de la API, usar lista común para desarrollo
      console.log('Using common medications list for development');
      setMedicamentos(medicamentosComunes);
      setFilteredMedicamentos(medicamentosComunes);
    }
  };

  const handleMedicamentoSelect = (medicamento) => {
    setPrescriptionForm(prev => ({
      ...prev,
      selectedMedicamento: medicamento,
    }));
    setShowMedicamentoDropdown(false);
  };

  const handleMedicamentoSelectTP = (medicamento) => {
    setTreatmentPrescriptionForm(prev => ({
      ...prev,
      selectedMedicamento: medicamento,
    }));
    setShowMedicamentoDropdownTP(false);
  };

  const filterMedicamentos = (searchText) => {
    if (!searchText.trim()) {
      setFilteredMedicamentos(medicamentos);
    } else {
      const filtered = medicamentos.filter(medicamento =>
        medicamento.nombre?.toLowerCase().includes(searchText.toLowerCase()) ||
        medicamento.descripcion?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredMedicamentos(filtered);
    }
  };

  const openPrescriptionModal = () => {
    loadMedicamentos();
    setShowPrescriptionModal(true);
  };

  const openTreatmentPrescriptionModal = () => {
    loadMedicamentos();
    setShowTreatmentPrescriptionModal(true);
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="medical" size={48} color="#007AFF" />
          <Text style={styles.loadingText}>Cargando consulta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Consulta Médica</Text>
            <Text style={styles.headerSubtitle}>
              {appointment?.fecha ? new Date(appointment.fecha).toLocaleDateString('es-ES') : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowEditAppointmentModal(true)} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Appointment Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <View style={[styles.statusBadge, getStatusStyle(appointment?.estado)]}>
              <Text style={styles.statusText}>{getStatusText(appointment?.estado)}</Text>
            </View>
          </View>

          {appointment?.estado?.toLowerCase() === 'pendiente' && (
            <View style={styles.statusActions}>
              <CustomButton
                title="Confirmar"
                onPress={() => handleStatusChange('confirmada')}
                variant="secondary"
                size="small"
                style={styles.statusButton}
              />
              <CustomButton
                title="Cancelar"
                onPress={handleCancelAppointment}
                variant="danger"
                size="small"
                style={styles.statusButton}
              />
            </View>
          )}

          {appointment?.estado?.toLowerCase() === 'confirmada' && (
            <CustomButton
              title="Marcar como Realizada"
              onPress={() => handleStatusChange('realizada')}
              backgroundColor="#34C759"
              textColor="#fff"
            />
          )}
        </View>

        {/* Patient Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Paciente</Text>
          <View style={styles.patientCard}>
            <View style={styles.patientHeader}>
              <View style={styles.patientAvatar}>
                <Ionicons name="person" size={24} color="#007AFF" />
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient?.user?.name || 'Paciente'}</Text>
                <Text style={styles.patientDocument}>Documento: {patient?.documento}</Text>
              </View>
            </View>

            <View style={styles.patientDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={16} color="#666" />
                <Text style={styles.detailText}>{patient?.telefono || 'No especificado'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.detailText}>{patient?.direccion || 'No especificado'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.detailText}>
                  {patient?.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toLocaleDateString('es-ES') : 'No especificado'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medical Records */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Historial Médico</Text>
          {medicalRecords.length > 0 ? (
            medicalRecords.slice(0, 3).map((record) => (
              <View key={record.id} style={styles.recordCard}>
                <Text style={styles.recordDate}>
                  {new Date(record.fecha || record.created_at).toLocaleDateString('es-ES')}
                </Text>
                <Text style={styles.recordDiagnosis}>{record.diagnostico}</Text>
                {record.observaciones && (
                  <Text style={styles.recordObservations}>{record.observaciones}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No hay registros médicos previos</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Médicas</Text>
          <View style={styles.actionGrid}>
            <CustomButton
              title="Registro Médico"
              onPress={() => setShowMedicalRecordModal(true)}
              backgroundColor="#007AFF"
              textColor="#fff"
              style={styles.actionButton}
            />
            <CustomButton
              title="Tratamiento + Receta"
              onPress={openTreatmentPrescriptionModal}
              backgroundColor="#FF9500"
              textColor="#fff"
              style={styles.actionButton}
            />
            <CustomButton
              title="Examen"
              onPress={() => setShowExamModal(true)}
              backgroundColor="#FF3B30"
              textColor="#fff"
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>

      {/* Medical Record Modal */}
      <Modal
        visible={showMedicalRecordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMedicalRecordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Registro Médico</Text>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Diagnóstico *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={medicalRecordForm.diagnostico}
                onChangeText={(text) => setMedicalRecordForm(prev => ({ ...prev, diagnostico: text }))}
                placeholder="Ingrese el diagnóstico"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Observaciones</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={medicalRecordForm.observaciones}
                onChangeText={(text) => setMedicalRecordForm(prev => ({ ...prev, observaciones: text }))}
                placeholder="Observaciones adicionales"
                multiline
                numberOfLines={4}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancelar"
                onPress={() => setShowMedicalRecordModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Guardar"
                onPress={handleCreateMedicalRecord}
                backgroundColor="#007AFF"
                textColor="#fff"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Treatment Modal */}
      <Modal
        visible={showTreatmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTreatmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Tratamiento</Text>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={treatmentForm.descripcion}
                onChangeText={(text) => setTreatmentForm(prev => ({ ...prev, descripcion: text }))}
                placeholder="Describa el tratamiento"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Fecha de Inicio</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTreatmentDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {treatmentForm.fecha_inicio.toLocaleDateString('es-ES')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Duración (días)</Text>
              <TextInput
                style={styles.input}
                value={treatmentForm.duracion_dias}
                onChangeText={(text) => setTreatmentForm(prev => ({ ...prev, duracion_dias: text }))}
                placeholder="Duración en días"
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancelar"
                onPress={() => setShowTreatmentModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Guardar"
                onPress={handleCreateTreatment}
                backgroundColor="#34C759"
                textColor="#fff"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Prescription Modal */}
      <Modal
        visible={showPrescriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Receta Médica</Text>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Medicamento *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowMedicamentoDropdown(true)}
              >
                <Text style={styles.dropdownText}>
                  {prescriptionForm.selectedMedicamento ? prescriptionForm.selectedMedicamento.nombre : 'Seleccionar medicamento...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Dosis *</Text>
              <TextInput
                style={styles.input}
                value={prescriptionForm.dosis}
                onChangeText={(text) => setPrescriptionForm(prev => ({ ...prev, dosis: text }))}
                placeholder="Ej: 500mg, 1 tableta"
              />

              <Text style={styles.label}>Frecuencia</Text>
              <TextInput
                style={styles.input}
                value={prescriptionForm.frecuencia}
                onChangeText={(text) => setPrescriptionForm(prev => ({ ...prev, frecuencia: text }))}
                placeholder="Ej: Cada 8 horas, 3 veces al día"
              />

              <Text style={styles.label}>Duración (días)</Text>
              <TextInput
                style={styles.input}
                value={prescriptionForm.duracion_dias}
                onChangeText={(text) => setPrescriptionForm(prev => ({ ...prev, duracion_dias: text }))}
                placeholder="Duración del tratamiento"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Instrucciones</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={prescriptionForm.instrucciones}
                onChangeText={(text) => setPrescriptionForm(prev => ({ ...prev, instrucciones: text }))}
                placeholder="Instrucciones especiales"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancelar"
                onPress={() => setShowPrescriptionModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Guardar"
                onPress={handleCreatePrescription}
                backgroundColor="#FF9500"
                textColor="#fff"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Treatment + Prescription Modal */}
      <Modal
        visible={showTreatmentPrescriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTreatmentPrescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tratamiento y Receta Médica</Text>
            <ScrollView style={styles.formContainer}>
              {/* Treatment Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleText}>Tratamiento</Text>
              </View>

              <Text style={styles.label}>Descripción del Tratamiento *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={treatmentPrescriptionForm.descripcionTratamiento}
                onChangeText={(text) => setTreatmentPrescriptionForm(prev => ({ ...prev, descripcionTratamiento: text }))}
                placeholder="Describa el tratamiento completo"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Fecha de Inicio</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTreatmentPrescriptionDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {treatmentPrescriptionForm.fecha_inicio.toLocaleDateString('es-ES')}
                </Text>
              </TouchableOpacity>

              {/* Prescription Section */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <Text style={styles.sectionTitleText}>Receta Médica</Text>
              </View>

              <Text style={styles.label}>Medicamento *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowMedicamentoDropdownTP(true)}
              >
                <Text style={styles.dropdownText}>
                  {treatmentPrescriptionForm.selectedMedicamento ? treatmentPrescriptionForm.selectedMedicamento.nombre : 'Seleccionar medicamento...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Dosis *</Text>
              <TextInput
                style={styles.input}
                value={treatmentPrescriptionForm.dosis}
                onChangeText={(text) => setTreatmentPrescriptionForm(prev => ({ ...prev, dosis: text }))}
                placeholder="Ej: 500mg, 1 tableta"
              />

              <Text style={styles.label}>Frecuencia</Text>
              <TextInput
                style={styles.input}
                value={treatmentPrescriptionForm.frecuencia}
                onChangeText={(text) => setTreatmentPrescriptionForm(prev => ({ ...prev, frecuencia: text }))}
                placeholder="Ej: Cada 8 horas, 3 veces al día"
              />

              <Text style={styles.label}>Duración (días)</Text>
              <TextInput
                style={styles.input}
                value={treatmentPrescriptionForm.duracion_dias}
                onChangeText={(text) => setTreatmentPrescriptionForm(prev => ({ ...prev, duracion_dias: text }))}
                placeholder="Duración del tratamiento"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Instrucciones</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={treatmentPrescriptionForm.instrucciones}
                onChangeText={(text) => setTreatmentPrescriptionForm(prev => ({ ...prev, instrucciones: text }))}
                placeholder="Instrucciones especiales"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancelar"
                onPress={() => setShowTreatmentPrescriptionModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Guardar"
                onPress={handleCreateTreatmentPrescription}
                backgroundColor="#FF9500"
                textColor="#fff"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Medicamento Dropdown Modal */}
      <Modal
        visible={showMedicamentoDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMedicamentoDropdown(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowMedicamentoDropdown(false)}
        >
          <View style={styles.dropdownContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar medicamento..."
              onChangeText={filterMedicamentos}
            />
            <FlatList
              data={filteredMedicamentos}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMedicamentoSelect(item)}
                >
                  <View>
                    <Text style={styles.dropdownItemText}>{item.nombre}</Text>
                    {item.descripcion && (
                      <Text style={styles.dropdownItemSubtext}>{item.descripcion}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No se encontraron medicamentos</Text>
              }
              style={styles.dropdownList}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Medicamento Dropdown Modal for Treatment + Prescription */}
      <Modal
        visible={showMedicamentoDropdownTP}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMedicamentoDropdownTP(false)}
      >
        <Pressable
          style={styles.dropdownOverlay}
          onPress={() => setShowMedicamentoDropdownTP(false)}
        >
          <View style={styles.dropdownContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar medicamento..."
              onChangeText={filterMedicamentos}
            />
            <FlatList
              data={filteredMedicamentos}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleMedicamentoSelectTP(item)}
                >
                  <View>
                    <Text style={styles.dropdownItemText}>{item.nombre}</Text>
                    {item.descripcion && (
                      <Text style={styles.dropdownItemSubtext}>{item.descripcion}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No se encontraron medicamentos</Text>
              }
              style={styles.dropdownList}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Exam Modal */}
      <Modal
        visible={showExamModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nuevo Examen</Text>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Tipo de Examen *</Text>
              <TextInput
                style={styles.input}
                value={examForm.tipo}
                onChangeText={(text) => setExamForm(prev => ({ ...prev, tipo: text }))}
                placeholder="Ej: Sangre, Rayos X, Ecografía"
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={examForm.descripcion}
                onChangeText={(text) => setExamForm(prev => ({ ...prev, descripcion: text }))}
                placeholder="Descripción del examen"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancelar"
                onPress={() => setShowExamModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Guardar"
                onPress={handleCreateExam}
                backgroundColor="#FF3B30"
                textColor="#fff"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Appointment Modal */}
      <Modal
        visible={showEditAppointmentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditAppointmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Cita</Text>
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.inputText}>
                  {editAppointmentForm.fecha.toLocaleDateString('es-ES')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Hora</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.inputText}>
                  {editAppointmentForm.hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>

              <Text style={styles.label}>Motivo</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editAppointmentForm.motivo}
                onChangeText={(text) => setEditAppointmentForm(prev => ({ ...prev, motivo: text }))}
                placeholder="Motivo de la consulta"
                multiline
                numberOfLines={2}
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <CustomButton
                title="Cancelar"
                onPress={() => setShowEditAppointmentModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <CustomButton
                title="Guardar"
                onPress={handleUpdateAppointment}
                backgroundColor="#007AFF"
                textColor="#fff"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={editAppointmentForm.fecha}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setEditAppointmentForm(prev => ({ ...prev, fecha: selectedDate }));
            }
          }}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={editAppointmentForm.hora}
          mode="time"
          display="default"
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setEditAppointmentForm(prev => ({ ...prev, hora: selectedTime }));
            }
          }}
        />
      )}

      {showTreatmentDatePicker && (
        <DateTimePicker
          value={treatmentForm.fecha_inicio}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowTreatmentDatePicker(false);
            if (selectedDate) {
              setTreatmentForm(prev => ({ ...prev, fecha_inicio: selectedDate }));
            }
          }}
        />
      )}

      {showTreatmentPrescriptionDatePicker && (
        <DateTimePicker
          value={treatmentPrescriptionForm.fecha_inicio}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowTreatmentPrescriptionDatePicker(false);
            if (selectedDate) {
              setTreatmentPrescriptionForm(prev => ({ ...prev, fecha_inicio: selectedDate }));
            }
          }}
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  },
  backButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  statusSection: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 24,
    marginVertical: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
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
  statusActions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
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
  patientCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  patientDocument: {
    fontSize: 14,
    color: '#666',
  },
  patientDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recordDiagnosis: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recordObservations: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  actionGrid: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 0,
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
    maxHeight: 400,
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
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  inputText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
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
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: '70%',
    width: '90%',
    elevation: 5,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    fontSize: 16,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default DoctorAppointmentDetail;
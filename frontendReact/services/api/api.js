import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuración para desarrollo local con teléfono físico
// Para teléfono físico, usar la IP de la máquina host
const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    // Para teléfono físico Android, usar IP real de la máquina
    return 'http://192.168.1.12:8000/api';
    //return 'http://10.2.234.89:8000/api';
  }
  // Para iOS simulator o desarrollo web
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = await this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      let data;

      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, create a generic error
        data = { message: 'Error del servidor' };
      }

      if (!response.ok) {
        // Handle 401 errors by clearing token and throwing a specific error
        // But exclude login and register endpoints from session expiration logic
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          await this.removeToken();
          const error = new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          error.status = response.status;
          error.endpoint = endpoint;
          error.sessionExpired = true; // Flag to indicate session expiry
          throw error;
        }

        // Create a more specific error based on status code
        let errorMessage = data.message || 'Error desconocido';

        if (response.status === 403) {
          errorMessage = data.message || 'No tienes permisos para esta acción';
        } else if (response.status === 404) {
          errorMessage = data.message || 'Recurso no encontrado';
        } else if (response.status === 422) {
          errorMessage = data.message || 'Datos inválidos';
        } else if (response.status === 500) {
          errorMessage = 'Error interno del servidor';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = data.message || 'Error de solicitud';
        } else if (response.status >= 500) {
          errorMessage = 'Error del servidor';
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.endpoint = endpoint;
        throw error;
      }

      return data;
    } catch (error) {
      // If it's a network error or other fetch error
      if (!error.status) {
        error.message = 'Error de conexión. Verifica tu conexión a internet.';
      }

      throw error;
    }
  }

  async getToken() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      return null;
    }
  }

  async setToken(token) {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  async removeToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Auth endpoints
  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      await this.setToken(response.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.user));
    }

    return response;
  }

  async register(userData) {
    return await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Logout errors are not critical, just clear local tokens
    } finally {
      await this.removeToken();
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async updateEmail(emailData) {
    return await this.request('/auth/email', {
      method: 'PUT',
      body: JSON.stringify(emailData),
    });
  }

  async updatePassword(passwordData) {
    return await this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }

  // Utility method to clear all authentication data
  async clearAuthData() {
    await this.removeToken();
    return true;
  }

  // Patient endpoints
  async getPatientProfile() {
    return await this.request('/pacientes/profile');
  }

  async updatePatientProfile(profileData) {
    return await this.request('/pacientes/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getPatientAppointments() {
    return await this.request('/pacientes/citas');
  }

  async getPatientHistory() {
    try {
      // Obtener registros del historial clínico (diagnósticos, tratamientos)
      const clinicalHistory = await this.request('/pacientes/historial');

      // Validar que clinicalHistory sea un array
      if (!Array.isArray(clinicalHistory)) {
        console.error('Clinical history is not an array:', clinicalHistory);
        // Retornar citas del historial como fallback
        const appointments = await this.getPatientAppointments();
        if (!Array.isArray(appointments)) return [];
        return appointments.filter(apt => {
          if (!apt || !apt.id) return false;
          const appointmentDate = new Date(apt.fecha);
          const now = new Date();
          const isPast = appointmentDate < now;
          const isCompleted = apt.estado?.toLowerCase() === 'realizada' || apt.estado?.toLowerCase() === 'cancelada';
          return isPast || isCompleted;
        }).map(appointment => ({
          id: appointment.id,
          fecha: appointment.fecha,
          created_at: appointment.created_at,
          cita: {
            id: appointment.id,
            fecha: appointment.fecha,
            estado: appointment.estado,
            motivo: appointment.motivo,
            medico: appointment.medico ? {
              id: appointment.medico.id,
              name: appointment.medico.user?.name || 'Médico asignado'
            } : null
          },
          diagnostico: null,
          tratamientos: []
        }));
      }

      // Debug: mostrar qué tratamientos se están cargando
      if (__DEV__) {
        console.log('Clinical History from backend:', clinicalHistory);
        clinicalHistory.forEach((record, index) => {
          console.log(`Record ${index}: ID=${record.id}, Cita=${record.cita?.id || 'null'}, Tratamientos=${record.tratamientos?.length || 0}`, {
            diagnostico: record.diagnostico,
            tratamientos: record.tratamientos
          });
        });
      }

      // Obtener todas las citas para incluir las que no tienen historial clínico
      const appointments = await this.getPatientAppointments();

      // Validar que appointments sea un array
      if (!Array.isArray(appointments)) {
        console.error('Appointments is not an array:', appointments);
        return clinicalHistory; // Retornar solo el historial clínico si hay error
      }

      // Crear mapa de registros clínicos por cita_id ANTES del filtro
      const clinicalMap = {};
      clinicalHistory.forEach(record => {
        if (record && record.cita && record.cita.id) {
          clinicalMap[record.cita.id] = record;
        } else if (__DEV__ && record) {
          console.log('Clinical record without cita or invalid cita:', record);
        }
      });

      // Debug: verificar clinicalMap
      if (__DEV__) {
        console.log('Clinical Map created:', Object.keys(clinicalMap));
      }

      // Filtrar citas del historial (pasadas, canceladas, realizadas)
      // IMPORTANTE: Incluir TODAS las citas que tienen historial clínico, sin importar fecha/estado
      const pastAppointments = appointments.filter(apt => {
        if (!apt || !apt.id) return false; // Validar que la cita existe

        const appointmentDate = new Date(apt.fecha);
        const now = new Date();
        const isPast = appointmentDate < now;
        const isCompleted = apt.estado?.toLowerCase() === 'realizada' || apt.estado?.toLowerCase() === 'cancelada';
        const hasClinicalRecord = clinicalMap[apt.id]; // Si tiene historial clínico, incluirla

        return isPast || isCompleted || hasClinicalRecord;
      });

      // Combinar información: registros clínicos completos + citas sin historial clínico
      const combinedHistory = [];

      // Primero agregar todos los registros clínicos (que tienen info completa)
      clinicalHistory.forEach(record => {
        if (record && record.id) {
          combinedHistory.push({
            ...record,
            _type: 'clinical', // Marcar como registro clínico
            _uniqueKey: `clinical-${record.id}` // Key única para React
          });
        }
      });

      // Luego agregar citas que NO tienen historial clínico
      pastAppointments.forEach(appointment => {
        if (appointment && appointment.id) {
          const hasClinicalRecord = clinicalMap[appointment.id];
          if (!hasClinicalRecord) {
            // Crear entrada básica para cita sin historial clínico
            // NOTA: Las citas sin historial clínico no tienen tratamientos asociados
            combinedHistory.push({
              id: appointment.id,
              fecha: appointment.fecha,
              created_at: appointment.created_at,
              cita: {
                id: appointment.id,
                fecha: appointment.fecha,
                estado: appointment.estado,
                motivo: appointment.motivo,
                medico: appointment.medico ? {
                  id: appointment.medico.id,
                  name: appointment.medico.user?.name || 'Médico asignado'
                } : null
              },
              diagnostico: null,
              tratamientos: [], // Citas sin historial clínico no tienen tratamientos
              _type: 'appointment', // Marcar como cita básica
              _uniqueKey: `appointment-${appointment.id}` // Key única para React
            });
          }
        }
      });

      // Ordenar por fecha (más reciente primero)
      return combinedHistory
        .filter(item => item && item.fecha) // Filtrar items válidos con fecha
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    } catch (error) {
      console.error('Error getting patient history:', error);
      // Fallback: devolver al menos las citas del historial
      const appointments = await this.getPatientAppointments();
      const pastAppointments = appointments.filter(apt => {
        const appointmentDate = new Date(apt.fecha);
        const now = new Date();
        const isPast = appointmentDate < now;
        const isCompleted = apt.estado?.toLowerCase() === 'realizada' || apt.estado?.toLowerCase() === 'cancelada';
        return isPast || isCompleted;
      });

      return pastAppointments.filter(apt => apt && apt.id).map(appointment => ({
        id: appointment.id,
        fecha: appointment.fecha,
        created_at: appointment.created_at,
        cita: {
          id: appointment.id,
          fecha: appointment.fecha,
          estado: appointment.estado,
          motivo: appointment.motivo,
          medico: appointment.medico ? {
            id: appointment.medico.id,
            name: appointment.medico.user?.name || 'Médico asignado'
          } : null
        },
        diagnostico: null,
        tratamientos: [],
        _type: 'appointment-fallback',
        _uniqueKey: `appointment-fallback-${appointment.id}`
      }));
    }
  }

  async getPatientInvoices() {
    return await this.request('/pacientes/facturas');
  }

  // Doctor endpoints
  async getDoctorPatients() {
    return await this.request('/medicos/pacientes');
  }

  async getDoctorAppointments() {
    return await this.request('/medicos/citas');
  }

  async updateAppointmentStatus(appointmentId, status) {
    return await this.request(`/medicos/citas/${appointmentId}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado: status }),
    });
  }

  async getMedications() {
    return await this.request('/medicamentos');
  }

  async getTreatments() {
    return await this.request('/tratamientos');
  }

  async searchMedications(query) {
    return await this.request(`/medicamentos/search?query=${query}`);
  }

  async getSpecialties() {
    return await this.request('/especialidades');
  }

  async getDoctors() {
    return await this.request('/medicos');
  }

  async createAppointment(appointmentData) {
    return await this.request('/pacientes/citas', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async cancelAppointment(appointmentId) {
    return await this.request(`/pacientes/citas/${appointmentId}/cancelar`, {
      method: 'POST',
    });
  }

  // Doctor-specific methods
  async createMedicalRecord(recordData) {
    return await this.request('/medicos/historial-clinico', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  async createTreatment(treatmentData) {
    return await this.request('/medicos/tratamientos', {
      method: 'POST',
      body: JSON.stringify(treatmentData),
    });
  }

  async createPrescription(prescriptionData) {
    return await this.request('/medicos/recetas-medicas', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  }

  async createExam(examData) {
    return await this.request('/medicos/examenes', {
      method: 'POST',
      body: JSON.stringify(examData),
    });
  }

  // Appointment management
  async getAppointments() {
    return await this.request('/citas');
  }

  async getAppointment(appointmentId) {
    return await this.request(`/citas/${appointmentId}`);
  }

  async updateAppointment(appointmentId, appointmentData) {
    return await this.request(`/citas/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async deleteAppointment(appointmentId) {
    return await this.request(`/citas/${appointmentId}`, {
      method: 'DELETE',
    });
  }

  // Notifications
  async getNotifications() {
    return await this.request('/notificaciones');
  }

  async markNotificationAsRead(notificationId) {
    return await this.request(`/notificaciones/${notificationId}/read`, {
      method: 'PUT',
    });
  }

  async getAvailableSlots(doctorId, date) {
    return await this.request(`/medicos/${doctorId}/horarios/disponibles?fecha=${date}`);
  }

  // Doctor reports
  async getDoctorReports() {
    return await this.request('/medicos/reportes');
  }

  // Admin endpoints
  async getAdminDashboard() {
    return await this.request('/admin/dashboard');
  }

  async getAdminReports() {
    return await this.request('/admin/reportes');
  }

  // Admin Patient Management
  async getPatients() {
    return await this.request('/pacientes');
  }

  async getPatient(id) {
    return await this.request(`/pacientes/${id}`);
  }

  async createPatient(patientData) {
    return await this.request('/pacientes', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id, patientData) {
    return await this.request(`/pacientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(id) {
    return await this.request(`/pacientes/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Doctor Management
  async getDoctors() {
    return await this.request('/medicos');
  }

  async getDoctor(id) {
    return await this.request(`/medicos/${id}`);
  }

  async createDoctor(doctorData) {
    return await this.request('/medicos', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  }

  async updateDoctor(id, doctorData) {
    return await this.request(`/medicos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(doctorData),
    });
  }

  async deleteDoctor(id) {
    return await this.request(`/medicos/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Doctor Creation (creates user + doctor)
  async createDoctorWithUser(doctorData) {
    return await this.request('/admin/create-doctor', {
      method: 'POST',
      body: JSON.stringify(doctorData),
    });
  }

  // Admin Medication Management
  async getMedication(id) {
    return await this.request(`/medicamentos/${id}`);
  }

  async createMedication(medicationData) {
    return await this.request('/medicamentos', {
      method: 'POST',
      body: JSON.stringify(medicationData),
    });
  }

  async updateMedication(id, medicationData) {
    return await this.request(`/medicamentos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(medicationData),
    });
  }

  async deleteMedication(id) {
    return await this.request(`/medicamentos/${id}`, {
      method: 'DELETE',
    });
  }

  // Superadmin User Management
  async getUsers() {
    return await this.request('/admin/users');
  }

  async updateUserRoles(userId, rolesData) {
    return await this.request(`/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify(rolesData),
    });
  }

  async deleteUser(userId) {
    return await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async createAdmin(adminData) {
    return await this.request('/admin/create-admin', {
      method: 'POST',
      body: JSON.stringify(adminData),
    });
  }

  // Superadmin Audit Logs
  async getAudits() {
    return await this.request('/auditorias');
  }

  async getAudit(id) {
    return await this.request(`/auditorias/${id}`);
  }
}

export default new ApiService();
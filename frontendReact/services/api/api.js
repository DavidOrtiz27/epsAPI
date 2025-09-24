import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.2.233.173:8000/api';

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
      console.log('API request to:', endpoint, 'with token present');
    } else {
      console.log('API request to:', endpoint, 'without token');
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
          console.log('401 error detected for endpoint:', endpoint, 'clearing invalid token');
          console.log('Response data:', data);
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
      console.error('API request failed:', error);

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
      console.error('Error getting token:', error);
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
      console.error('Logout API error:', error);
    } finally {
      await this.removeToken();
    }
  }

  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  async isAuthenticated() {
    const token = await this.getToken();
    return !!token;
  }

  // Utility method to clear all authentication data
  async clearAuthData() {
    console.log('Clearing all authentication data...');
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
    return await this.request('/pacientes/historial');
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
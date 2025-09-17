import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.8:8000/api';

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
        // Create a more specific error based on status code
        let errorMessage = data.message || 'Error desconocido';

        if (response.status === 401) {
          errorMessage = data.message || 'Credenciales incorrectas';
        } else if (response.status === 403) {
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

  async searchMedications(query) {
    return await this.request(`/medicamentos/search?query=${query}`);
  }

  async getSpecialties() {
    return await this.request('/especialidades');
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
}

export default new ApiService();
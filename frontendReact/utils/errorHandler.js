// Error handling utilities for API responses

/**
 * Get user-friendly error message based on error status and type
 * @param {Error} error - The error object from API call
 * @param {string} defaultMessage - Default message if error type is unknown
 * @returns {Object} - Object with title and message for alert
 */
export const getErrorMessage = (error, defaultMessage = 'Ha ocurrido un error inesperado') => {
  let title = 'Error';
  let message = defaultMessage;

  // Network/connection errors
  if (!error.status) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      title = 'Error de conexión';
      message = 'Verifica tu conexión a internet e inténtalo de nuevo.';
    } else {
      message = error.message || defaultMessage;
    }
  }
  // HTTP status code errors
  else {
    switch (error.status) {
      case 400:
        title = 'Solicitud incorrecta';
        message = error.message || 'Los datos enviados no son válidos.';
        break;
      case 401:
        title = 'Credenciales incorrectas';
        message = error.message || 'Usuario o contraseña incorrectos.';
        break;
      case 403:
        title = 'Acceso denegado';
        message = error.message || 'No tienes permisos para realizar esta acción.';
        break;
      case 404:
        title = 'No encontrado';
        message = error.message || 'El recurso solicitado no existe.';
        break;
      case 409:
        title = 'Conflicto';
        message = error.message || 'Ya existe un registro con estos datos.';
        break;
      case 422:
        title = 'Datos inválidos';
        message = error.message || 'Por favor, verifica la información proporcionada.';
        break;
      case 429:
        title = 'Demasiadas solicitudes';
        message = 'Has realizado demasiadas solicitudes. Inténtalo más tarde.';
        break;
      case 500:
        title = 'Error del servidor';
        message = 'Hay un problema con el servidor. Inténtalo más tarde.';
        break;
      case 502:
      case 503:
      case 504:
        title = 'Servicio no disponible';
        message = 'El servicio no está disponible temporalmente. Inténtalo más tarde.';
        break;
      default:
        if (error.status >= 400 && error.status < 500) {
          title = 'Error de solicitud';
          message = error.message || 'Hubo un problema con tu solicitud.';
        } else if (error.status >= 500) {
          title = 'Error del servidor';
          message = 'Hay un problema con el servidor. Inténtalo más tarde.';
        } else {
          message = error.message || defaultMessage;
        }
    }
  }

  return { title, message };
};

/**
 * Show alert with error message
 * @param {Error} error - The error object
 * @param {string} defaultMessage - Default message
 * @param {Array} buttons - Custom alert buttons (optional)
 */
export const showErrorAlert = (error, defaultMessage, buttons = null) => {
  const { title, message } = getErrorMessage(error, defaultMessage);

  const alertButtons = buttons || [
    {
      text: 'Aceptar',
      style: 'default'
    }
  ];

  Alert.alert(title, message, alertButtons);
};

// Re-export Alert for convenience
export { Alert } from 'react-native';
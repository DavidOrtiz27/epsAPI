# Documentación del Flujo de Datos - Frontend EPS Mapu

## Arquitectura General del Flujo de Datos

### 1. Patrón de Arquitectura
El frontend sigue una arquitectura **React Native + Context API + Service Layer**:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   COMPONENTES   │────│   CONTEXT API   │────│  SERVICE LAYER  │
│   (UI/UX)       │    │  (Estado Global) │    │   (API Calls)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   NAVIGATION    │
                    │  (Data Passing) │
                    └─────────────────┘
```

## 2. Gestión de Estado Global (AuthContext)

### Estructura del AuthContext
```javascript
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // Usuario autenticado
  const [token, setToken] = useState(null);      // Token JWT
  const [isLoading, setIsLoading] = useState(true); // Estado de carga inicial

  // ... métodos de autenticación
};
```

### Ciclo de Vida del Estado de Autenticación

#### 1. Inicialización de la App
```javascript
// App.js
export default function App() {
  return (
    <AuthProvider>  // ← Proveedor de estado global
      <AppNavigator />
    </AuthProvider>
  );
}
```

#### 2. Check de Autenticación Inicial
```javascript
// AuthContext.js - checkAuthState()
useEffect(() => {
  checkAuthState(); // ← Se ejecuta al montar el contexto
}, []);

const checkAuthState = async () => {
  try {
    const storedToken = await AsyncStorage.getItem('auth_token');
    const storedUser = await AsyncStorage.getItem('user_data');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      // Verificar token con API
      await apiService.getCurrentUser();
    }
  } catch (error) {
    // Limpiar datos inválidos
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_data');
  } finally {
    setIsLoading(false);
  }
};
```

#### 3. Login Flow
```javascript
// AuthContext.js - login()
const login = async (email, password) => {
  const response = await apiService.login({ email, password });

  setUser(response.user);
  setToken(response.token);

  // Persistir en AsyncStorage
  await AsyncStorage.setItem('auth_token', response.token);
  await AsyncStorage.setItem('user_data', JSON.stringify(response.user));

  return response;
};
```

#### 4. Navegación Condicional Basada en Estado
```javascript
// AppNavigator.js
const AppNavigator = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Loading screen
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        // Auth Stack
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : (
        // Main App basado en rol
        user?.roles?.some(role => role.name === 'paciente') && (
          <Stack.Screen name="PatientTabs" component={PatientTabs} />
        )
        // ... otros roles
      )}
    </NavigationContainer>
  );
};
```

## 3. Capa de Servicios (API Layer)

### Estructura del ApiService
```javascript
class ApiService {
  constructor() {
    this.baseURL = getApiBaseUrl(); // Configuración dinámica por plataforma
  }

  // Método base para todas las requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Agregar token de autenticación
    const token = await this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ... manejo de response y errores
  }
}
```

### Configuración de URLs por Plataforma
```javascript
const getApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.2.233.61:8000/api'; // IP física para dispositivo
  }
  return 'http://localhost:8000/api'; // localhost para simulador
};
```

### Manejo de Tokens
```javascript
// Almacenamiento persistente
async setToken(token) {
  await AsyncStorage.setItem('auth_token', token);
}

async getToken() {
  return await AsyncStorage.getItem('auth_token');
}

async removeToken() {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('user_data');
}
```

## 4. Flujo de Datos en Pantallas Específicas

### 4.1 Dashboard de Paciente (PatientDashboard.js)

#### Estado Local
```javascript
const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
};
```

#### Carga Inicial de Datos
```javascript
useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {
    // 1. Obtener citas del paciente
    const appointmentsData = await apiService.getPatientAppointments();
    setAppointments(appointmentsData || []);
  } catch (error) {
    Alert.alert('Error', 'No se pudieron cargar los datos del dashboard');
  } finally {
    setLoading(false);
  }
};
```

#### Flujo de Datos en UI
```javascript
// Renderizado condicional basado en datos
{upcomingAppointments.length > 0 ? (
  upcomingAppointments.slice(0, 2).map((appointment) => (
    <AppointmentCard key={appointment.id} appointment={appointment} />
  ))
) : (
  <View style={styles.emptyState}>
    <Text>No tienes citas próximas</Text>
  </View>
)}
```

### 4.2 Gestión de Pacientes Admin (AdminPatients.js)

#### Patrón CRUD Completo
```javascript
const AdminPatients = () => {
  const [patients, setPatients] = useState([]);           // Lista completa
  const [filteredPatients, setFilteredPatients] = useState([]); // Lista filtrada
  const [searchQuery, setSearchQuery] = useState('');     // Query de búsqueda
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
};
```

#### Flujo de Búsqueda en Tiempo Real
```javascript
useEffect(() => {
  filterPatients(); // ← Se ejecuta cada vez que cambian patients o searchQuery
}, [patients, searchQuery]);

const filterPatients = () => {
  if (!searchQuery.trim()) {
    setFilteredPatients(patients);
    return;
  }

  const filtered = patients.filter(patient => {
    const fullName = `${patient.user?.name || ''}`.toLowerCase();
    const documento = `${patient.documento || ''}`.toLowerCase();

    return fullName.includes(query) || documento.includes(query);
  });

  setFilteredPatients(filtered);
};
```

#### Operaciones CRUD

**Create:**
```javascript
// Navegación al formulario
navigation.navigate('AdminPatientForm'); // ← Sin parámetros = modo creación
```

**Read:**
```javascript
const loadPatients = async () => {
  const patientsData = await apiService.getPatients();
  setPatients(patientsData); // ← Actualiza estado global
};
```

**Update:**
```javascript
// Navegación con ID del paciente
navigation.navigate('AdminPatientDetail', { patientId: item.id });
```

**Delete:**
```javascript
const deletePatient = async (patientId) => {
  await apiService.deletePatient(patientId);
  loadPatients(); // ← Recargar lista después de eliminar
};
```

### 4.3 Formulario de Paciente (AdminPatientForm.js)

#### Estado del Formulario
```javascript
const AdminPatientForm = ({ navigation, route }) => {
  const { patientId } = route.params || {}; // ← Parámetro de navegación
  const isEditing = !!patientId;

  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    documento: '', telefono: '', direccion: '',
    fecha_nacimiento: '', genero: ''
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
};
```

#### Carga de Datos para Edición
```javascript
useEffect(() => {
  if (isEditing) {
    loadPatient(); // ← Solo si estamos editando
  }
}, [patientId]);

const loadPatient = async () => {
  const patient = await apiService.getPatient(patientId);
  setFormData({
    name: patient.user?.name || '',
    documento: patient.documento || '',
    // ... otros campos
  });
};
```

#### Validación y Envío
```javascript
const validateForm = () => {
  const newErrors = {};

  if (!formData.name.trim()) {
    newErrors.name = 'El nombre es requerido';
  }
  // ... otras validaciones

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSave = async () => {
  if (!validateForm()) return;

  setSaving(true);
  try {
    if (isEditing) {
      await apiService.updatePatient(patientId, formData);
    } else {
      await apiService.register(formData); // ← Crea usuario + paciente
    }

    navigation.goBack(); // ← Regreso automático después de guardar
  } catch (error) {
    // Manejo de errores
  } finally {
    setSaving(false);
  }
};
```

## 5. Comunicación Entre Pantallas

### 5.1 Paso de Parámetros por Navegación
```javascript
// Navegación con parámetros
navigation.navigate('AdminPatientDetail', {
  patientId: item.id,
  mode: 'view' // ← Parámetros adicionales
});

// Recepción en pantalla destino
const AdminPatientDetail = ({ route }) => {
  const { patientId, mode } = route.params;
  // ... usar parámetros
};
```

### 5.2 Comunicación Inversa (Callback Pattern)
```javascript
// Pantalla A - Pasa callback
navigation.navigate('FormScreen', {
  onSave: (data) => {
    // Callback ejecutado cuando se guarda
    loadData(); // ← Recargar datos
  }
});

// Pantalla B - Ejecuta callback
const handleSave = async () => {
  // ... guardar datos
  route.params?.onSave?.(savedData);
  navigation.goBack();
};
```

### 5.3 useFocusEffect para Refresh
```javascript
// Recargar datos cuando la pantalla vuelve a estar en foco
useFocusEffect(
  React.useCallback(() => {
    loadPatients(); // ← Se ejecuta al volver a la pantalla
  }, [])
);
```

## 6. Manejo de Errores en Flujo de Datos

### 6.1 Errores de Red
```javascript
// ApiService.request()
catch (error) {
  if (!error.status) {
    // Error de conexión
    error.message = 'Error de conexión. Verifica tu conexión a internet.';
  }
  throw error;
}
```

### 6.2 Errores de Autenticación
```javascript
// ApiService.request()
if (response.status === 401) {
  await this.removeToken();
  error.sessionExpired = true;
  throw error;
}
```

### 6.3 Errores de Validación
```javascript
// En formularios
catch (error) {
  if (error.status === 422 && error.errors) {
    setErrors(error.errors); // ← Mostrar errores de campo
  } else {
    Alert.alert('Error', error.message);
  }
}
```

### 6.4 Errores de UI
```javascript
// Estados de error en componentes
const [error, setError] = useState(null);

{error && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity onPress={() => setError(null)}>
      <Text>Dismiss</Text>
    </TouchableOpacity>
  </View>
)}
```

## 7. Persistencia de Datos

### 7.1 AsyncStorage para Autenticación
```javascript
// Almacenamiento persistente
const login = async (credentials) => {
  const response = await apiService.login(credentials);

  // Persistir token y datos de usuario
  await AsyncStorage.setItem('auth_token', response.token);
  await AsyncStorage.setItem('user_data', JSON.stringify(response.user));

  setToken(response.token);
  setUser(response.user);
};
```

### 7.2 Cache de Datos (Opcional)
```javascript
// Patrón para cache de datos
const getCachedData = async (key, fetchFunction, ttl = 300000) => {
  const cached = await AsyncStorage.getItem(key);

  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < ttl) {
      return data; // ← Retornar datos cacheados
    }
  }

  // Fetch nuevos datos
  const freshData = await fetchFunction();
  await AsyncStorage.setItem(key, JSON.stringify({
    data: freshData,
    timestamp: Date.now()
  }));

  return freshData;
};
```

## 8. Patrones de Estado Local vs Global

### 8.1 Estado Global (AuthContext)
- **Usuario autenticado**: `user`, `token`, `isAuthenticated`
- **Configuración de app**: Tema, idioma, preferencias
- **Datos compartidos**: Especialidades, tipos de cita

### 8.2 Estado Local (useState)
- **Datos específicos de pantalla**: Listas, formularios
- **UI state**: Loading, modales, filtros
- **Datos temporales**: Borradores, selecciones

### 8.3 Comunicación Estado Global ↔ Local
```javascript
// Componente usa estado global
const MyComponent = () => {
  const { user, updateUser } = useAuth();
  const [localData, setLocalData] = useState([]);

  // Actualizar estado global desde local
  const handleUpdate = async () => {
    await updateUser(localData);
  };
};
```

## 9. Ciclo de Vida de los Datos

### 9.1 Secuencia Típica de Operación
```javascript
1. Usuario interactúa con UI
2. Componente actualiza estado local
3. Validación de datos
4. Llamada a API service
5. Actualización de estado global (si aplica)
6. Persistencia en AsyncStorage (si aplica)
7. Actualización de UI
8. Feedback al usuario (éxito/error)
```

### 9.2 Cleanup y Memory Management
```javascript
// Cleanup en useEffect
useEffect(() => {
  let isMounted = true;

  const loadData = async () => {
    const data = await apiService.getData();
    if (isMounted) {
      setData(data);
    }
  };

  loadData();

  return () => {
    isMounted = false; // ← Prevenir memory leaks
  };
}, []);
```

## 10. Testing del Flujo de Datos

### 10.1 Puntos Críticos a Verificar
- ✅ **Autenticación**: Login/logout, token refresh
- ✅ **Navegación**: Paso de parámetros, callbacks
- ✅ **CRUD Operations**: Create, Read, Update, Delete
- ✅ **Error Handling**: Network errors, validation errors
- ✅ **State Management**: Global vs local state
- ✅ **Persistence**: AsyncStorage operations
- ✅ **Loading States**: UI feedback durante operaciones

### 10.2 Casos de Edge Case
- 🔍 **Token expirado**: Durante operación
- 🔍 **Pérdida de conexión**: Durante API calls
- 🔍 **Datos corruptos**: En AsyncStorage
- 🔍 **Navegación rápida**: Entre pantallas con datos
- 🔍 **Memory leaks**: Cleanup de subscriptions

---

## Conclusión

El flujo de datos del frontend EPS Mapu sigue patrones sólidos de arquitectura React Native:

- **Separación clara**: UI ↔ Estado ↔ API
- **Estado global**: AuthContext para autenticación
- **Estado local**: useState para datos específicos
- **Persistencia**: AsyncStorage para datos críticos
- **Error handling**: Robusto en todos los niveles
- **Navegación**: Paso seguro de datos entre pantallas

Esta arquitectura asegura **mantenibilidad**, **escalabilidad** y **robustez** en el manejo de datos a través de toda la aplicación.
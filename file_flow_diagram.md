# EPS API - Diagrama de Flujo de Archivos

## Arquitectura General
Este diagrama muestra el flujo de información y las relaciones entre los archivos principales del proyecto EPS (Sistema de Gestión Médica).

```mermaid
flowchart TD
    %% Frontend React Native
    A[App.js] --> B[AuthProvider<br/>utils/context/AuthContext.js]
    B --> C[AppNavigator<br/>navigation/auth/AppNavigator.js]

    C --> D{¿Autenticado?}
    D -->|No| E[LoginScreen<br/>screens/auth/LoginScreen.js]
    D -->|No| F[RegisterScreen<br/>screens/auth/RegisterScreen.js]

    D -->|Sí| G{Rol del Usuario}
    G -->|Paciente| H[PatientTabs<br/>navigation/patient/PatientTabs.js]
    G -->|Doctor| I[DoctorTabs<br/>navigation/doctor/DoctorTabs.js]
    G -->|Admin| J[AdminDashboard<br/>screens/admin/AdminDashboard.js]

    H --> K[PatientDashboard<br/>screens/patient/PatientDashboard.js]
    H --> L[PatientAppointments<br/>screens/patient/PatientAppointments.js]
    H --> M[PatientHistory<br/>screens/patient/PatientHistory.js]
    H --> N[PatientProfile<br/>screens/patient/PatientProfile.js]

    I --> O[DoctorDashboard<br/>screens/doctor/DoctorDashboard.js]
    I --> P[DoctorPatients<br/>screens/doctor/DoctorPatients.js]
    I --> Q[DoctorAppointments<br/>screens/doctor/DoctorAppointments.js]
    I --> R[DoctorProfile<br/>screens/doctor/DoctorProfile.js]

    %% API Service
    K --> S[apiService<br/>services/api/api.js]
    L --> S
    M --> S
    N --> S
    O --> S
    P --> S
    Q --> S
    R --> S
    J --> S
    E --> S
    F --> S

    %% Backend Laravel
    S --> T[API Routes<br/>routes/api.php]

    T --> U[AuthController<br/>Http/Controllers/AuthController.php]
    T --> V[PacienteController<br/>Http/Controllers/PacienteController.php]
    T --> W[MedicoController<br/>Http/Controllers/MedicoController.php]
    T --> X[AdminController<br/>Http/Controllers/AdminController.php]
    T --> Y[CitaController<br/>Http/Controllers/CitaController.php]
    T --> Z[Other Controllers...]

    U --> AA[User Model<br/>Models/User.php]
    V --> BB[Paciente Model<br/>Models/Paciente.php]
    W --> CC[Medico Model<br/>Models/Medico.php]
    Y --> DD[Cita Model<br/>Models/Cita.php]
    Z --> EE[Other Models...]

    AA --> FF[(Database)]
    BB --> FF
    CC --> FF
    DD --> FF
    EE --> FF

    %% Components
    K --> GG[CustomButton<br/>components/ui/CustomButton.js]
    K --> HH[CustomInput<br/>components/ui/CustomInput.js]
    L --> GG
    L --> HH
    E --> GG
    E --> HH
    F --> GG
    F --> HH

    %% Utils
    S --> II[errorHandler<br/>utils/errorHandler.js]
    B --> JJ[AsyncStorage<br/>@react-native-async-storage/async-storage]

    %% Styling
    subgraph "Frontend - React Native"
        A
        B
        C
        E
        F
        H
        I
        J
        K
        L
        M
        N
        O
        P
        Q
        R
        S
        GG
        HH
        II
        JJ
    end

    subgraph "Backend - Laravel"
        T
        U
        V
        W
        X
        Y
        Z
        AA
        BB
        CC
        DD
        EE
        FF
    end

    %% Data Flow
    FF -.->|JSON Response| S
    S -.->|API Calls| T
    T -.->|Business Logic| U
    U -.->|Data Access| AA
```

## Leyenda del Diagrama

### Nodos
- **Rectángulos**: Archivos principales
- **Rombo**: Decisiones lógicas
- **Subgrafos**: Agrupación por capas (Frontend/Backend)

### Flujos
- **Flechas sólidas**: Importaciones y dependencias directas
- **Flechas punteadas**: Flujo de datos en tiempo de ejecución

### Capas del Sistema

1. **Presentación (Frontend)**
   - `App.js`: Punto de entrada
   - `AuthProvider`: Gestión de estado de autenticación
   - `AppNavigator`: Navegación basada en roles
   - `Screens`: Interfaces de usuario por rol
   - `Components`: Componentes reutilizables
   - `Services`: Comunicación con API

2. **Lógica de Negocio (Backend)**
   - `Routes`: Definición de endpoints API
   - `Controllers`: Lógica de negocio
   - `Models`: Interacción con base de datos

3. **Persistencia**
   - `Database`: Almacenamiento de datos

## Flujo de Información Típico

1. **Inicio de App**: `App.js` → `AuthProvider` → `AppNavigator`
2. **Autenticación**: `LoginScreen` → `apiService.login()` → `AuthController` → `User Model` → DB
3. **Navegación**: Basada en roles del usuario autenticado
4. **Operaciones**: `Screen` → `apiService.method()` → `Controller` → `Model` → DB → Respuesta JSON
5. **UI Update**: Datos renderizados en componentes

## Archivos Clave para Desarrollo

- **Autenticación**: `AuthContext.js`, `api.js`, `AuthController.php`
- **Navegación**: `AppNavigator.js`, `PatientTabs.js`, `DoctorTabs.js`
- **Pantallas**: `PatientDashboard.js`, `DoctorAppointments.js`, etc.
- **API**: `api.js`, `routes/api.php`, `Controllers`
- **Modelos**: `Models/*.php`
- **Componentes**: `components/ui/*.js`
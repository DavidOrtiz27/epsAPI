# 📅 Componentes de Selección Mejorados

Este documento describe los nuevos componentes de selección implementados para mejorar la experiencia del usuario y evitar errores de digitación.

## 🗓️ CustomDatePicker

Componente para seleccionar fechas de forma visual e intuitiva.

### Características
- ✅ Selector visual de fecha nativo
- ✅ Validación automática de fechas
- ✅ Prevención de errores de formato
- ✅ Soporte para fechas mínimas y máximas
- ✅ Formato consistente (YYYY-MM-DD)
- ✅ Localización en español

### Uso
```jsx
import { CustomDatePicker } from '../../components/ui';

<CustomDatePicker
  label="Fecha de nacimiento"
  value={formData.fecha_nacimiento}
  onDateChange={(date) => setFechaNacimiento(date)}
  placeholder="Seleccionar fecha de nacimiento"
  error={errors.fecha_nacimiento}
  maximumDate={new Date()} // No fechas futuras
  minimumDate={new Date(new Date().getFullYear() - 120, 0, 1)} // Máximo 120 años atrás
/>
```

### Props
- `label` (string): Etiqueta del campo
- `value` (string): Valor actual en formato YYYY-MM-DD
- `onDateChange` (function): Callback cuando cambia la fecha
- `placeholder` (string): Texto placeholder
- `error` (string): Mensaje de error a mostrar
- `maximumDate` (Date): Fecha máxima seleccionable
- `minimumDate` (Date): Fecha mínima seleccionable
- `disabled` (boolean): Deshabilitar el componente

## 👤 CustomGenderPicker

Componente para seleccionar género de forma visual con opciones predefinidas.

### Características
- ✅ Opciones predefinidas (Masculino, Femenino, Otro)
- ✅ Iconos visuales para cada opción
- ✅ Modal con lista seleccionable
- ✅ Prevención de errores de formato
- ✅ Interfaz intuitiva

### Uso
```jsx
import { CustomGenderPicker } from '../../components/ui';

<CustomGenderPicker
  label="Género"
  value={formData.genero}
  onGenderChange={(gender) => setGenero(gender)}
  placeholder="Seleccionar género"
  error={errors.genero}
/>
```

### Props
- `label` (string): Etiqueta del campo
- `value` (string): Valor actual ('M', 'F', 'O')
- `onGenderChange` (function): Callback cuando cambia el género
- `placeholder` (string): Texto placeholder
- `error` (string): Mensaje de error a mostrar
- `disabled` (boolean): Deshabilitar el componente

### Valores de retorno
- `'M'`: Masculino
- `'F'`: Femenino
- `'O'`: Otro

## 🔧 Implementación en Pantallas

### RegisterScreen.js
Se han actualizado los campos de fecha de nacimiento y género para usar los nuevos componentes.

### PatientProfile.js
Se han actualizado los campos existentes reemplazando la implementación manual por los componentes reutilizables.

## 📱 Validaciones Mejoradas

### Fecha de Nacimiento
```javascript
// Validación automática en RegisterScreen
if (formData.fecha_nacimiento) {
  const date = new Date(formData.fecha_nacimiento);
  if (isNaN(date.getTime())) {
    newErrors.fecha_nacimiento = 'Fecha inválida';
  } else {
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    
    if (date > today) {
      newErrors.fecha_nacimiento = 'La fecha no puede ser futura';
    } else if (age < 18) {
      newErrors.fecha_nacimiento = 'Debes tener al menos 18 años';
    } else if (age > 120) {
      newErrors.fecha_nacimiento = 'Fecha de nacimiento no válida';
    }
  }
}
```

## 🎨 Beneficios

### Experiencia del Usuario
- ✅ **Más intuitivo**: Selectores visuales en lugar de texto libre
- ✅ **Menos errores**: Prevención de errores de formato y digitación
- ✅ **Más rápido**: Selección con taps en lugar de escribir
- ✅ **Consistente**: Interfaz uniforme en toda la app

### Para Desarrolladores
- ✅ **Reutilizable**: Componentes que se pueden usar en múltiples pantallas
- ✅ **Mantenible**: Lógica centralizada en un solo lugar
- ✅ **Validación automática**: Prevención de datos incorrectos
- ✅ **Tipado consistente**: Formato estandarizado para la base de datos

## 🚀 Próximas Mejoras

1. **Selector de Países**: Para campos de nacionalidad
2. **Selector de Ciudades**: Para campos de lugar de nacimiento
3. **Selector de Especialidades**: Para registro de médicos
4. **Selector de Horarios**: Para disponibilidad médica

## 📋 Instalación de Dependencias

```bash
# Para DateTimePicker
expo install @react-native-community/datetimepicker
```
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const CustomDatePicker = ({
  label,
  value,
  onDateChange,
  error,
  placeholder = 'Seleccionar fecha',
  maximumDate,
  minimumDate,
  style,
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Convert string date to Date object if needed
  const getDateValue = () => {
    if (!value) return null;
    if (value instanceof Date) return value;
    return new Date(value);
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios'); // Keep open on iOS, close on Android
    
    if (selectedDate) {
      // Format date as YYYY-MM-DD for backend compatibility
      const formattedDate = selectedDate.toISOString().split('T')[0];
      onDateChange(formattedDate);
    }
  };

  const openDatePicker = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const dateValue = getDateValue();

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.dateButton,
          error && styles.dateButtonError,
          disabled && styles.dateButtonDisabled
        ]}
        onPress={openDatePicker}
        disabled={disabled}
      >
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color={disabled ? "#ccc" : "#666"} 
          style={styles.icon}
        />
        <Text style={[
          styles.dateText,
          !value && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={disabled ? "#ccc" : "#666"} 
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <DateTimePicker
          value={dateValue || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          locale="es-ES"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  dateButtonError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  dateButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  icon: {
    marginRight: 12,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  disabledText: {
    color: '#ccc',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4444',
    marginTop: 4,
    marginLeft: 4,
  },
});

export default CustomDatePicker;
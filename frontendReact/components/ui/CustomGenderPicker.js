import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomGenderPicker = ({
  label,
  value,
  onGenderChange,
  error,
  placeholder = 'Seleccionar género',
  style,
  disabled = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const genderOptions = [
    { key: 'M', label: 'Masculino', icon: 'male' },
    { key: 'F', label: 'Femenino', icon: 'female' },
    { key: 'O', label: 'Otro', icon: 'transgender' },
  ];

  const getGenderLabel = (key) => {
    const option = genderOptions.find(opt => opt.key === key);
    return option ? option.label : '';
  };

  const getGenderIcon = (key) => {
    const option = genderOptions.find(opt => opt.key === key);
    return option ? option.icon : 'person';
  };

  const handleGenderSelect = (gender) => {
    onGenderChange(gender.key);
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={[
          styles.genderButton,
          error && styles.genderButtonError,
          disabled && styles.genderButtonDisabled
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}
      >
        <Ionicons 
          name={value ? getGenderIcon(value) : 'male-female-outline'} 
          size={20} 
          color={disabled ? "#ccc" : "#666"} 
          style={styles.icon}
        />
        <Text style={[
          styles.genderText,
          !value && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {value ? getGenderLabel(value) : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={16} 
          color={disabled ? "#ccc" : "#666"} 
        />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Género</Text>
              <TouchableOpacity
                onPress={() => setShowPicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={genderOptions}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    value === item.key && styles.selectedOption
                  ]}
                  onPress={() => handleGenderSelect(item)}
                >
                  <Ionicons 
                    name={item.icon} 
                    size={24} 
                    color={value === item.key ? "#007AFF" : "#666"} 
                  />
                  <Text style={[
                    styles.optionText,
                    value === item.key && styles.selectedOptionText
                  ]}>
                    {item.label}
                  </Text>
                  {value === item.key && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  genderButton: {
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
  genderButtonError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff5f5',
  },
  genderButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  icon: {
    marginRight: 12,
  },
  genderText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    maxHeight: 300,
    minWidth: 280,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  selectedOption: {
    backgroundColor: '#f0f8ff',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default CustomGenderPicker;
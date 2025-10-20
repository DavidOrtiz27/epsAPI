// Ejemplo de uso de SafeAreaWrapper en pantallas

// 1. Para pantallas con Tab Navigation (como DoctorProfile, DoctorAppointments, etc.)
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaTabScreen } from '../../components';

const ExampleTabScreen = () => {
  return (
    <SafeAreaTabScreen backgroundColor="#f5f5f5">
      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 20 }}>
          <Text>Esta pantalla respeta las safe areas y los botones de navegación</Text>
          {/* Tu contenido aquí */}
        </View>
      </ScrollView>
    </SafeAreaTabScreen>
  );
};

// 2. Para pantallas modales o full screen
import { SafeAreaFullScreen } from '../../components';

const ExampleModalScreen = () => {
  return (
    <SafeAreaFullScreen backgroundColor="#ffffff">
      <View style={{ flex: 1, padding: 20 }}>
        <Text>Pantalla modal que evita botones de navegación</Text>
        {/* Tu contenido aquí */}
      </View>
    </SafeAreaFullScreen>
  );
};

// 3. Para pantallas específicas de Android con botones de navegación
import { SafeAreaAndroidNavigation } from '../../components';

const ExampleAndroidScreen = () => {
  return (
    <SafeAreaAndroidNavigation backgroundColor="#ffffff">
      <View style={{ flex: 1, padding: 20 }}>
        <Text>Maneja específicamente los botones de Android</Text>
        {/* Tu contenido aquí */}
      </View>
    </SafeAreaAndroidNavigation>
  );
};

export { ExampleTabScreen, ExampleModalScreen, ExampleAndroidScreen };
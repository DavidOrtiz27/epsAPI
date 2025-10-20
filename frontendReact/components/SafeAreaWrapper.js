import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Platform, StatusBar } from 'react-native';

/**
 * Componente wrapper que maneja automáticamente las safe areas
 * y los espacios ocupados por botones de navegación del sistema
 */
const SafeAreaWrapper = ({ 
  children, 
  backgroundColor = '#ffffff',
  edges = ['top', 'bottom', 'left', 'right'],
  forceInset = null,
  style = {}
}) => {
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor },
        style
      ]}
      edges={edges}
      forceInset={forceInset}
    >
      {children}
    </SafeAreaView>
  );
};

/**
 * Para pantallas con Tab Navigator - solo protege arriba
 */
export const SafeAreaTabScreen = ({ children, backgroundColor = '#ffffff', style = {} }) => {
  return (
    <SafeAreaWrapper
      backgroundColor={backgroundColor}
      edges={['top', 'left', 'right']} // No incluir bottom porque el Tab Bar lo maneja
      style={style}
    >
      {children}
    </SafeAreaWrapper>
  );
};

/**
 * Para pantallas modales o full screen - protege todos los lados
 */
export const SafeAreaFullScreen = ({ children, backgroundColor = '#ffffff', style = {} }) => {
  return (
    <SafeAreaWrapper
      backgroundColor={backgroundColor}
      edges={['top', 'bottom', 'left', 'right']}
      style={style}
    >
      {children}
    </SafeAreaWrapper>
  );
};

/**
 * Para pantallas con header personalizado - solo protege abajo y lados
 */
export const SafeAreaWithCustomHeader = ({ children, backgroundColor = '#ffffff', style = {} }) => {
  return (
    <SafeAreaWrapper
      backgroundColor={backgroundColor}
      edges={['bottom', 'left', 'right']}
      style={style}
    >
      {children}
    </SafeAreaWrapper>
  );
};

/**
 * Para manejar específicamente los botones de navegación del sistema Android
 */
export const SafeAreaAndroidNavigation = ({ children, backgroundColor = '#ffffff', style = {} }) => {
  const androidEdges = Platform.OS === 'android' 
    ? ['top', 'bottom', 'left', 'right'] 
    : ['top', 'left', 'right'];

  return (
    <SafeAreaWrapper
      backgroundColor={backgroundColor}
      edges={androidEdges}
      style={[
        Platform.OS === 'android' && styles.androidNavigation,
        style
      ]}
    >
      {children}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  androidNavigation: {
    // Padding adicional para Android cuando hay botones de navegación
    paddingBottom: Platform.OS === 'android' ? 5 : 0,
  },
});

export default SafeAreaWrapper;
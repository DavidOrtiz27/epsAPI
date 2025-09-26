import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.3);
  const textFadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Start logo animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 15,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Start text animation after logo
    setTimeout(() => {
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 600);

    // Hide splash after 3.5 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/mapu.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Animated.View style={{ opacity: textFadeAnim }}>
          <Text style={styles.appName}>MAPU</Text>
          <Text style={styles.tagline}>Sistema Médico</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.95,
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
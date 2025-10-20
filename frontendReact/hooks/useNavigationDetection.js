import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';

export const useNavigationDetection = () => {
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const [navigationInfo, setNavigationInfo] = useState({
    platform: Platform.OS,
    screenWidth: Dimensions.get('window').width,
    screenHeight: Dimensions.get('window').height,
    isTablet: false,
    currentRoute: null,
    routeHistory: [],
  });

  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    const isTablet = width >= 768 || height >= 768;
    
    // Get current route name
    const getCurrentRoute = (state) => {
      if (!state) return null;
      
      const route = state.routes[state.index];
      if (route.state) {
        return getCurrentRoute(route.state);
      }
      return route.name;
    };

    const currentRoute = getCurrentRoute(navigationState);

    setNavigationInfo(prev => ({
      ...prev,
      platform: Platform.OS,
      screenWidth: width,
      screenHeight: height,
      isTablet,
      currentRoute,
      navigationState,
    }));

    // Listen for dimension changes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const isTabletSize = window.width >= 768 || window.height >= 768;
      setNavigationInfo(prev => ({
        ...prev,
        screenWidth: window.width,
        screenHeight: window.height,
        isTablet: isTabletSize,
      }));
    });

    return () => subscription?.remove();
  }, [navigationState]);

  // Additional navigation utilities
  const isLandscape = navigationInfo.screenWidth > navigationInfo.screenHeight;
  const isPortrait = navigationInfo.screenHeight > navigationInfo.screenWidth;
  const deviceType = navigationInfo.isTablet ? 'tablet' : 'phone';

  return {
    ...navigationInfo,
    isLandscape,
    isPortrait,
    deviceType,
    navigation,
  };
};

export default useNavigationDetection;
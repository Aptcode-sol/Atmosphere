/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View, Linking } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import LandingPage from './src/screens/LandingPage';
import SignIn from './src/screens/SignIn';
import SignUp from './src/screens/SignUp';
import ForgotPassword from './src/screens/ForgotPassword';
import ThemeProvider from './src/contexts/ThemeContext';
import { AlertProvider } from './src/components/CustomAlert';

// Inner component that can use the safe area hook
function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<'signin' | 'signup' | 'home' | 'forgotpw'>('signin');
  const [initialDeepLink, setInitialDeepLink] = useState<string | null>(null);

  // Handle deep links
  useEffect(() => {
    // Handle initial URL when app opens from link
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        setInitialDeepLink(url);
      }
    };
    handleInitialURL();

    // Listen for incoming links while app is running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url) {
        setInitialDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // On app start, check for existing token and user to persist login
    const checkAuth = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const token = await AsyncStorage.getItem('token');
        if (token && route !== 'home') {
          setRoute('home');
        } else if (!token && route === 'home') {
          // Token was cleared (logout), go back to signin
          setRoute('signin');
        }
      } catch {
        // ignore
      }
    };

    // Check immediately on mount
    checkAuth();

    // Also check periodically for logout detection in release mode
    const interval = setInterval(checkAuth, 500);
    return () => clearInterval(interval);
  }, [route]);

  const isAuthRoute = ['signin', 'signup', 'forgotpw'].includes(route);

  // Use dynamic insets from useSafeAreaInsets - works on all phone generations
  // Note: paddingBottom is handled by BottomNav component, not here
  const viewStyle = {
    flex: 1,
    paddingTop: isAuthRoute ? 0 : insets.top,
    backgroundColor: isDarkMode ? '#000' : '#fff',
  };

  return (
    <View style={viewStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {route === 'signin' && (
        <SignIn
          onSignUp={() => setRoute('signup')}
          onSignedIn={() => setRoute('home')}
          onForgotPassword={() => setRoute('forgotpw')}
        />
      )}
      {route === 'signup' && (
        <SignUp onSignedUp={() => setRoute('home')} onSignIn={() => setRoute('signin')} />
      )}
      {route === 'forgotpw' && (
        <ForgotPassword
          onBack={() => setRoute('signin')}
          onResetSuccess={() => setRoute('signin')}
        />
      )}
      {route === 'home' && (
        <LandingPage
          initialDeepLink={initialDeepLink}
          onDeepLinkHandled={() => setInitialDeepLink(null)}
        />
      )}
    </View>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ThemeProvider initialMode={isDarkMode ? 'dark' : 'light'}>
      <AlertProvider>
        <SafeAreaProvider>
          <AppContent />
        </SafeAreaProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}

export default App;


/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from 'react-native-safe-area-context';
import LandingPage from './src/screens/LandingPage';
import SignIn from './src/screens/SignIn';
import SignUp from './src/screens/SignUp';
import ForgotPassword from './src/screens/ForgotPassword';
import ThemeProvider from './src/contexts/ThemeContext';

// Inner component that can use the safe area hook
function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState<'signin' | 'signup' | 'home' | 'forgotpw'>('signin');

  useEffect(() => {
    // On app start, check for existing token and user to persist login
    (async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setRoute('home');
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const isAuthRoute = ['signin', 'signup', 'forgotpw'].includes(route);

  // Use dynamic insets from useSafeAreaInsets - works on all phone generations
  const viewStyle = {
    flex: 1,
    paddingTop: isAuthRoute ? 0 : insets.top,
    paddingBottom: isAuthRoute ? 0 : insets.bottom, // Use exact device inset, no minimum
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
      {route === 'home' && <LandingPage />}
    </View>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ThemeProvider initialMode={isDarkMode ? 'dark' : 'light'}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;


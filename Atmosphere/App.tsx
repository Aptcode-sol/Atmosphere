/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider
} from 'react-native-safe-area-context';
import LandingPage from './src/screens/LandingPage';
import SignIn from './src/screens/SignIn';
import SignUp from './src/screens/SignUp';
import ThemeProvider from './src/contexts/ThemeContext';
import { TOP_PANEL_HEIGHT, BOTTOM_NAV_HEIGHT } from './src/lib/layout';


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [route, setRoute] = useState<'signin' | 'signup' | 'home'>('signin');

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

  const viewStyle = {
    flex: 1,
    paddingTop: TOP_PANEL_HEIGHT,
    paddingBottom: BOTTOM_NAV_HEIGHT,
    backgroundColor: isDarkMode ? '#000' : '#fff',
  };

  return (
    <ThemeProvider initialMode={isDarkMode ? 'dark' : 'light'}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={viewStyle}>
          {route === 'signin' && (
            <SignIn onSignUp={() => setRoute('signup')} onSignedIn={() => setRoute('home')} />
          )}
          {route === 'signup' && (
            <SignUp onSignedUp={() => setRoute('home')} onSignIn={() => setRoute('signin')} />
          )}
          {route === 'home' && <LandingPage />}
        </View>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

export default App;

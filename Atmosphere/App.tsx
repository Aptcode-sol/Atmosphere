/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import {
  SafeAreaProvider
} from 'react-native-safe-area-context';
import Home from './src/screens/Home';
import SignIn from './src/screens/SignIn';
import SignUp from './src/screens/SignUp';
import ThemeProvider from './src/contexts/ThemeContext';


function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [route, setRoute] = useState<'signin' | 'signup' | 'home'>('signin');

  return (
    <ThemeProvider initialMode={isDarkMode ? 'dark' : 'light'}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        {route === 'signin' && (
          <SignIn onSignUp={() => setRoute('signup')} onSignedIn={() => setRoute('home')} />
        )}
        {route === 'signup' && (
          <SignUp onSignedUp={() => setRoute('home')} onSignIn={() => setRoute('signin')} />
        )}
        {route === 'home' && <Home onLogout={() => setRoute('signin')} />}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}


export default App;

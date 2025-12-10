import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LandingPage from '../screens/LandingPage';
import Profile from '../screens/Profile';
import PostDetail from '../screens/PostDetail';
import ChatDetail from '../screens/ChatDetail';
import SetupProfile from '../screens/SetupProfile';

export type RootStackParamList = {
    Landing: undefined;
    Profile: { userId?: string } | undefined;
    PostDetail: { postId: string };
    ChatDetail: { chatId: string };
    SetupProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Landing" component={LandingPage} />
                <Stack.Screen name="Profile" component={Profile} />
                <Stack.Screen name="PostDetail" component={PostDetail} />
                <Stack.Screen name="ChatDetail" component={ChatDetail} />
                <Stack.Screen name="SetupProfile" component={SetupProfile} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

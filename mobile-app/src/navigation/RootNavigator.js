import { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts } from 'expo-font';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Home, MessageCircle, Plus, Search, User } from 'lucide-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { api } from '../api';
import { Couleurs, Polices, POLICE_SOURCES } from '../theme';

import FeedScreen from '../screens/FeedScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SouhaitsScreen from '../screens/SouhaitsScreen';
import PublishScreen from '../screens/PublishScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ThreadScreen from '../screens/ThreadScreen';
import MonDjassaScreen from '../screens/MonDjassaScreen';
import ProDashboardScreen from '../screens/ProDashboardScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Icône messages avec pastille non lus */
function MessagesTabIcon({ focused, color }) {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let alive = true;
    const poll = async () => {
      try {
        const { data } = await api.get('/messages/unread-count');
        if (alive) setUnread(data.unread ?? 0);
      } catch {
        /* silencieux */
      }
    };
    poll();
    const t = setInterval(poll, 12000);
    return () => { alive = false; clearInterval(t); };
  }, [isAuthenticated]);

  return (
    <View>
      <MessageCircle size={21} strokeWidth={focused ? 2.6 : 2} color={color} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </View>
  );
}

/** Bouton central `+` rouge (Publier) — cercle surélevé */
function PublishTabButton({ children, onPress, accessibilityState }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Publier une annonce"
      accessibilityState={accessibilityState}
      style={styles.publishButtonWrap}
    >
      <View style={styles.publishButton}>
        <Plus size={28} strokeWidth={3} color="#fff" />
      </View>
      <Text style={styles.publishLabel}>Publier</Text>
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Couleurs.red,
        tabBarInactiveTintColor: Couleurs.slate,
        tabBarLabelStyle: { fontFamily: Polices.interSemi, fontSize: 9, marginBottom: 2 },
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: 'rgba(18,18,18,0.08)',
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={FeedScreen}
        options={{ tabBarIcon: ({ focused, color }) => <Home size={21} strokeWidth={focused ? 2.6 : 2} color={color} /> }}
      />
      <Tab.Screen
        name="Souhaits"
        component={SouhaitsScreen}
        options={{ tabBarIcon: ({ focused, color }) => <Search size={21} strokeWidth={focused ? 2.6 : 2} color={color} /> }}
      />
      <Tab.Screen
        name="Publier"
        component={PublishScreen}
        options={{ tabBarButton: (props) => <PublishTabButton {...props} /> }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarIcon: ({ focused, color }) => <MessagesTabIcon focused={focused} color={color} /> }}
      />
      <Tab.Screen
        name="Mon Djassa"
        component={MonDjassaScreen}
        options={{ tabBarIcon: ({ focused, color }) => <User size={21} strokeWidth={focused ? 2.6 : 2} color={color} /> }}
      />
    </Tab.Navigator>
  );
}

function AuthFlow() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function RootNavigator() {
  const { booted, isAuthenticated } = useAuth();

  if (!booted) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>Djassa<Text style={styles.splashLogoRed}> Online</Text></Text>
        <ActivityIndicator color={Couleurs.red} style={{ marginTop: 18 }} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Article" component={ProductDetailScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="Thread" component={ThreadScreen} />
          <Stack.Screen name="ProDashboard" component={ProDashboardScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthFlow} />
      )}
    </Stack.Navigator>
  );
}

const linking = {
  prefixes: ['djassa://', 'https://djassaonline.ci', 'http://127.0.0.1:8099'],
  config: {
    screens: {
      Auth: 'connexion',
      MainTabs: {
        screens: {
          Accueil: '',
          Souhaits: 'souhaits',
          Publier: 'publier',
          Messages: 'messages',
          'Mon Djassa': 'moi',
        },
      },
      Article: 'article/:id',
      Thread: 'messages/:partnerId',
      ProDashboard: 'pro/dashboard',
    },
  },
};

export default function Root() {
  const [fontsLoaded] = useFonts(POLICE_SOURCES);

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={Couleurs.red} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer linking={linking} theme={{ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: Couleurs.cloud } }}>
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Couleurs.black, alignItems: 'center', justifyContent: 'center' },
  splashLogo: { fontFamily: Polices.jakarta, fontSize: 28, color: '#fff' },
  splashLogoRed: { color: Couleurs.red },
  badge: {
    position: 'absolute', top: -4, right: -6, minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: Couleurs.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  publishButtonWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: Platform.OS === 'ios' ? 18 : 8 },
  publishButton: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Couleurs.red, marginTop: -28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Couleurs.red, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12, elevation: 10,
  },
  publishLabel: { color: Couleurs.red, fontFamily: Polices.interSemi, fontSize: 9, marginTop: 2 },
});

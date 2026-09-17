import '../global.css'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { I18nextProvider } from 'react-i18next'
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter'
import { AuthProvider, useAuth } from '../lib/auth-context'
import i18n from '../lib/i18n'
import { resolveInitialLanguage, adoptAccountLanguage } from '../lib/language'

SplashScreen.preventAutoHideAsync().catch(() => {})

// Adopts the authenticated customer's preferred_language once it loads,
// unless the user has already made an explicit in-app choice (see
// lib/language.ts's adoptAccountLanguage).
function LanguageSync() {
  const { customer } = useAuth()
  useEffect(() => {
    adoptAccountLanguage(customer?.preferred_language)
  }, [customer?.preferred_language])
  return null
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  })
  const [languageReady, setLanguageReady] = useState(false)

  useEffect(() => {
    resolveInitialLanguage().then((lang) => i18n.changeLanguage(lang).finally(() => setLanguageReady(true)))
  }, [])

  useEffect(() => {
    if (fontsLoaded && languageReady) SplashScreen.hideAsync().catch(() => {})
  }, [fontsLoaded, languageReady])

  if (!fontsLoaded || !languageReady) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <I18nextProvider i18n={i18n}>
          <AuthProvider>
            <LanguageSync />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F3F4FD' } }} />
          </AuthProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

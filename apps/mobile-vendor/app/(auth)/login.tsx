import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { isValidIndianPhone, formatPhone } from '@kurnool-mall/shared-utils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/Button'

type Step = 'phone' | 'otp'

export default function Login() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function sendOtp() {
    if (!isValidIndianPhone(phone)) {
      Alert.alert('Invalid phone', 'Enter a 10-digit Indian mobile number.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({ phone: formatPhone(phone) })
    setSubmitting(false)
    if (error) {
      Alert.alert('Could not send OTP', error.message)
      return
    }
    setStep('otp')
  }

  async function verifyOtp() {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Enter the 6-digit code we sent.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.verifyOtp({
      phone: formatPhone(phone),
      token: otp,
      type: 'sms',
    })
    setSubmitting(false)
    if (error) {
      Alert.alert('Verification failed', error.message)
      return
    }
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 px-6 pt-12"
      >
        <Text className="text-3xl font-bold text-brand">🛒 Kurnool Mall</Text>
        <Text className="mt-2 text-base text-gray-600">
          {step === 'phone'
            ? 'Enter your mobile number to continue'
            : `OTP sent to +91 ${phone}`}
        </Text>

        {step === 'phone' ? (
          <View className="mt-8">
            <View className="flex-row items-center border border-gray-300 rounded-xl px-4">
              <Text className="text-base text-gray-500 pr-2">+91</Text>
              <TextInput
                autoFocus
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
                placeholder="98765 43210"
                className="flex-1 h-14 text-base text-gray-900"
              />
            </View>
            <View className="mt-6">
              <Button size="lg" loading={submitting} onPress={sendOtp}>
                Send OTP
              </Button>
            </View>
          </View>
        ) : (
          <View className="mt-8">
            <TextInput
              autoFocus
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="••••••"
              className="border border-gray-300 rounded-xl h-14 text-center text-2xl tracking-[8px] text-gray-900"
            />
            <View className="mt-6">
              <Button size="lg" loading={submitting} onPress={verifyOtp}>
                Verify
              </Button>
            </View>
            <View className="mt-3">
              <Button size="sm" variant="ghost" onPress={() => setStep('phone')}>
                Change number
              </Button>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

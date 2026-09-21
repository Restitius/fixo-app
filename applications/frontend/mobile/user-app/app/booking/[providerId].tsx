// Real booking wizard — service_id -> service request -> submit -> match ->
// quote -> confirm -> authorize payment. Mirrors web's book.tsx "Find
// Provider First" path (mobile always arrives via a specific provider), using
// the real customer booking workflow end-to-end. The old per-category item
// configurators (room counts, car plates, paint colors, laundry kg, ...) had
// no backend counterpart at all — pricing here comes from the provider's real
// service catalog, not fabricated line items.
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import PaymentIcon from '../../components/PaymentIcon'
import { CenterModal } from '../../components/Sheet'
import {
  bookingApi,
  fixoSdk,
  type Address,
  type MatchCandidate,
  type PaymentMethod,
  type ProviderProfile,
  type Quote,
  type ServiceRequestRow,
  type WalletBalance,
  ApiError,
} from '../../lib/api-client'
import { fmtMoney, initialsOf } from '../../lib/format'
import {
  ArrowLeftIcon,
  BackspaceIcon,
  CheckCircleIcon,
  LocationIcon,
  PlusIcon,
  ShieldCheckIcon,
  StarIcon,
} from '../../components/icons'

type Step = 'service' | 'details' | 'address' | 'review' | 'provider' | 'payment' | 'pin'

const STEP_ORDER: Step[] = ['service', 'details', 'address', 'review', 'provider', 'payment', 'pin']

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BookingFlow() {
  const { t, i18n } = useTranslation('booking')
  const TIME_WINDOWS = [
    { value: 'MORNING', label: t('details.morning'), hint: t('details.morningHint') },
    { value: 'AFTERNOON', label: t('details.afternoon'), hint: t('details.afternoonHint') },
    { value: 'EVENING', label: t('details.evening'), hint: t('details.eveningHint') },
  ] as const
  const { providerId = '' } = useLocalSearchParams<{ providerId: string }>()
  const [provider, setProvider] = useState<ProviderProfile | null>(null)
  const [loadError, setLoadError] = useState(false)

  const [step, setStep] = useState<Step>('service')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  const [description, setDescription] = useState('')
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [preferredDate, setPreferredDate] = useState<Date | null>(null)
  const [timeWindow, setTimeWindow] = useState<(typeof TIME_WINDOWS)[number]['value'] | null>(null)

  const [addresses, setAddresses] = useState<Address[] | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addrDraft, setAddrDraft] = useState({ label: 'Home', recipient_name: '', phone: '', street_address: '', city: '', region: '' })
  const [savingAddress, setSavingAddress] = useState(false)

  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null)
  const [promoId, setPromoId] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)
  const [validatingPromo, setValidatingPromo] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [request, setRequest] = useState<ServiceRequestRow | null>(null)
  const [reviewIssue, setReviewIssue] = useState<string | null>(null)

  const [matching, setMatching] = useState(false)
  const [matchOutcome, setMatchOutcome] = useState<string | null>(null)
  const [matches, setMatches] = useState<MatchCandidate[] | null>(null)
  const [quotes, setQuotes] = useState<Quote[] | null>(null)
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<string | null>(null)

  const [booking, setBooking] = useState<Awaited<ReturnType<typeof bookingApi.confirmBooking>> | null>(null)
  const [authorizing, setAuthorizing] = useState(false)
  const [wallet, setWallet] = useState<WalletBalance | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[] | null>(null)

  const [pin, setPin] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    bookingApi.getProviderProfile(providerId).then(setProvider).catch(() => setLoadError(true))
  }, [providerId])

  useEffect(() => {
    bookingApi.listAddresses().then((rows) => {
      setAddresses(rows)
      const def = rows.find((a) => a.is_default) ?? rows[0]
      if (def) setSelectedAddressId(def.address_id)
      else setShowAddressForm(true)
    }).catch(() => setAddresses([]))
  }, [])

  useEffect(() => {
    if (step !== 'provider' || !request || matchOutcome !== null) return
    setMatching(true)
    bookingApi
      .runMatching(request.request_id)
      .then(async (res) => {
        setMatchOutcome(res.outcome)
        setMatches(res.matches)
        if (res.outcome === 'MATCHING') setQuotes(await bookingApi.listQuotes(request.request_id))
      })
      .catch(() => setMatchOutcome('ERROR'))
      .finally(() => setMatching(false))
  }, [step, request, matchOutcome])

  useEffect(() => {
    if (step !== 'payment') return
    fixoSdk.walletBalance().then(setWallet).catch(() => setWallet(null))
    fixoSdk.listPaymentMethods().then(setPaymentMethods).catch(() => setPaymentMethods([]))
  }, [step])

  if (loadError) return null
  if (!provider) return null

  const selectedService = provider.services.find((s) => s.service_id === selectedServiceId) ?? null
  const subtotal = selectedService?.base_amount ?? 0
  const total = subtotal - (promoDiscount ?? 0)
  const selectedAddress = addresses?.find((a) => a.address_id === selectedAddressId) ?? null
  const stepIndex = STEP_ORDER.indexOf(step)

  const sortedQuotes = quotes
    ? [...quotes].sort((a, b) => (a.provider_id === providerId ? -1 : b.provider_id === providerId ? 1 : b.rating_avg - a.rating_avg))
    : []

  function goNext() {
    const next = STEP_ORDER[stepIndex + 1]
    if (next) setStep(next)
  }
  function goBack() {
    const prev = STEP_ORDER[stepIndex - 1]
    if (prev) setStep(prev)
    else router.replace(`/service/${providerId}` as any)
  }

  async function saveNewAddress() {
    if (!addrDraft.recipient_name.trim() || !addrDraft.phone.trim() || !addrDraft.street_address.trim() || !addrDraft.city.trim()) return
    setSavingAddress(true)
    try {
      const created = await bookingApi.createAddress({
        label: addrDraft.label || 'Home',
        recipient_name: addrDraft.recipient_name,
        phone: addrDraft.phone,
        street_address: addrDraft.street_address,
        city: addrDraft.city,
        region: addrDraft.region || null,
        is_default: (addresses ?? []).length === 0,
      })
      setAddresses((prev) => [...(prev ?? []), created])
      setSelectedAddressId(created.address_id)
      setShowAddressForm(false)
    } finally {
      setSavingAddress(false)
    }
  }

  async function applyPromo() {
    setPromoError(null)
    if (!promoCode.trim() || !subtotal) return
    setValidatingPromo(true)
    try {
      const res = await fixoSdk.validatePromotion(promoCode.trim(), subtotal)
      setPromoDiscount(res.discount_amount)
      setPromoId(res.promo_id)
    } catch {
      setPromoError(t('review.promoInvalid'))
      setPromoDiscount(null)
      setPromoId(null)
    } finally {
      setValidatingPromo(false)
    }
  }

  async function submitRequest() {
    if (!selectedService || !selectedAddressId) return
    setSubmitting(true)
    setReviewIssue(null)
    try {
      const created = await bookingApi.createServiceRequest({
        service_id: selectedService.service_id,
        description: description.trim(),
        address_id: selectedAddressId,
        ...(preferredDate ? { preferred_date: formatDate(preferredDate) } : {}),
        ...(timeWindow ? { time_window: timeWindow } : {}),
      })
      const submitted = await bookingApi.submitServiceRequest(created.request_id)
      setRequest(submitted)
      if (submitted.status === 'VALID') setStep('provider')
      else setReviewIssue(submitted.validation_notes ?? `Request status: ${submitted.status}`)
    } catch (err) {
      setReviewIssue(err instanceof ApiError ? err.message : t('review.genericError'))
    } finally {
      setSubmitting(false)
    }
  }

  async function chooseQuote(quote: Quote) {
    if (!request) return
    setAcceptingQuoteId(quote.quote_id)
    try {
      await bookingApi.selectProvider(request.request_id, quote.provider_id)
      await bookingApi.acceptQuote(quote.quote_id)
      const confirmed = await bookingApi.confirmBooking(quote.quote_id)
      if (promoId) await fixoSdk.usePromotion(promoId).catch(() => {})
      setBooking(confirmed)
      setStep('payment')
    } catch {
      // leave the quote list up so the user can try another provider
    } finally {
      setAcceptingQuoteId(null)
    }
  }

  async function authorizePayment() {
    if (!booking) return
    setAuthorizing(true)
    try {
      const updated = await bookingApi.authorizeBookingPayment(booking.booking_id)
      setBooking(updated)
      setStep('pin')
    } catch {
      // stay on Payment; the button remains available to retry
    } finally {
      setAuthorizing(false)
    }
  }

  const canLeaveService = !!selectedService
  const canLeaveDetails = description.trim().length >= 10
  const canLeaveAddress = !!selectedAddressId && !showAddressForm

  const headerTitle =
    step === 'service' ? t('header.service')
    : step === 'details' ? t('header.details')
    : step === 'address' ? t('header.address')
    : step === 'review' ? t('header.review')
    : step === 'provider' ? t('header.provider')
    : step === 'payment' ? t('header.payment')
    : t('header.pin')

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScreenHeader title={headerTitle} onBack={goBack} />

        {step === 'service' && (
          <View className="flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <View className="px-6 pt-2">
                <Text className="text-[14px] text-muted mb-4">{t('service.realServicesBy', { name: provider.display_name })}</Text>
                <View className="flex-col gap-3">
                  {provider.services.length === 0 ? (
                    <Text className="text-[13px] text-muted">{t('service.noServices')}</Text>
                  ) : (
                    provider.services.map((s) => {
                      const active = selectedServiceId === s.service_id
                      return (
                        <Pressable
                          key={s.service_id}
                          onPress={() => setSelectedServiceId(s.service_id)}
                          className={`flex-row items-center justify-between rounded-2xl p-4 ${active ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'}`}
                        >
                          <Text className="text-[14px] font-medium text-ink flex-1 pr-3">{s.name}</Text>
                          <Text className="font-bold text-primary">{fmtMoney(s.base_amount)}</Text>
                        </Pressable>
                      )
                    })
                  )}
                </View>
              </View>
            </ScrollView>
            <StepFooter label={t('service.continue')} onNext={goNext} disabled={!canLeaveService} />
          </View>
        )}

        {step === 'details' && (
          <View className="flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <View className="px-6 pt-2">
                <Text className="text-[14px] font-semibold text-ink mb-2">{t('details.describeJob')}</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('details.placeholder')}
                  placeholderTextColor="#9e9e9e"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[14px] text-ink min-h-[110px]"
                />
                <Text className="text-[11px] text-muted mt-1 text-right">{t('details.minChars', { count: description.trim().length })}</Text>

                <Text className="text-[14px] font-semibold text-ink mt-6 mb-3">{t('details.preferredDate')}</Text>
                <CalendarMonth viewMonth={viewMonth} setViewMonth={setViewMonth} selectedDate={preferredDate} setSelectedDate={setPreferredDate} locale={i18n.language} />

                <Text className="text-[14px] font-semibold text-ink mt-6 mb-3">{t('details.preferredTime')}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {TIME_WINDOWS.map((tw) => (
                    <Pressable
                      key={tw.value}
                      onPress={() => setTimeWindow(tw.value)}
                      className={`rounded-full px-4 py-2.5 border ${timeWindow === tw.value ? 'bg-primary border-primary' : 'border-primary/40'}`}
                    >
                      <Text className={`text-[13px] font-medium ${timeWindow === tw.value ? 'text-white' : 'text-primary'}`}>{t('details.timeWindowLabel', { label: tw.label, hint: tw.hint })}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </ScrollView>
            <StepFooter label={t('details.continue')} onNext={goNext} disabled={!canLeaveDetails} />
          </View>
        )}

        {step === 'address' && (
          <View className="flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <View className="px-6 pt-2">
                {addresses === null ? (
                  <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
                ) : (
                  <View className="flex-col gap-3">
                    {addresses.map((a) => (
                      <Pressable
                        key={a.address_id}
                        onPress={() => {
                          setSelectedAddressId(a.address_id)
                          setShowAddressForm(false)
                        }}
                        className={`flex-row items-start gap-3 rounded-2xl p-4 ${selectedAddressId === a.address_id && !showAddressForm ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'}`}
                      >
                        <LocationIcon size={18} color="#7210FF" />
                        <View className="flex-1">
                          <Text className="font-bold text-ink text-[14px]">{a.label}</Text>
                          <Text className="text-[13px] text-muted mt-0.5">{a.street_address}, {a.city}{a.region ? `, ${a.region}` : ''}</Text>
                          <Text className="text-[12px] text-muted mt-0.5">{a.recipient_name} · {a.phone}</Text>
                        </View>
                      </Pressable>
                    ))}

                    {!showAddressForm ? (
                      <Pressable onPress={() => setShowAddressForm(true)} className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline py-4">
                        <PlusIcon size={16} color="#6C7585" />
                        <Text className="text-[14px] font-medium text-muted">{t('address.addNew')}</Text>
                      </Pressable>
                    ) : (
                      <View className="rounded-2xl border border-hairline p-4 gap-3">
                        <TextInput value={addrDraft.label} onChangeText={(v) => setAddrDraft((d) => ({ ...d, label: v }))} placeholder={t('address.labelPlaceholder')} placeholderTextColor="#9e9e9e" className="rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
                        <TextInput value={addrDraft.recipient_name} onChangeText={(v) => setAddrDraft((d) => ({ ...d, recipient_name: v }))} placeholder={t('address.recipientPlaceholder')} placeholderTextColor="#9e9e9e" className="rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
                        <TextInput value={addrDraft.phone} onChangeText={(v) => setAddrDraft((d) => ({ ...d, phone: v }))} placeholder={t('address.phonePlaceholder')} keyboardType="phone-pad" placeholderTextColor="#9e9e9e" className="rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
                        <TextInput value={addrDraft.street_address} onChangeText={(v) => setAddrDraft((d) => ({ ...d, street_address: v }))} placeholder={t('address.streetPlaceholder')} placeholderTextColor="#9e9e9e" className="rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
                        <View className="flex-row gap-3">
                          <TextInput value={addrDraft.city} onChangeText={(v) => setAddrDraft((d) => ({ ...d, city: v }))} placeholder={t('address.cityPlaceholder')} placeholderTextColor="#9e9e9e" className="flex-1 rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
                          <TextInput value={addrDraft.region} onChangeText={(v) => setAddrDraft((d) => ({ ...d, region: v }))} placeholder={t('address.regionPlaceholder')} placeholderTextColor="#9e9e9e" className="flex-1 rounded-xl bg-[#f5f5f5] px-4 py-3 text-[14px] text-ink" />
                        </View>
                        <Button onPress={saveNewAddress} loading={savingAddress}>{t('address.saveAddress')}</Button>
                        {(addresses ?? []).length > 0 && (
                          <Pressable onPress={() => setShowAddressForm(false)}><Text className="text-center text-[13px] text-muted">{t('address.cancel')}</Text></Pressable>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
            <StepFooter label={t('address.continue')} onNext={goNext} disabled={!canLeaveAddress} />
          </View>
        )}

        {step === 'review' && selectedService && (
          <View className="flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <View className="px-6 pt-2">
                <View className="rounded-2xl border border-hairline p-4 flex-col gap-3">
                  <Row label={t('review.labelService')} value={selectedService.name} />
                  <Row label={t('review.labelProvider')} value={provider.display_name} />
                  <Row label={t('review.labelDate')} value={preferredDate ? preferredDate.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', year: 'numeric' }) : t('review.notSet')} />
                  <Row label={t('review.labelTime')} value={timeWindow ? TIME_WINDOWS.find((tw) => tw.value === timeWindow)!.label : t('review.notSet')} />
                  <Row label={t('review.labelAddress')} value={selectedAddress ? `${selectedAddress.street_address}, ${selectedAddress.city}` : '—'} />
                </View>

                <Text className="text-[13px] text-muted mt-4 px-1 leading-relaxed">{description}</Text>

                <Text className="text-[14px] font-semibold text-ink mt-6 mb-2">{t('review.promoCode')}</Text>
                <View className="flex-row items-center gap-3">
                  <TextInput
                    value={promoCode}
                    onChangeText={setPromoCode}
                    autoCapitalize="characters"
                    placeholder={t('review.promoPlaceholder')}
                    placeholderTextColor="#9e9e9e"
                    className="flex-1 rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
                  />
                  <Pressable onPress={applyPromo} disabled={validatingPromo} className="items-center justify-center rounded-2xl bg-primary px-5 py-4">
                    <Text className="text-[14px] font-bold text-white">{t('review.apply')}</Text>
                  </Pressable>
                </View>
                {promoError && <Text className="text-[12px] text-red-500 mt-2">{promoError}</Text>}

                <View className="rounded-2xl border border-hairline p-4 mt-4 flex-col gap-2">
                  <View className="flex-row justify-between">
                    <Text className="text-ink text-[14px]">{selectedService.name}</Text>
                    <Text className="text-ink text-[14px]">{fmtMoney(subtotal)}</Text>
                  </View>
                  {promoDiscount != null && promoDiscount > 0 && (
                    <View className="flex-row justify-between">
                      <Text className="text-primary font-medium text-[14px]">{t('review.promo')}</Text>
                      <Text className="text-primary font-medium text-[14px]">- {fmtMoney(promoDiscount)}</Text>
                    </View>
                  )}
                  <View className="flex-row justify-between pt-2 border-t border-hairline">
                    <Text className="font-bold text-ink text-[16px]">{t('review.total')}</Text>
                    <Text className="font-bold text-ink text-[16px]">{fmtMoney(total)}</Text>
                  </View>
                </View>

                {reviewIssue && <Text className="text-[13px] text-red-500 mt-4">{reviewIssue}</Text>}
              </View>
            </ScrollView>
            <StepFooter label={t('review.submitRequest')} onNext={submitRequest} loading={submitting} />
          </View>
        )}

        {step === 'provider' && (
          <View className="flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <View className="px-6 pt-2">
                {matching ? (
                  <View className="items-center py-16">
                    <Text className="text-[15px] font-semibold text-ink">{t('provider.finding')}</Text>
                  </View>
                ) : matchOutcome === 'NO_PROVIDER_AVAILABLE' ? (
                  <View className="items-center py-16">
                    <Text className="text-[15px] font-semibold text-ink">{t('provider.noneAvailableTitle')}</Text>
                    <Text className="text-[13px] text-muted mt-1 text-center">{t('provider.noneAvailableSubtitle')}</Text>
                  </View>
                ) : matchOutcome === 'ERROR' ? (
                  <View className="items-center py-16">
                    <Text className="text-[15px] font-semibold text-ink">{t('provider.errorTitle')}</Text>
                    <Pressable onPress={() => setMatchOutcome(null)}><Text className="text-primary text-[13px] font-semibold mt-2">{t('provider.retry')}</Text></Pressable>
                  </View>
                ) : quotes === null ? (
                  <View className="h-24 rounded-2xl bg-[#f5f5f5]" />
                ) : quotes.length === 0 ? (
                  <View className="items-center py-16">
                    <Text className="text-[15px] font-semibold text-ink">{t('provider.noQuotesTitle')}</Text>
                    <Text className="text-[13px] text-muted mt-1 text-center">{t('provider.noQuotesSubtitle')}</Text>
                  </View>
                ) : (
                  <View className="flex-col gap-3">
                    {matches && matches.length > 0 && !matches.some((m) => m.provider_id === providerId) && (
                      <View className="rounded-2xl bg-amber-500/10 p-3">
                        <Text className="text-[12px] text-ink">{t('provider.notMatchedNotice', { name: provider.display_name })}</Text>
                      </View>
                    )}
                    {sortedQuotes.map((q) => (
                      <View key={q.quote_id} className={`rounded-2xl p-4 ${q.provider_id === providerId ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'}`}>
                        <View className="flex-row items-center gap-3">
                          <Avatar label={initialsOf(q.display_name)} size={44} />
                          <View className="flex-1">
                            <Text numberOfLines={1} className="font-bold text-ink">{q.display_name}</Text>
                            <View className="flex-row items-center gap-1">
                              <StarIcon size={12} />
                              <Text className="text-[12px] text-muted">{t('provider.leadTime', { rating: q.rating_avg.toFixed(1), days: q.lead_time_days })}</Text>
                            </View>
                          </View>
                          <Text className="font-bold text-primary text-[15px]">{fmtMoney(q.amount, q.currency)}</Text>
                        </View>
                        <Pressable
                          onPress={() => chooseQuote(q)}
                          disabled={acceptingQuoteId !== null}
                          className="mt-3 items-center rounded-xl bg-primary py-3"
                        >
                          <Text className="text-white font-bold text-[14px]">{acceptingQuoteId === q.quote_id ? t('provider.confirming') : t('provider.acceptAndContinue')}</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}

        {step === 'payment' && booking && (
          <View className="flex-1">
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <View className="px-6 pt-2">
                <View className="rounded-2xl border border-hairline p-4 flex-col gap-2 mb-5">
                  <View className="flex-row justify-between">
                    <Text className="text-muted text-[14px]">{t('payment.booking')}</Text>
                    <Text className="text-ink font-medium text-[14px]">{booking.booking_number}</Text>
                  </View>
                  <View className="flex-row justify-between pt-2 border-t border-hairline">
                    <Text className="font-bold text-ink text-[16px]">{t('payment.amountDue')}</Text>
                    <Text className="font-bold text-ink text-[16px]">{fmtMoney(booking.agreed_amount, booking.currency)}</Text>
                  </View>
                </View>

                <Text className="text-[14px] font-semibold text-ink mb-3">{t('payment.yourMethods')}</Text>
                <View className="flex-col gap-3">
                  {wallet && (
                    <View className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                      <PaymentIcon icon="cash" size={24} />
                      <Text className="text-[14px] text-ink flex-1">{t('payment.wallet')}</Text>
                      <Text className="text-[13px] text-muted">{fmtMoney(wallet.balance, wallet.currency)}</Text>
                    </View>
                  )}
                  {(paymentMethods ?? []).map((pm) => (
                    <View key={pm.method_id} className="flex-row items-center gap-4 rounded-2xl border border-hairline p-4">
                      <PaymentIcon icon={(pm.provider ?? pm.type).toLowerCase()} size={24} />
                      <Text className="text-[14px] text-ink flex-1">{pm.provider ?? pm.type}</Text>
                      {pm.is_default && <Text className="text-[11px] font-semibold text-primary">{t('payment.default')}</Text>}
                    </View>
                  ))}
                </View>
                <Text className="text-[12px] text-muted mt-3">{t('payment.authorizeNotice')}</Text>
              </View>
            </ScrollView>
            <StepFooter label={t('payment.authorizePayment')} onNext={authorizePayment} loading={authorizing} />
          </View>
        )}

        {step === 'pin' && <PinStep pin={pin} setPin={setPin} onComplete={() => setShowSuccess(true)} t={t} />}
      </SafeAreaView>

      <CenterModal open={showSuccess}>
        <View className="items-center justify-center size-24 rounded-full bg-primary mb-6">
          <ShieldCheckIcon size={44} color="#fff" />
        </View>
        <Text className="text-primary text-[22px] font-bold">{t('success.title')}</Text>
        <Text className="text-[15px] text-ink mt-3 text-center">{t('success.body')}</Text>
        <View className="flex-col gap-3 w-full mt-8">
          <Button onPress={() => router.replace(`/booking/${providerId}/receipt?bookingId=${booking?.booking_id ?? ''}` as any)}>
            {t('success.viewReceipt')}
          </Button>
          <Button variant="outline" onPress={() => router.replace('/(tabs)/bookings')}>
            {t('success.backToBookings')}
          </Button>
        </View>
      </CenterModal>
    </View>
  )
}

function StepFooter({ label, onNext, disabled, loading }: { label: string; onNext: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <View className="px-6 pb-6 pt-4 border-t border-hairline">
      <Button onPress={onNext} disabled={disabled} loading={loading}>
        {label}
      </Button>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-muted shrink-0 text-[14px]">{label}</Text>
      <Text className="text-ink font-medium text-right text-[14px]">{value}</Text>
    </View>
  )
}

function CalendarMonth({
  viewMonth,
  setViewMonth,
  selectedDate,
  setSelectedDate,
  locale,
}: {
  viewMonth: Date
  setViewMonth: (d: Date) => void
  selectedDate: Date | null
  setSelectedDate: (d: Date) => void
  locale: string
}) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const monthLabel = viewMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i) // 2024-01-01 is a Monday
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
  })

  return (
    <View className="rounded-3xl bg-primary/5 p-5">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="font-bold text-ink">{monthLabel}</Text>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => setViewMonth(new Date(year, month - 1, 1))} className="items-center justify-center size-7 rounded-full bg-white">
            <ArrowLeftIcon size={14} color="#7210FF" />
          </Pressable>
          <Pressable onPress={() => setViewMonth(new Date(year, month + 1, 1))} className="items-center justify-center size-7 rounded-full bg-white" style={{ transform: [{ rotate: '180deg' }] }}>
            <ArrowLeftIcon size={14} color="#7210FF" />
          </Pressable>
        </View>
      </View>
      <View className="flex-row flex-wrap">
        {weekdayLabels.map((w, i) => (
          <Text key={i} className="text-[11px] text-muted font-medium text-center" style={{ width: '14.28%' }}>{w}</Text>
        ))}
        {Array.from({ length: firstDayOffset }).map((_, i) => <View key={`b${i}`} style={{ width: '14.28%' }} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isSelected = !!selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day
          return (
            <Pressable key={day} onPress={() => setSelectedDate(new Date(year, month, day))} className="items-center py-1" style={{ width: '14.28%' }}>
              <View className={`items-center justify-center size-8 rounded-full ${isSelected ? 'bg-primary' : ''}`}>
                <Text className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-ink'}`}>{day}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function PinStep({ pin, setPin, onComplete, t }: { pin: string[]; setPin: (p: string[]) => void; onComplete: () => void; t: (key: string) => string }) {
  const LENGTH = 4
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', 'back']
  const complete = pin.length === LENGTH

  function press(key: string) {
    if (key === 'back') return setPin(pin.slice(0, -1))
    if (key === '*') return
    if (pin.length < LENGTH) {
      const next = [...pin, key]
      setPin(next)
      if (next.length === LENGTH) setTimeout(onComplete, 300)
    }
  }

  return (
    <View className="flex-1">
      <View className="flex-1 px-6 pt-10">
        <Text className="text-center text-[16px] text-ink">{t('pin.enterToConfirm')}</Text>
        <View className="flex-row justify-center gap-4 mt-8">
          {Array.from({ length: LENGTH }).map((_, i) => {
            const isLast = i === pin.length - 1
            const hasDigit = pin[i] !== undefined
            return (
              <View key={i} className={`size-16 rounded-2xl items-center justify-center ${isLast ? 'border-2 border-primary bg-primary/5' : 'bg-[#f5f5f5]'}`}>
                <Text className={`text-[22px] font-bold ${isLast ? 'text-primary' : 'text-ink'}`}>{hasDigit ? (isLast ? pin[i] : '●') : ''}</Text>
              </View>
            )
          })}
        </View>
        {complete && (
          <View className="mt-8">
            <Button onPress={onComplete}>{t('pin.continue')}</Button>
          </View>
        )}
      </View>
      <View className="bg-[#f7f7f7] rounded-t-[32px] px-6 pt-6 pb-8">
        <View className="flex-row flex-wrap">
          {KEYS.map((key) => (
            <Pressable key={key} onPress={() => press(key)} className="h-16 items-center justify-center" style={{ width: '33.33%' }}>
              {key === 'back' ? <BackspaceIcon size={24} color="#0B111F" /> : <Text className="text-[24px] font-medium text-ink">{key}</Text>}
            </Pressable>
          ))}
        </View>
        <View className="w-32 h-1.5 bg-ink/80 rounded-full self-center mt-4" />
      </View>
    </View>
  )
}

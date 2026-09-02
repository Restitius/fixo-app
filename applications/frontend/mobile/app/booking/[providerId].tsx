import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import ScreenHeader from '../../components/ScreenHeader'
import Button from '../../components/Button'
import Select from '../../components/Select'
import Avatar from '../../components/Avatar'
import PaymentIcon from '../../components/PaymentIcon'
import { CenterModal } from '../../components/Sheet'
import {
  providerById,
  USER,
  PAYMENT_METHODS,
  CLEANING_ROOMS,
  PROMOS,
  CAR_BRANDS,
  CAR_SERIES,
  HOUSE_SIZES,
  PAINT_COLORS,
  APPLIANCE_SERVICES,
  SHIFTING_ITEMS,
  type Promo,
} from '../../data/mock'
import {
  ArrowLeftIcon,
  BackspaceIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  LocationIcon,
  MinusIcon,
  MoreHorizontalIcon,
  PlusIcon,
  ShieldCheckIcon,
  TagIcon,
} from '../../components/icons'

type Step = 'items' | 'bookingDetails' | 'promo' | 'address' | 'payment' | 'review' | 'pin'
type BookingKind = 'rooms' | 'vehicle' | 'paint' | 'laundry' | 'appliance' | 'plumbing' | 'shifting' | 'generic'

const STEP_ORDER: Step[] = ['items', 'bookingDetails', 'address', 'payment', 'review', 'pin']
const TIMES = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM']
const YES_NO = ['Yes', 'No']

function kindFor(categoryId: string): BookingKind {
  if (categoryId === 'cleaning') return 'rooms'
  if (categoryId === 'repairing') return 'vehicle'
  if (categoryId === 'painting') return 'paint'
  if (categoryId === 'laundry') return 'laundry'
  if (categoryId === 'appliance') return 'appliance'
  if (categoryId === 'plumbing') return 'plumbing'
  if (categoryId === 'shifting') return 'shifting'
  return 'generic'
}

export default function BookingFlow() {
  const { providerId = '' } = useLocalSearchParams<{ providerId: string }>()
  const provider = providerById(providerId)
  const kind = provider ? kindFor(provider.categoryId) : 'generic'

  const [step, setStep] = useState<Step>('items')
  const [prevStep, setPrevStep] = useState<Step>('bookingDetails')

  const [roomCounts, setRoomCounts] = useState<Record<string, number>>(
    Object.fromEntries(CLEANING_ROOMS.map((r) => [r, 0])),
  )
  const [carBrand, setCarBrand] = useState(CAR_BRANDS[0])
  const [carSeries, setCarSeries] = useState(CAR_SERIES[0])
  const [plate, setPlate] = useState('')
  const [houseSize, setHouseSize] = useState(HOUSE_SIZES[1])
  const [colors, setColors] = useState(PAINT_COLORS)
  const [paintColor, setPaintColor] = useState(PAINT_COLORS[6])
  const [qty, setQty] = useState(1)

  const [laundryWeight, setLaundryWeight] = useState(5)
  const [ironingService, setIroningService] = useState(YES_NO[0])
  const [fragranceService, setFragranceService] = useState(YES_NO[0])

  const [applianceSelected, setApplianceSelected] = useState<string[]>([APPLIANCE_SERVICES[0]])

  const [pipeCount, setPipeCount] = useState(1)
  const [damage, setDamage] = useState('')

  const [shiftingSubStep, setShiftingSubStep] = useState<'list' | 'route'>('list')
  const [shiftingCounts, setShiftingCounts] = useState<Record<string, number>>(
    Object.fromEntries(SHIFTING_ITEMS.map((r) => [r, 0])),
  )
  const [fromAddress, setFromAddress] = useState('')
  const [toAddress, setToAddress] = useState('')

  const today = new Date()
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [workingHours, setWorkingHours] = useState(0)
  const [startTime, setStartTime] = useState(TIMES[2])
  const [promo, setPromo] = useState<Promo | null>(null)

  const [address, setAddress] = useState(USER.address)
  const [payment, setPayment] = useState(PAYMENT_METHODS.find((p) => p.icon === 'mastercard')?.id ?? PAYMENT_METHODS[0]!.id)
  const [pin, setPin] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [detailsExpanded, setDetailsExpanded] = useState(false)

  if (!provider) return null

  const shiftingItemsCount = Object.values(shiftingCounts).reduce((a, b) => a + b, 0)
  const shiftingRouteFee = fromAddress.trim() && toAddress.trim() ? 30 : 0

  const itemsTotal =
    kind === 'rooms'
      ? Object.values(roomCounts).reduce((a, b) => a + b, 0) * provider.price
      : kind === 'laundry'
        ? laundryWeight * 5 + (ironingService === 'Yes' ? 15 : 0) + (fragranceService === 'Yes' ? 10 : 0)
        : kind === 'appliance'
          ? provider.price + Math.max(0, applianceSelected.length - 1) * 30
          : kind === 'plumbing'
            ? provider.price + pipeCount * 8
            : kind === 'shifting'
              ? provider.price + shiftingItemsCount * 7 + shiftingRouteFee
              : provider.price * (kind === 'generic' ? qty : 1)
  const hoursSurcharge = Math.max(0, workingHours - 2) * 10
  const subtotal = itemsTotal + hoursSurcharge
  const discount = promo ? Math.round((subtotal * promo.discountPercent) / 100) : 0
  const total = subtotal - discount

  const itemsSummary =
    kind === 'rooms'
      ? CLEANING_ROOMS.filter((r) => roomCounts[r]! > 0).map((r) => `${r} x${roomCounts[r]}`).join(', ') || 'No items selected'
      : kind === 'vehicle'
        ? `${carBrand} ${carSeries} • Plate ${plate || '—'}`
        : kind === 'paint'
          ? `${houseSize} house • Color ${paintColor}`
          : kind === 'laundry'
            ? `${laundryWeight}kg • Ironing: ${ironingService} • Fragrance: ${fragranceService}`
            : kind === 'appliance'
              ? applianceSelected.join(', ') || 'No services selected'
              : kind === 'plumbing'
                ? `${pipeCount} water pipes • ${damage || 'No damage details'}`
                : kind === 'shifting'
                  ? `${SHIFTING_ITEMS.filter((r) => shiftingCounts[r]! > 0).map((r) => `${r} x${shiftingCounts[r]}`).join(', ') || 'No items selected'} — From ${fromAddress || '—'} to ${toAddress || '—'}`
                  : `Quantity: ${qty}`

  const stepIndex = STEP_ORDER.indexOf(step)

  function goNext() {
    if (step === 'items' && kind === 'shifting' && shiftingSubStep === 'list') {
      setShiftingSubStep('route')
      return
    }
    const next = STEP_ORDER[stepIndex + 1]
    if (next) setStep(next)
  }
  function goBack() {
    if (step === 'promo') {
      setStep(prevStep)
      return
    }
    if (step === 'items' && kind === 'shifting' && shiftingSubStep === 'route') {
      setShiftingSubStep('list')
      return
    }
    const prev = STEP_ORDER[stepIndex - 1]
    if (prev) setStep(prev)
    else router.replace(`/service/${providerId}` as any)
  }
  function openPromo() {
    setPrevStep('bookingDetails')
    setStep('promo')
  }

  const headerTitle =
    step === 'items'
      ? provider.title
      : step === 'bookingDetails'
        ? 'Booking Details'
        : step === 'promo'
          ? 'Add Promo'
          : step === 'address'
            ? 'Your Address/Location'
            : step === 'payment'
              ? 'Payment Methods'
              : step === 'review'
                ? 'Review Summary'
                : 'Enter Your PIN'

  const showMoreMenu = step === 'items' || step === 'bookingDetails' || step === 'address'

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScreenHeader
          title={headerTitle}
          onBack={goBack}
          right={
            showMoreMenu ? (
              <View className="items-center justify-center size-9 rounded-full bg-[#f5f5f5]">
                <MoreHorizontalIcon size={16} color="#0B111F" />
              </View>
            ) : undefined
          }
        />

        {step === 'items' && kind === 'rooms' && (
          <RoomsStep roomCounts={roomCounts} setRoomCounts={setRoomCounts} price={provider.price} onNext={goNext} />
        )}
        {step === 'items' && kind === 'vehicle' && (
          <VehicleStep
            brand={carBrand}
            setBrand={setCarBrand}
            series={carSeries}
            setSeries={setCarSeries}
            plate={plate}
            setPlate={setPlate}
            price={itemsTotal}
            onNext={goNext}
          />
        )}
        {step === 'items' && kind === 'paint' && (
          <PaintStep
            colors={colors}
            setColors={setColors}
            size={houseSize}
            setSize={setHouseSize}
            color={paintColor}
            setColor={setPaintColor}
            price={itemsTotal}
            onNext={goNext}
          />
        )}
        {step === 'items' && kind === 'laundry' && (
          <LaundryStep
            weight={laundryWeight}
            setWeight={setLaundryWeight}
            ironing={ironingService}
            setIroning={setIroningService}
            fragrance={fragranceService}
            setFragrance={setFragranceService}
            price={itemsTotal}
            onNext={goNext}
          />
        )}
        {step === 'items' && kind === 'appliance' && (
          <ApplianceStep selected={applianceSelected} setSelected={setApplianceSelected} price={itemsTotal} onNext={goNext} />
        )}
        {step === 'items' && kind === 'plumbing' && (
          <PlumbingStep pipeCount={pipeCount} setPipeCount={setPipeCount} damage={damage} setDamage={setDamage} price={itemsTotal} onNext={goNext} />
        )}
        {step === 'items' && kind === 'shifting' && shiftingSubStep === 'list' && (
          <ShiftingListStep shiftingCounts={shiftingCounts} setShiftingCounts={setShiftingCounts} price={itemsTotal} onNext={goNext} />
        )}
        {step === 'items' && kind === 'shifting' && shiftingSubStep === 'route' && (
          <ShiftingRouteStep from={fromAddress} setFrom={setFromAddress} to={toAddress} setTo={setToAddress} price={itemsTotal} onNext={goNext} />
        )}
        {step === 'items' && kind === 'generic' && <GenericItemsStep qty={qty} setQty={setQty} price={itemsTotal} onNext={goNext} />}

        {step === 'bookingDetails' && (
          <BookingDetailsStep
            viewMonth={viewMonth}
            setViewMonth={setViewMonth}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            workingHours={workingHours}
            setWorkingHours={setWorkingHours}
            startTime={startTime}
            setStartTime={setStartTime}
            promo={promo}
            onOpenPromo={openPromo}
            onNext={goNext}
          />
        )}

        {step === 'promo' && (
          <PromoStep
            selected={promo}
            onSelect={(p) => {
              setPromo(p)
              setStep('bookingDetails')
            }}
          />
        )}

        {step === 'address' && <AddressStep address={address} setAddress={setAddress} onNext={goNext} />}

        {step === 'payment' && <PaymentStep payment={payment} setPayment={setPayment} onNext={goNext} />}

        {step === 'review' && (
          <ReviewStep
            provider={provider}
            selectedDate={selectedDate}
            startTime={startTime}
            workingHours={workingHours}
            itemsSummary={itemsSummary}
            detailsExpanded={detailsExpanded}
            setDetailsExpanded={setDetailsExpanded}
            payment={payment}
            onChangePayment={() => setStep('payment')}
            subtotal={itemsTotal + hoursSurcharge}
            discount={discount}
            total={total}
            onNext={goNext}
          />
        )}

        {step === 'pin' && <PinStep pin={pin} setPin={setPin} onComplete={() => setShowSuccess(true)} />}
      </SafeAreaView>

      <CenterModal open={showSuccess}>
        <View className="items-center justify-center size-24 rounded-full bg-primary mb-6">
          <ShieldCheckIcon size={44} color="#fff" />
        </View>
        <Text className="text-primary text-[22px] font-bold">Booking Successful!</Text>
        <Text className="text-[15px] text-ink mt-3 text-center">You have successfully made payment and book the services.</Text>
        <View className="flex-col gap-3 w-full mt-8">
          <Button
            onPress={() =>
              router.replace({
                pathname: `/booking/${providerId}/receipt` as any,
                params: {
                  date: selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
                  time: startTime,
                  workingHours: String(workingHours),
                  itemsSummary,
                  payment,
                  subtotal: String(itemsTotal + hoursSurcharge),
                  discount: String(discount),
                  total: String(total),
                },
              })
            }
          >
            View E-Receipt
          </Button>
          <Button variant="outline" onPress={() => router.push('/inbox/chat/c1' as any)}>
            Message Workers
          </Button>
        </View>
      </CenterModal>
    </View>
  )
}

function StepFooter({ label, onNext, disabled }: { label: string; onNext: () => void; disabled?: boolean }) {
  return (
    <View className="px-6 pb-6 pt-4 border-t border-hairline">
      <Button onPress={onNext} disabled={disabled}>
        {label}
      </Button>
    </View>
  )
}

function Counter({ value, onChange }: { value: number; onChange: (delta: number) => void }) {
  return (
    <View className="flex-row items-center gap-4">
      <Pressable onPress={() => onChange(-1)} className="items-center justify-center size-8 rounded-full bg-primary/8">
        <MinusIcon size={16} color="#7210FF" />
      </Pressable>
      <Text className="font-bold text-ink w-4 text-center">{value}</Text>
      <Pressable onPress={() => onChange(1)} className="items-center justify-center size-8 rounded-full bg-primary/8">
        <PlusIcon size={16} color="#7210FF" />
      </Pressable>
    </View>
  )
}

function RoomsStep({
  roomCounts,
  setRoomCounts,
  price,
  onNext,
}: {
  roomCounts: Record<string, number>
  setRoomCounts: (updater: (prev: Record<string, number>) => Record<string, number>) => void
  price: number
  onNext: () => void
}) {
  const total = Object.values(roomCounts).reduce((a, b) => a + b, 0) * price

  function change(room: string, delta: number) {
    setRoomCounts((prev) => ({ ...prev, [room]: Math.max(0, prev[room]! + delta) }))
  }

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-4">Enter the number of items to be cleaned.</Text>
          <View className="flex-col gap-3">
            {CLEANING_ROOMS.map((room) => (
              <View key={room} className="flex-row items-center justify-between rounded-2xl border border-hairline px-5 py-4">
                <Text className="text-[14px] font-medium text-ink">{room}</Text>
                <Counter value={roomCounts[room]!} onChange={(d) => change(room, d)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${total}`} onNext={onNext} />
    </View>
  )
}

function VehicleStep({
  brand,
  setBrand,
  series,
  setSeries,
  plate,
  setPlate,
  price,
  onNext,
}: {
  brand: string
  setBrand: (v: string) => void
  series: string
  setSeries: (v: string) => void
  plate: string
  setPlate: (v: string) => void
  price: number
  onNext: () => void
}) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-5">Enter the type and series of the car to be repaired.</Text>

          <Text className="text-[14px] font-semibold text-ink mb-2">Car Brand</Text>
          <Select value={brand} onChange={setBrand} options={CAR_BRANDS as unknown as string[]} />

          <Text className="text-[14px] font-semibold text-ink mb-2 mt-5">Series/Model</Text>
          <Select value={series} onChange={setSeries} options={CAR_SERIES as unknown as string[]} />

          <Text className="text-[14px] font-semibold text-ink mb-2 mt-5">Plate Number</Text>
          <TextInput
            value={plate}
            onChangeText={setPlate}
            placeholder="e.g. BB 2638 GHA"
            placeholderTextColor="#9e9e9e"
            className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
          />
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function PaintStep({
  size,
  setSize,
  colors,
  setColors,
  color,
  setColor,
  price,
  onNext,
}: {
  size: string
  setSize: (v: string) => void
  colors: string[]
  setColors: (updater: (prev: string[]) => string[]) => void
  color: string
  setColor: (v: string) => void
  price: number
  onNext: () => void
}) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-5">Choose the size of the house & the color you want.</Text>

          <Text className="text-[14px] font-semibold text-ink mb-2">Size of House</Text>
          <Select value={size} onChange={setSize} options={HOUSE_SIZES as unknown as string[]} />

          <Text className="text-[14px] font-semibold text-ink mb-3 mt-6">Select Paint Color</Text>
          <View className="flex-row flex-wrap gap-4">
            {colors.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                className="items-center justify-center size-12 rounded-full"
                style={{ backgroundColor: c, borderWidth: c === '#FFFFFF' ? 1 : 0, borderColor: '#eee' }}
              >
                {color === c && <CheckCircleIcon size={20} color={c === '#FFFFFF' ? '#0B111F' : '#fff'} />}
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                const random = `#${Math.floor(Math.random() * 0xffffff)
                  .toString(16)
                  .padStart(6, '0')}`
                setColors((prev) => [...prev, random])
                setColor(random)
              }}
              className="items-center justify-center size-12 rounded-full bg-primary/8"
            >
              <PlusIcon size={20} color="#7210FF" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function GenericItemsStep({
  qty,
  setQty,
  price,
  onNext,
}: {
  qty: number
  setQty: (updater: (q: number) => number) => void
  price: number
  onNext: () => void
}) {
  return (
    <View className="flex-1">
      <View className="flex-1 px-6 pt-2">
        <View className="flex-row items-center justify-between rounded-2xl border border-hairline px-5 py-4">
          <Text className="text-[14px] font-medium text-ink">Quantity / Hours</Text>
          <Counter value={qty} onChange={(d) => setQty((q) => Math.max(1, q + d))} />
        </View>
      </View>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function LaundryStep({
  weight,
  setWeight,
  ironing,
  setIroning,
  fragrance,
  setFragrance,
  price,
  onNext,
}: {
  weight: number
  setWeight: (n: number) => void
  ironing: string
  setIroning: (v: string) => void
  fragrance: string
  setFragrance: (v: string) => void
  price: number
  onNext: () => void
}) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-5">Enter the weight and the service you need.</Text>

          <Text className="text-[14px] font-semibold text-ink mb-2">Weight Total Clothing</Text>
          <View className="flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] px-5 py-4">
            <TextInput
              keyboardType="number-pad"
              value={String(weight)}
              onChangeText={(v) => setWeight(Math.max(1, Number(v) || 1))}
              className="flex-1 text-[15px] text-ink"
            />
            <Text className="text-[14px] text-muted">kg</Text>
          </View>

          <Text className="text-[14px] font-semibold text-ink mb-2 mt-5">Ironing Service</Text>
          <Select value={ironing} onChange={setIroning} options={YES_NO} />

          <Text className="text-[14px] font-semibold text-ink mb-2 mt-5">Fragrance Service</Text>
          <Select value={fragrance} onChange={setFragrance} options={YES_NO} />
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function ApplianceStep({
  selected,
  setSelected,
  price,
  onNext,
}: {
  selected: string[]
  setSelected: (updater: (prev: string[]) => string[]) => void
  price: number
  onNext: () => void
}) {
  function toggle(service: string) {
    setSelected((prev) => (prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]))
  }

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-4">Choose the appliance service you need</Text>
          <View className="flex-col gap-3">
            {APPLIANCE_SERVICES.map((service) => {
              const checked = selected.includes(service)
              return (
                <Pressable
                  key={service}
                  onPress={() => toggle(service)}
                  className="flex-row items-center justify-between rounded-2xl border border-hairline px-5 py-4"
                >
                  <Text className="text-[14px] font-medium text-ink">{service}</Text>
                  <View
                    className={`items-center justify-center size-6 rounded-full ${checked ? 'bg-primary' : 'border-2 border-primary'}`}
                  >
                    {checked && (
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path d="M4 12.5l5 5L20 6" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function PlumbingStep({
  pipeCount,
  setPipeCount,
  damage,
  setDamage,
  price,
  onNext,
}: {
  pipeCount: number
  setPipeCount: (n: number) => void
  damage: string
  setDamage: (v: string) => void
  price: number
  onNext: () => void
}) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-5">Enter the number of pipes and the damage.</Text>

          <Text className="text-[14px] font-semibold text-ink mb-2">Number of Water Pipes</Text>
          <TextInput
            keyboardType="number-pad"
            value={String(pipeCount)}
            onChangeText={(v) => setPipeCount(Math.max(1, Number(v) || 1))}
            className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
          />

          <Text className="text-[14px] font-semibold text-ink mb-2 mt-5">Damage Occurred</Text>
          <TextInput
            value={damage}
            onChangeText={setDamage}
            placeholder="Describe the damage..."
            placeholderTextColor="#9e9e9e"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[14px] text-ink min-h-[88px]"
          />
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function ShiftingListStep({
  shiftingCounts,
  setShiftingCounts,
  price,
  onNext,
}: {
  shiftingCounts: Record<string, number>
  setShiftingCounts: (updater: (prev: Record<string, number>) => Record<string, number>) => void
  price: number
  onNext: () => void
}) {
  function change(item: string, delta: number) {
    setShiftingCounts((prev) => ({ ...prev, [item]: Math.max(0, prev[item]! + delta) }))
  }

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-4">Enter the number of items you want to shift.</Text>
          <View className="flex-col gap-3">
            {SHIFTING_ITEMS.map((item) => (
              <View key={item} className="flex-row items-center justify-between rounded-2xl border border-hairline px-5 py-4">
                <Text className="text-[14px] font-medium text-ink">{item}</Text>
                <Counter value={shiftingCounts[item]!} onChange={(d) => change(item, d)} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function ShiftingRouteStep({
  from,
  setFrom,
  to,
  setTo,
  price,
  onNext,
}: {
  from: string
  setFrom: (v: string) => void
  to: string
  setTo: (v: string) => void
  price: number
  onNext: () => void
}) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-5">Select the origin & destination of the shifting.</Text>
          <View className="flex-row gap-4">
            <View className="items-center pt-4">
              <View className="size-4 rounded-full border-[3px] border-primary" />
              <View className="w-px flex-1 border-l border-dashed border-hairline my-1" />
              <LocationIcon size={16} color="#7210FF" />
            </View>
            <View className="flex-1 flex-col gap-4">
              <TextInput
                value={from}
                onChangeText={setFrom}
                placeholder="From"
                placeholderTextColor="#9e9e9e"
                className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
              />
              <TextInput
                value={to}
                onChangeText={setTo}
                placeholder="Destination"
                placeholderTextColor="#9e9e9e"
                className="w-full rounded-2xl bg-[#f5f5f5] px-5 py-4 text-[15px] text-ink"
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <StepFooter label={`Continue - $${price}`} onNext={onNext} />
    </View>
  )
}

function CalendarMonth({
  viewMonth,
  setViewMonth,
  selectedDate,
  setSelectedDate,
}: {
  viewMonth: Date
  setViewMonth: (d: Date) => void
  selectedDate: Date | null
  setSelectedDate: (d: Date) => void
}) {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7
  const monthLabel = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

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
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((w) => (
          <Text key={w} className="text-[11px] text-muted font-medium text-center" style={{ width: '14.28%' }}>
            {w}
          </Text>
        ))}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <View key={`b${i}`} style={{ width: '14.28%' }} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isSelected =
            !!selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day
          return (
            <Pressable
              key={day}
              onPress={() => setSelectedDate(new Date(year, month, day))}
              className="items-center py-1"
              style={{ width: '14.28%' }}
            >
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

function BookingDetailsStep({
  viewMonth,
  setViewMonth,
  selectedDate,
  setSelectedDate,
  workingHours,
  setWorkingHours,
  startTime,
  setStartTime,
  promo,
  onOpenPromo,
  onNext,
}: any) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] font-semibold text-ink mb-3">Select Date</Text>
          <CalendarMonth viewMonth={viewMonth} setViewMonth={setViewMonth} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

          <View className="flex-row items-center justify-between rounded-2xl border border-hairline px-5 py-4 mt-5">
            <View className="flex-1 pr-3">
              <Text className="text-[14px] font-semibold text-ink">Working Hours</Text>
              <Text className="text-[12px] text-muted mt-0.5">Cost increase after 2 hrs of work.</Text>
            </View>
            <Counter value={workingHours} onChange={(d) => setWorkingHours((h: number) => Math.max(0, h + d))} />
          </View>

          <Text className="text-[14px] font-semibold text-ink mt-6 mb-3">Choose Start Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {TIMES.map((t) => (
              <Pressable
                key={t}
                onPress={() => setStartTime(t)}
                className={`rounded-full px-4 py-2.5 border ${t === startTime ? 'bg-primary border-primary' : 'border-primary/40'}`}
              >
                <Text className={`text-[13px] font-medium ${t === startTime ? 'text-white' : 'text-primary'}`}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text className="text-[14px] font-semibold text-ink mt-6 mb-3">Promo Code</Text>
          <View className="flex-row items-center gap-3">
            <View className="flex-1 rounded-2xl bg-[#f5f5f5] px-5 py-3 min-h-[52px] items-start justify-center">
              {promo ? (
                <View className="bg-primary rounded-full px-3 py-1.5">
                  <Text className="text-white text-[13px] font-semibold">{promo.title}</Text>
                </View>
              ) : (
                <Text className="text-[15px] text-[#9e9e9e]">Enter Promo Code</Text>
              )}
            </View>
            <Pressable onPress={onOpenPromo} className="items-center justify-center size-11 rounded-full bg-primary/8 shrink-0">
              <PlusIcon size={16} color="#7210FF" />
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <StepFooter label="Continue" onNext={onNext} />
    </View>
  )
}

function PromoStep({ selected, onSelect }: { selected: Promo | null; onSelect: (p: Promo) => void }) {
  const [choice, setChoice] = useState<Promo | null>(selected)

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <View className="flex-col gap-3">
            {PROMOS.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setChoice(p)}
                className={`flex-row items-center gap-4 rounded-2xl p-4 ${
                  choice?.id === p.id ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'
                }`}
              >
                <View className="items-center justify-center size-12 rounded-full shrink-0" style={{ backgroundColor: p.color }}>
                  <TagIcon size={20} color="#fff" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="font-bold text-ink">{p.title}</Text>
                  <Text className="text-[13px] text-muted">{p.subtitle}</Text>
                </View>
                <View className={`size-5 rounded-full border-2 shrink-0 ${choice?.id === p.id ? 'border-primary bg-primary' : 'border-hairline'}`} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <StepFooter label="Apply Promo" onNext={() => choice && onSelect(choice)} disabled={!choice} />
    </View>
  )
}

function AddressStep({ address, setAddress, onNext }: { address: string; setAddress: (a: string) => void; onNext: () => void }) {
  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#f3ecff' }}>
        <View className="items-center justify-center size-16 rounded-full bg-white border-4 border-primary overflow-hidden">
          <Avatar label={USER.avatar} size={56} />
        </View>
      </View>

      <View className="rounded-t-[28px] bg-white px-6 pt-6 pb-6">
        <View className="w-10 h-1 bg-hairline rounded-full self-center mb-5" />
        <Text className="text-[18px] font-bold text-ink mb-4">Location Details</Text>
        <Text className="text-[14px] font-semibold text-ink mb-2">Address</Text>
        <View className="flex-row items-center gap-3 rounded-2xl bg-[#f5f5f5] px-5 py-4 mb-6">
          <TextInput value={address} onChangeText={setAddress} className="flex-1 text-[14px] text-ink" />
          <LocationIcon size={16} color="#6C7585" />
        </View>
        <Button onPress={onNext}>Continue</Button>
      </View>
    </View>
  )
}

function PaymentStep({ payment, setPayment, onNext }: { payment: string; setPayment: (p: string) => void; onNext: () => void }) {
  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <Text className="text-[14px] text-muted mb-4">Select the payment method you want to use</Text>
          <View className="flex-col gap-3">
            {PAYMENT_METHODS.map((pm) => (
              <Pressable
                key={pm.id}
                onPress={() => setPayment(pm.id)}
                className={`flex-row items-center gap-4 rounded-2xl p-4 ${
                  payment === pm.id ? 'border-2 border-primary bg-primary/5' : 'border border-hairline'
                }`}
              >
                <View className="items-center justify-center size-9 shrink-0">
                  <PaymentIcon icon={pm.icon} size={24} />
                </View>
                <Text className="text-[14px] text-ink flex-1">{pm.label}</Text>
                <View className={`size-5 rounded-full border-2 shrink-0 ${payment === pm.id ? 'border-primary bg-primary' : 'border-hairline'}`} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <StepFooter label="Continue" onNext={onNext} />
    </View>
  )
}

function ReviewStep({
  provider,
  selectedDate,
  startTime,
  workingHours,
  itemsSummary,
  detailsExpanded,
  setDetailsExpanded,
  payment,
  onChangePayment,
  subtotal,
  discount,
  total,
  onNext,
}: any) {
  const pm = PAYMENT_METHODS.find((p) => p.id === payment)
  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <View className="flex-1">
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View className="px-6 pt-2">
          <View className="rounded-2xl border border-hairline p-4 flex-col gap-3">
            <Row label="Services" value={provider.title} />
            <Row label="Category" value={provider.categoryId} capitalize />
            <Row label="Workers" value={provider.name} />
            <Row label="Date & Time" value={`${dateLabel} | ${startTime}`} />
            <Row label="Working Hours" value={`${workingHours} hours`} />
          </View>

          <Pressable
            onPress={() => setDetailsExpanded((v: boolean) => !v)}
            className="w-full flex-row items-center justify-between rounded-2xl border border-hairline p-4 mt-4"
          >
            <Text className="text-[14px] font-medium text-ink">{provider.title} Details</Text>
            <View style={{ transform: [{ rotate: detailsExpanded ? '180deg' : '0deg' }] }}>
              <ChevronDownIcon size={16} color="#6C7585" />
            </View>
          </Pressable>
          {detailsExpanded && <Text className="text-[13px] text-muted px-4 pt-2 leading-relaxed">{itemsSummary}</Text>}

          <View className="rounded-2xl border border-hairline p-4 mt-4 flex-col gap-2">
            <View className="flex-row justify-between">
              <Text className="text-ink text-[14px]">{provider.title}</Text>
              <Text className="text-ink text-[14px]">${subtotal.toFixed(2)}</Text>
            </View>
            {discount > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-primary font-medium text-[14px]">Promo</Text>
                <Text className="text-primary font-medium text-[14px]">- ${discount.toFixed(2)}</Text>
              </View>
            )}
            <View className="flex-row justify-between pt-2 border-t border-hairline">
              <Text className="font-bold text-ink text-[16px]">Total</Text>
              <Text className="font-bold text-ink text-[16px]">${total.toFixed(2)}</Text>
            </View>
          </View>

          <Pressable onPress={onChangePayment} className="w-full flex-row items-center gap-4 rounded-2xl border border-hairline p-4 mt-4">
            <PaymentIcon icon={pm?.icon ?? ''} size={24} />
            <Text className="flex-1 text-left text-[14px] text-ink">{pm?.label}</Text>
            <Text className="text-primary text-[13px] font-semibold">Change</Text>
          </Pressable>
        </View>
      </ScrollView>
      <StepFooter label="Confirm Payment" onNext={onNext} />
    </View>
  )
}

function Row({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <View className="flex-row items-start justify-between gap-4">
      <Text className="text-muted shrink-0 text-[14px]">{label}</Text>
      <Text className={`text-ink font-medium text-right text-[14px] ${capitalize ? 'capitalize' : ''}`}>{value}</Text>
    </View>
  )
}

function PinStep({ pin, setPin, onComplete }: { pin: string[]; setPin: (p: string[]) => void; onComplete: () => void }) {
  const LENGTH = 4
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', 'back']
  const complete = pin.length === LENGTH

  function press(key: string) {
    if (key === 'back') return setPin(pin.slice(0, -1))
    if (key === '*') return
    if (pin.length < LENGTH) setPin([...pin, key])
  }

  return (
    <View className="flex-1">
      <View className="flex-1 px-6 pt-10">
        <Text className="text-center text-[16px] text-ink">Enter your PIN to confirm payment</Text>
        <View className="flex-row justify-center gap-4 mt-8">
          {Array.from({ length: LENGTH }).map((_, i) => {
            const isLast = i === pin.length - 1
            const hasDigit = pin[i] !== undefined
            return (
              <View
                key={i}
                className={`size-16 rounded-2xl items-center justify-center ${
                  isLast ? 'border-2 border-primary bg-primary/5' : 'bg-[#f5f5f5]'
                }`}
              >
                <Text className={`text-[22px] font-bold ${isLast ? 'text-primary' : 'text-ink'}`}>
                  {hasDigit ? (isLast ? pin[i] : '●') : ''}
                </Text>
              </View>
            )
          })}
        </View>
        <View className="mt-8">
          <Button disabled={!complete} onPress={onComplete}>
            Continue
          </Button>
        </View>
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

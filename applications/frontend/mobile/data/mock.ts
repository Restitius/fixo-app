export type Category = {
  id: string
  name: string
  emoji: string
  color: string
  description: string
}

export const CATEGORIES: Category[] = [
  { id: 'cleaning', name: 'Cleaning', emoji: '🧽', color: '#7210FF', description: 'House & deep cleaning services' },
  { id: 'repairing', name: 'Repairing', emoji: '🔧', color: '#FF6B35', description: 'Car & appliance repair experts' },
  { id: 'painting', name: 'Painting', emoji: '🎨', color: '#00B894', description: 'Interior & exterior wall painting' },
  { id: 'laundry', name: 'Laundry', emoji: '🧺', color: '#0984E3', description: 'Wash, dry & iron your clothes' },
  { id: 'appliance', name: 'Appliance', emoji: '🛠️', color: '#FDCB6E', description: 'Appliance installation & service' },
  { id: 'plumbing', name: 'Plumbing', emoji: '🚿', color: '#E17055', description: 'Pipes, leaks & plumbing fixes' },
  { id: 'shifting', name: 'Shifting', emoji: '📦', color: '#A29BFE', description: 'House & office shifting help' },
  { id: 'beauty', name: 'Beauty', emoji: '💄', color: '#FF6FA5', description: 'At-home beauty & spa treatments' },
  { id: 'ac-repair', name: 'AC Repair', emoji: '❄️', color: '#00CEC9', description: 'AC installation & maintenance' },
  { id: 'vehicle', name: 'Vehicle', emoji: '🚗', color: '#0984E3', description: 'Car & motorcycle servicing' },
  { id: 'electronics', name: 'Electronics', emoji: '📺', color: '#6C5CE7', description: 'Gadget & electronics repair' },
  { id: 'massage', name: 'Massage', emoji: '💆', color: '#FF6B6B', description: 'Relaxing at-home massage therapy' },
  { id: 'mens-salon', name: "Men's Salon", emoji: '💈', color: '#5B5FEF', description: 'Grooming & salon for men' },
]

export type Provider = {
  id: string
  categoryId: string
  name: string
  title: string
  avatar: string
  rating: number
  reviews: number
  price: number
  distanceKm: number
  location: string
  tags: string[]
  bio: string
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

function makeProvider(
  id: string,
  categoryId: string,
  name: string,
  title: string,
  rating: number,
  reviews: number,
  price: number,
  location: string,
  tags: string[],
  bio: string,
): Provider {
  return {
    id,
    categoryId,
    name,
    title,
    avatar: initials(name),
    rating,
    reviews,
    price,
    distanceKm: Math.round((1 + Math.random() * 8) * 10) / 10,
    location,
    tags,
    bio,
  }
}

export const PROVIDERS: Provider[] = [
  makeProvider('p1', 'cleaning', 'Sarah Johnson', 'House Cleaning', 4.9, 214, 25, '255 Grand Park Avenue, New York', ['Deep clean', 'Eco friendly'], 'Professional home cleaner with 6 years of experience specializing in deep cleaning and move-out cleaning.'),
  makeProvider('p2', 'cleaning', 'Maria Gomez', 'Floor Cleaning', 4.7, 132, 20, '18 Riverside Lane, New York', ['Quick service', 'Pet friendly'], 'Reliable and friendly cleaner, great with pets and flexible scheduling.'),
  makeProvider('p2b', 'cleaning', 'Tynisha Obey', 'Washing Clothes', 4.7, 7938, 22, '84 Sunset Blvd, New York', ['Same day', 'Careful handling'], 'Careful, thorough clothes washing and folding service for busy households.'),
  makeProvider('p2c', 'cleaning', 'Georgette Strobel', 'Bathroom Cleaning', 4.9, 6182, 24, '12 Hollow Creek Rd, New York', ['Deep clean', 'Sanitizing'], 'Deep sanitizing bathroom cleaning using eco-friendly products.'),
  makeProvider('p3', 'repairing', 'James Carter', 'Car Repairing', 4.8, 98, 35, '9081 Lakewood Gardens Junction', ['Car specialist', 'Certified'], 'Certified mechanic offering doorstep car repair and diagnostics.'),
  makeProvider('p4', 'repairing', 'David Lee', 'House Repairing', 4.6, 76, 30, '442 Birchwood Ave', ['Appliance', 'Fast fix'], 'Handy repairman fixing household issues and electronics on the same day.'),
  makeProvider('p4b', 'repairing', 'Freida Varnes', 'Motorcycle Repairing', 4.7, 7938, 22, '73 Copperfield St', ['Same day', 'Certified'], 'Fast, certified motorcycle repair and tune-ups at your doorstep.'),
  makeProvider('p5', 'painting', 'Anna Smith', 'Painting House Walls', 4.9, 156, 40, '623 Holy Cross Circle', ['Interior', 'Color consult'], 'Interior painting expert with an eye for color and clean finishing.'),
  makeProvider('p6', 'painting', 'Tom Wilson', 'Painting Office Walls', 4.5, 61, 38, '10 Marigold Court', ['Exterior', 'Weatherproof'], 'Exterior painting specialist using weatherproof, long-lasting paint.'),
  makeProvider('p7', 'laundry', 'Lucy Chen', 'Laundry Services', 4.8, 189, 15, '427 Russell Junction', ['Same day', 'Ironing'], 'Fast turnaround laundry and ironing service picked up from your door.'),
  makeProvider('p7b', 'laundry', 'Jane Cooper', 'Laundry Services', 4.8, 3824, 21, '58 Windmill Way', ['Same day', 'Folding'], 'Same-day laundry pickup and delivery with careful fabric handling.'),
  makeProvider('p8', 'appliance', 'Mark Davis', 'Appliance Services', 4.7, 104, 28, '232 Washington Circle', ['Installation', 'Warranty'], 'Appliance installation and maintenance with a 90-day warranty.'),
  makeProvider('p8b', 'appliance', 'Cameron Williamson', 'Kitchen Appliance', 4.9, 6273, 26, '5 Oak Terrace', ['Installation', 'Same day'], 'Kitchen appliance installation and repair specialist.'),
  makeProvider('p9', 'plumbing', 'Robert King', 'Plumbing Repairing', 4.9, 221, 32, '679 Eagle Crest Alley', ['Leak fix', '24/7'], 'Available around the clock for emergency plumbing and leak repairs.'),
  makeProvider('p9b', 'plumbing', 'Theresa Webb', 'Plumbing Repairing', 4.5, 4263, 27, '11 Fisher Ave', ['Leak fix', 'Certified'], 'Certified plumber specializing in leak detection and pipe repair.'),
  makeProvider('p10', 'shifting', 'Emily Brown', 'House Shifting', 4.6, 87, 60, '637 Superior Trail', ['Packing', 'Insured'], 'Full-service house shifting with insured packing and transport.'),
  makeProvider('p10b', 'shifting', 'Courtney Henry', 'House Shifting', 4.7, 5521, 32, '3 Timberline Dr', ['Packing', 'Insured'], 'Reliable house and office shifting crew with full insurance coverage.'),
  makeProvider('p11', 'beauty', 'Olivia Bennett', 'Facial & Skincare', 4.8, 342, 45, '77 Palm Grove Ave', ['At-home', 'Certified'], 'Licensed esthetician offering facials and skincare treatments at home.'),
  makeProvider('p12', 'ac-repair', 'Daniel Foster', 'AC Servicing', 4.7, 289, 30, '14 Frostwind Ln', ['Certified', 'Same day'], 'AC installation, gas refill, and repair with same-day availability.'),
  makeProvider('p13', 'vehicle', 'Wade Warren', 'Car Detailing', 4.6, 175, 50, '9081 Lakewood Gardens Junction', ['Detailing', 'Mobile'], 'Full mobile car detailing and wash service at your location.'),
  makeProvider('p14', 'electronics', 'Chloe Martinez', 'Phone & Laptop Repair', 4.8, 210, 35, '21 Circuit Street', ['Certified', 'Fast fix'], 'Screen replacement and hardware repair for phones and laptops.'),
  makeProvider('p15', 'massage', 'Grace Kim', 'Relaxation Massage', 4.9, 401, 55, '5 Serenity Lane', ['Licensed', 'At-home'], 'Licensed massage therapist offering relaxation and deep tissue massage.'),
  makeProvider('p16', 'mens-salon', 'Ethan Brooks', "Men's Haircut & Grooming", 4.7, 198, 25, '33 Bristle Ave', ['Walk-in', 'At-home'], 'Professional grooming and haircuts in the comfort of your home.'),
]

export function providersByCategory(categoryId: string) {
  return PROVIDERS.filter((p) => p.categoryId === categoryId)
}

export function providerById(id: string) {
  return PROVIDERS.find((p) => p.id === id)
}

export type Booking = {
  id: string
  providerId: string
  status: 'upcoming' | 'completed' | 'cancelled'
  date: string
  time: string
  address: string
  price: number
  promo?: string
}

export const BOOKINGS: Booking[] = [
  { id: 'b1', providerId: 'p1', status: 'upcoming', date: 'Sep 3, 2026', time: '09:00 AM', address: '221B Baker Street, Springfield', price: 25 },
  { id: 'b2', providerId: 'p9', status: 'upcoming', date: 'Sep 5, 2026', time: '02:30 PM', address: '48 Elm Avenue, Springfield', price: 32 },
  { id: 'b3', providerId: 'p5', status: 'completed', date: 'Aug 12, 2026', time: '11:00 AM', address: '221B Baker Street, Springfield', price: 40 },
  { id: 'b4', providerId: 'p7', status: 'completed', date: 'Jul 28, 2026', time: '08:00 AM', address: '221B Baker Street, Springfield', price: 15 },
  { id: 'b5', providerId: 'p3', status: 'cancelled', date: 'Jul 15, 2026', time: '04:00 PM', address: '9 Maple Court, Springfield', price: 35 },
]

export function bookingsByStatus(status: Booking['status']) {
  return BOOKINGS.filter((b) => b.status === status)
}

export function bookingById(id: string) {
  return BOOKINGS.find((b) => b.id === id)
}

export type ChatMessage = {
  id: string
  fromMe: boolean
  text: string
  time: string
}

export type Chat = {
  id: string
  providerId: string
  lastMessage: string
  time: string
  unread: number
  messages: ChatMessage[]
}

export const CHATS: Chat[] = [
  {
    id: 'c1',
    providerId: 'p1',
    lastMessage: "I'll be there in 10 minutes!",
    time: '09:41 AM',
    unread: 2,
    messages: [
      { id: 'm1', fromMe: false, text: 'Hi! I just confirmed your booking for tomorrow.', time: '09:12 AM' },
      { id: 'm2', fromMe: true, text: 'Great, thank you! See you then.', time: '09:15 AM' },
      { id: 'm3', fromMe: false, text: "I'll be there in 10 minutes!", time: '09:41 AM' },
    ],
  },
  {
    id: 'c2',
    providerId: 'p9',
    lastMessage: 'Sure, that works for me.',
    time: 'Yesterday',
    unread: 0,
    messages: [
      { id: 'm4', fromMe: true, text: 'Can we move the appointment to 2:30 PM?', time: 'Yesterday' },
      { id: 'm5', fromMe: false, text: 'Sure, that works for me.', time: 'Yesterday' },
    ],
  },
  {
    id: 'c3',
    providerId: 'p5',
    lastMessage: 'Thanks for the great review!',
    time: 'Aug 12',
    unread: 0,
    messages: [{ id: 'm6', fromMe: false, text: 'Thanks for the great review!', time: 'Aug 12' }],
  },
]

export function chatById(id: string) {
  return CHATS.find((c) => c.id === id)
}

export type CallLog = {
  id: string
  providerId: string
  type: 'incoming' | 'outgoing' | 'missed'
  time: string
}

export const CALLS: CallLog[] = [
  { id: 'cl1', providerId: 'p1', type: 'incoming', time: 'Today, 09:40 AM' },
  { id: 'cl2', providerId: 'p9', type: 'outgoing', time: 'Yesterday, 03:12 PM' },
  { id: 'cl3', providerId: 'p3', type: 'missed', time: 'Aug 20, 11:02 AM' },
]

export type Notification = {
  id: string
  title: string
  body: string
  time: string
  read: boolean
}

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Booking confirmed', body: 'Sarah Johnson accepted your cleaning booking for Sep 3.', time: '2m ago', read: false },
  { id: 'n2', title: 'Special offer', body: 'Get 20% off your next laundry booking this week only.', time: '1h ago', read: false },
  { id: 'n3', title: 'Payment successful', body: 'Your payment of $40 to Anna Smith was successful.', time: 'Yesterday', read: true },
  { id: 'n4', title: 'New message', body: 'Robert King sent you a message.', time: '2 days ago', read: true },
]

export type Offer = {
  id: string
  title: string
  subtitle: string
  discount: string
  color: string
}

export const OFFERS: Offer[] = [
  { id: 'o1', title: 'Weekend Cleaning Deal', subtitle: 'Book any cleaning service', discount: '20% OFF', color: '#7210FF' },
  { id: 'o2', title: 'First Repair Free Visit', subtitle: 'New customers only', discount: '$10 OFF', color: '#FF6B35' },
  { id: 'o3', title: 'Laundry Bundle', subtitle: 'Book 3 or more loads', discount: '15% OFF', color: '#0984E3' },
]

export const USER = {
  name: 'Restitius Rushambya',
  email: 'restitius.rushambya@gmail.com',
  phone: '+1 111 234 5699',
  avatar: 'RR',
  address: '221B Baker Street, Springfield',
}

export type Faq = { id: string; question: string; answer: string }

export const FAQS: Faq[] = [
  { id: 'f1', question: 'How do I book a service?', answer: 'Browse a category, pick a provider, choose a date and time, and confirm your booking with your preferred payment method.' },
  { id: 'f2', question: 'Can I cancel a booking?', answer: 'Yes, go to My Bookings, open the upcoming booking and tap Cancel Booking. Refunds are processed within 3-5 business days.' },
  { id: 'f3', question: 'What payment methods are supported?', answer: 'We support credit/debit cards, PayPal, and cash on service for select categories.' },
  { id: 'f4', question: 'How do I contact a provider?', answer: 'Open your booking and tap Message or Call to reach your assigned provider directly.' },
  { id: 'f5', question: 'Is my payment information secure?', answer: 'Yes, all payment data is encrypted and processed through secure, PCI-compliant payment providers.' },
]

export const PAYMENT_METHODS = [
  { id: 'pm1', label: 'PayPal', icon: 'paypal' as const },
  { id: 'pm2', label: 'Google Pay', icon: 'googlepay' as const },
  { id: 'pm3', label: 'Apple Pay', icon: 'applepay' as const },
  { id: 'pm4', label: '•••• •••• •••• 4679', icon: 'mastercard' as const },
  { id: 'pm5', label: 'Cash Money', icon: 'cash' as const },
]

export type Promo = {
  id: string
  title: string
  subtitle: string
  discountPercent: number
  color: string
}

export const PROMOS: Promo[] = [
  { id: 'promo1', title: 'Special 25% Off', subtitle: 'Special promo only today!', discountPercent: 25, color: '#7210FF' },
  { id: 'promo2', title: 'Discount 30% Off', subtitle: 'New user special promo', discountPercent: 30, color: '#FDCB6E' },
  { id: 'promo3', title: 'Special 20% Off', subtitle: 'Special promo only today!', discountPercent: 20, color: '#FF6B6B' },
  { id: 'promo4', title: 'Discount 40% Off', subtitle: 'Special promo only valid today', discountPercent: 40, color: '#00B894' },
  { id: 'promo5', title: 'Discount 35% Off', subtitle: 'Special promo only today!', discountPercent: 35, color: '#FF9F43' },
]

export const CAR_BRANDS = ['Ford F-Series', 'Toyota Camry', 'Honda Civic', 'Chevrolet Silverado', 'BMW 3 Series']
export const CAR_SERIES = ['F-450', 'F-150', 'Ranger', 'Explorer', 'Escape']

export const HOUSE_SIZES = ['Small', 'Medium', 'Large', 'Extra Large']
export const PAINT_COLORS = [
  '#FFFFFF', '#111111', '#EF4444', '#EC4899', '#8B5CF6',
  '#3B4CCA', '#3B82F6', '#0EA5E9', '#14B8A6', '#059669',
  '#22C55E', '#A3C93A', '#FDE047', '#F5A623', '#F97316',
  '#E4572E', '#8B5E3C', '#64748B', '#DB2777',
]

export const LANGUAGES = ['English (US)', 'Spanish', 'French', 'German', 'Portuguese', 'Swahili']

export const CLEANING_ROOMS = ['Living Room', 'Terrace', 'Bedroom', 'Bathroom', 'Kitchen', 'Dining Room', 'Garage']

export const APPLIANCE_SERVICES = ['Washing Machine', 'Refrigerator', 'Dispenser', 'Air Conditioner', 'Grilling Machine', 'Washers & Dryers', 'Cooling Machine']

export const SHIFTING_ITEMS = ['Table', 'Chair', 'Television', 'Carpet', 'Washing Machine', 'Sofa', 'Cupboard']

export type Contact = {
  id: string
  name: string
  phone: string
}

export const CONTACTS: Contact[] = [
  { id: 'ct1', name: 'Tynisha Obey', phone: '+1-300-555-0135' },
  { id: 'ct2', name: 'Florencio Dorrance', phone: '+1-202-555-0136' },
  { id: 'ct3', name: 'Chantal Shelburne', phone: '+1-300-555-0119' },
  { id: 'ct4', name: 'Maryland Winkles', phone: '+1-300-555-0161' },
  { id: 'ct5', name: 'Rodolfo Goode', phone: '+1-300-555-0136' },
  { id: 'ct6', name: 'Benny Spanbauer', phone: '+1-202-555-0167' },
  { id: 'ct7', name: 'Tyra Dhillon', phone: '+1-202-555-0119' },
  { id: 'ct8', name: 'Jamel Eusebio', phone: '+1-300-555-0171' },
  { id: 'ct9', name: 'Pedro Huard', phone: '+1-202-555-0171' },
  { id: 'ct10', name: 'Clinton Mcclure', phone: '+1-300-555-0142' },
  { id: 'ct11', name: 'Aileen Fullbright', phone: '+1-202-555-0158' },
  { id: 'ct12', name: 'Marci Senter', phone: '+1-300-555-0187' },
]

export const INITIALLY_INVITED = new Set(['ct2', 'ct4', 'ct5', 'ct8'])

export type Review = {
  id: string
  name: string
  rating: number
  text: string
  likes: number
  time: string
}

const REVIEW_POOL: Omit<Review, 'id'>[] = [
  { name: 'Lauralee Quintero', rating: 5, text: 'Awesome! this is what i was looking for, i recommend to everyone ❤️❤️❤️', likes: 724, time: '3 weeks ago' },
  { name: 'Clinton Mcclure', rating: 4, text: 'The workers are very professional and the results are very satisfying! I like it very much 💯💯💯', likes: 783, time: '1 weeks ago' },
  { name: 'Chieko Chute', rating: 5, text: "This is the first time I've used his services, and the results were amazing! 👍👍", likes: 597, time: '2 weeks ago' },
  { name: 'Marci Senter', rating: 5, text: 'This is the first time I’ve used his services, and the results were amazing! 🙌', likes: 597, time: '2 weeks ago' },
  { name: 'Aileen Fullbright', rating: 4, text: 'The workers are very professional and the results are very satisfying! I like it very much 💯', likes: 783, time: '1 weeks ago' },
  { name: 'Thad Eddings', rating: 5, text: 'Awesome! this is what i was looking for, i recommend to everyone ❤️❤️', likes: 724, time: '3 weeks ago' },
  { name: 'Phyllis Godley', rating: 5, text: 'Awesome! this is what i was looking for, i recommend to everyone ❤️❤️❤️', likes: 724, time: '3 weeks ago' },
  { name: 'Kylee Danford', rating: 4, text: 'The workers are very professional and the results are very satisfying! I like it very much 💯💯', likes: 783, time: '1 weeks ago' },
  { name: 'Maryland Winkles', rating: 5, text: 'Awesome! this is what i was looking for, i recommend to everyone ❤️❤️❤️', likes: 724, time: '3 weeks ago' },
  { name: 'Willard Purnell', rating: 5, text: 'Awesome! this is what i was looking for, i recommend to everyone ❤️❤️❤️', likes: 724, time: '3 weeks ago' },
]

export function reviewsFor(providerId: string): Review[] {
  let seed = 0
  for (let i = 0; i < providerId.length; i++) seed += providerId.charCodeAt(i)
  const rotated = [...REVIEW_POOL.slice(seed % REVIEW_POOL.length), ...REVIEW_POOL.slice(0, seed % REVIEW_POOL.length)]
  return rotated.slice(0, 5).map((r, i) => ({ ...r, id: `${providerId}-r${i}` }))
}

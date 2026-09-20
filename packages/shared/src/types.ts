// --- Enums ---

export type UserRole = 'ADMIN' | 'PERSONAL_TRAINER' | 'MEMBER' | 'RECEPTIONIST'

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'OVERDUE' | 'FROZEN'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO'

export type WorkoutDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

// --- User ---

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
}

// --- Physical Assessment ---

export interface PhysicalAssessment {
  id: string
  userId: string
  weightKg: number
  heightCm: number
  bodyFatPercent?: number
  waistCm?: number
  hipCm?: number
  chestCm?: number
  armCm?: number
  thighCm?: number
  notes?: string
  assessedAt: string
  createdAt: string
}

// --- Classes ---

export interface ClassSchedule {
  id: string
  name: string
  description: string | null
  instructorId: string
  instructor?: { id: string; name: string }
  weekday: number
  startTime: string
  durationMinutes: number
  capacity: number
  isActive: boolean
}

export interface AgendaItem {
  scheduleId: string
  name: string
  description: string | null
  instructor: { id: string; name: string }
  date: string
  startsAt: string
  durationMinutes: number
  capacity: number
  bookedCount: number
  spotsLeft: number
  bookedByMe: boolean
  myBookingId: string | null
  bookings?: { id: string; userId: string; userName: string }[]
}

// --- Plan ---

export interface Plan {
  id: string
  name: string
  description?: string
  price: number
  durationDays: number
  features: string[]
  isActive: boolean
  createdAt: string
}

// --- Subscription ---

export interface Subscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  startDate: string
  endDate: string
  user?: User
  plan?: Plan
  createdAt: string
}

// --- Payment ---

export interface Payment {
  id: string
  subscriptionId: string
  amount: number
  status: PaymentStatus
  method: PaymentMethod
  externalId?: string
  paidAt?: string
  createdAt: string
}

// --- Workout ---

export interface Workout {
  id: string
  name: string
  description?: string
  difficulty: WorkoutDifficulty
  durationMinutes: number
  exercises: Exercise[]
  planIds: string[]
  createdAt: string
}

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  videoUrl?: string
}

// --- Personal Workout ---

export interface PersonalWorkout {
  id: string
  name: string
  description?: string
  studentId: string
  trainerId: string
  exercises: PersonalExercise[]
  student?: User
  trainer?: User
  createdAt: string
  updatedAt: string
}

export interface PersonalExercise {
  id: string
  personalWorkoutId: string
  name: string
  sets: number
  reps: string
  restSeconds: number
  notes?: string
  videoUrl?: string
  order: number
}

// --- API Response ---

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

// --- Auth ---

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

// --- Dashboard Stats ---

export interface DashboardStats {
  totalMembers: number
  activeSubscriptions: number
  monthlyRevenue: number
  overduePayments: number
  newMembersThisMonth: number
  churnRate: number
  retentionRate: number
  mrr: number
}
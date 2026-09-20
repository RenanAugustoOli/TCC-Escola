import { prisma } from './prisma'

export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'OVERDUE' | 'FROZEN'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface BillingSubscriptionInput {
  id: string
  status: SubscriptionStatus
  endDate: Date
  plan: { price: number }
  payments: { status: PaymentStatus }[]
}

export type BillingAction =
  | { type: 'MARK_OVERDUE'; subscriptionId: string }
  | { type: 'GENERATE_PAYMENT'; subscriptionId: string; amount: number }

const DUE_SOON_DAYS = 3
const DUE_SOON_MS = DUE_SOON_DAYS * 24 * 60 * 60 * 1000

export function decideBillingActions(
  subscriptions: BillingSubscriptionInput[],
  now: Date,
): BillingAction[] {
  const actions: BillingAction[] = []

  for (const subscription of subscriptions) {
    if (subscription.status !== 'ACTIVE') continue

    if (subscription.endDate < now) {
      actions.push({ type: 'MARK_OVERDUE', subscriptionId: subscription.id })
      continue
    }

    const msUntilDue = subscription.endDate.getTime() - now.getTime()
    const hasOpenPayment = subscription.payments.some(
      (payment) => payment.status === 'PENDING' || payment.status === 'PAID',
    )

    if (msUntilDue <= DUE_SOON_MS && !hasOpenPayment) {
      actions.push({
        type: 'GENERATE_PAYMENT',
        subscriptionId: subscription.id,
        amount: subscription.plan.price,
      })
    }
  }

  return actions
}

export interface BillingCycleResult {
  markedOverdue: number
  paymentsGenerated: number
}

export async function runBillingCycle(): Promise<BillingCycleResult> {
  const subscriptions = await prisma.subscription.findMany({
    where: { status: 'ACTIVE' },
    include: { plan: true, payments: true, user: true },
  })

  const actions = decideBillingActions(subscriptions, new Date())

  const result: BillingCycleResult = { markedOverdue: 0, paymentsGenerated: 0 }

  for (const action of actions) {
    const subscription = subscriptions.find((s) => s.id === action.subscriptionId)
    if (!subscription) continue

    if (action.type === 'MARK_OVERDUE') {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'OVERDUE' },
      })
      await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'PAYMENT_OVERDUE',
          message: `A assinatura do plano venceu em ${subscription.endDate.toLocaleDateString('pt-BR')}.`,
        },
      })
      result.markedOverdue++
    }

    if (action.type === 'GENERATE_PAYMENT') {
      await prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: action.amount,
          method: 'PIX',
          status: 'PENDING',
          dueDate: subscription.endDate,
        },
      })
      await prisma.notification.create({
        data: {
          userId: subscription.userId,
          type: 'PAYMENT_DUE_SOON',
          message: `A cobrança do próximo ciclo (${subscription.endDate.toLocaleDateString('pt-BR')}) já está disponível.`,
        },
      })
      result.paymentsGenerated++
    }
  }

  return result
}

import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'

export const useStripe = () => {
  const config = useRuntimeConfig()
  const stripe = ref<Stripe | null>(null)
  const elements = ref<StripeElements | null>(null)

  const initializeStripe = async () => {
    if (!stripe.value) {
      stripe.value = await loadStripe(config.public.stripePublishableKey)
    }
    return stripe.value
  }

  const createPaymentElement = async (clientSecret: string) => {
    const stripeInstance = await initializeStripe()
    if (!stripeInstance) throw new Error('Stripe not initialized')

    elements.value = stripeInstance.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#000',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ff0000',
          fontFamily: 'Inter, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px',
        },
      },
    })

    const paymentElement = elements.value.create('payment', {
      layout: 'tabs',
      // wallets: {
      //   applePay: 'auto',
      // },
      payment_method_types: ['card'],
    })

    return { paymentElement, elements: elements.value }
  }

  const confirmPayment = async (
    elements: StripeElements,
    confirmParams: any
  ) => {
    const stripeInstance = await initializeStripe()
    if (!stripeInstance) throw new Error('Stripe not initialized')

    return await stripeInstance.confirmPayment({
      elements,
      confirmParams,
      redirect: 'if_required',
    })
  }

  const confirmSetup = async (elements: StripeElements, confirmParams: any) => {
    const stripeInstance = await initializeStripe()
    if (!stripeInstance) throw new Error('Stripe not initialized')

    return await stripeInstance.confirmSetup({
      elements,
      confirmParams,
      redirect: 'if_required',
    })
  }

  return {
    stripe,
    elements,
    initializeStripe,
    createPaymentElement,
    confirmPayment,
    confirmSetup,
  }
}

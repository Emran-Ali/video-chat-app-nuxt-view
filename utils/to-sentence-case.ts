export function toSentenceCase(str: string): string {
  const formatted = str
    .toLowerCase() // "payment_pending"
    .replace(/_/g, ' ') // "payment pending"

  return formatted.charAt(0).toUpperCase() + formatted.slice(1) // "Payment pending"
}

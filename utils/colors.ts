import { themeColors } from '~/themes/colors'

export const colors = () => {
  const rgbToHex = (rgb: string): string => {
    const [r, g, b] = rgb.split(' ').map(Number)
    const toHex = (c: number) => c.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase()
  }

  const modifiedObj: Record<string, string> = {} // Define type as Record<string, string>

  Object.entries(themeColors).forEach(([_, value]) => {
    Object.entries(value).forEach(([variant, shades]) => {
      Object.entries(shades).forEach(([shade, color]) => {
        modifiedObj[`${variant}-${shade}`] = rgbToHex(color as string)
      })
    })
  })


  return modifiedObj // Return modified object instead of original themeColors
}

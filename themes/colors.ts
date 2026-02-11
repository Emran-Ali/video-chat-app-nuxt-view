type ColorScale = {
  [key: number]: string // Maps numeric keys (50, 100, ..., 950) to string values
}

type ThemeColor = {
  [key: string]: ColorScale // Each color can have a primary scale
}

type ThemeColors = {
  [key: string]: ThemeColor // Maps color names (like 'teal') to ThemeColor
}

export const hexToRgb = (hex: string): string => {
  // Remove the hash if present
  hex = hex.replace(/^#/, '')

  // Parse r, g, b values
  let r: number, g: number, b: number
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    throw new Error('Invalid HEX color.')
  }

  return `${r} ${g} ${b}`
}

export const themeColors: ThemeColors = {
  pear:{
    primary:{
      50: hexToRgb('#FEFFF7'),
      100: hexToRgb('#FDFFED'),
      200: hexToRgb('#F8FFD4'),
      300: hexToRgb('#F0FCB8'),
      400: hexToRgb('#E3FC86'),
      500: hexToRgb('#D2FB54'),
      600: hexToRgb('#B4E043'),
      700: hexToRgb('#89BA2F'),
      800: hexToRgb('#66961E'),
      900: hexToRgb('#457011'),
      950: hexToRgb('#264707'),
    }
  },
  base: {
    primary: {
      50: hexToRgb('#F5F5F5'),
      100: hexToRgb('#E8E8E8'),
      200: hexToRgb('#C7C7C7'),
      300: hexToRgb('#A6A6A6'),
      400: hexToRgb('#636363'),
      500: hexToRgb('#222222'),
      600: hexToRgb('#1F1C1C'),
      700: hexToRgb('#1A1313'),
      800: hexToRgb('#140C0C'),
      900: hexToRgb('#0F0707'),
      950: hexToRgb('#0A0303'),
    },
    pear: {
      50: hexToRgb('#FEFFF7'),
      100: hexToRgb('#FDFFED'),
      200: hexToRgb('#F8FFD4'),
      300: hexToRgb('#F0FCB8'),
      400: hexToRgb('#E3FC86'),
      500: hexToRgb('#D2FB54'),
      600: hexToRgb('#B4E043'),
      700: hexToRgb('#89BA2F'),
      800: hexToRgb('#66961E'),
      900: hexToRgb('#457011'),
      950: hexToRgb('#264707'),
    },
    secondary: {
      50: hexToRgb('#F5F6F7'),
      100: hexToRgb('#EBEEF0'),
      200: hexToRgb('#D0D5D9'),
      300: hexToRgb('#B6BCC2'),
      400: hexToRgb('#868D96'),
      500: hexToRgb('#585D69'),
      600: hexToRgb('#484E5E'),
      700: hexToRgb('#323A4F'),
      800: hexToRgb('#202740'),
      900: hexToRgb('#11182E'),
      950: hexToRgb('#070C1F'),
    },
    green: {
      50: hexToRgb('#F0FAF6'),
      100: hexToRgb('#E1F5ED'),
      200: hexToRgb('#BCE8D4'),
      300: hexToRgb('#96D9B7'),
      400: hexToRgb('#54BA7B'),
      500: hexToRgb('#239E46'),
      600: hexToRgb('#1D8F3B'),
      700: hexToRgb('#13752B'),
      800: hexToRgb('#0C5E1F'),
      900: hexToRgb('#074714'),
      950: hexToRgb('#032E0B'),
    },
    mercury: {
      50: hexToRgb('#FFFFFF'),
      100: hexToRgb('#FCFCFC'),
      200: hexToRgb('#FAFAFA'),
      300: hexToRgb('#F5F5F5'),
      400: hexToRgb('#EDEEF0'),
      500: hexToRgb('#e4e4e7'),
      600: hexToRgb('#BABAD1'),
      700: hexToRgb('#8080AD'),
      800: hexToRgb('#53538C'),
      900: hexToRgb('#2F2F69'),
      950: hexToRgb('#131342'),
    },
    blue: {
      50: hexToRgb('#F5FCFF'),
      100: hexToRgb('#E8F7FC'),
      200: hexToRgb('#CCEEFC'),
      300: hexToRgb('#ACE0FA'),
      400: hexToRgb('#71BEF5'),
      500: hexToRgb('#3897F0'),
      600: hexToRgb('#2E80D9'),
      700: hexToRgb('#1E61B3'),
      800: hexToRgb('#14478F'),
      900: hexToRgb('#0B2E6B'),
      950: hexToRgb('#051A45'),
    },
  },
}

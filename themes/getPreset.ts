import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'
import type { Preset } from '@primeuix/themes/types'
import { themeColors } from './colors'

export const createThemePreset = (
  colorMappings: Record<string, string>
): Preset => {
  return definePreset(Aura, {
    semantic: {
      primary: {
        ...Object.fromEntries(
          Object.entries(colorMappings).map(([key, value]) => [
            key,
            `rgb(${value})`,
          ])
        ),
      },
      colorScheme: {
        light: {
          primary: {
            color: `rgb(${colorMappings['500']})`,
            contrastColor: `rgb(${colorMappings['50']})`,
            hoverColor: `rgb(${colorMappings['800']})`,
            activeColor: `rgb(${colorMappings['700']})`,
          },
        },
        dark: {
          primary: {
            color: `rgb(${colorMappings['800']})`,
            contrastColor: '#ffffff',
            hoverColor: `rgb(${colorMappings['600']})`,
            activeColor: `rgb(${colorMappings['200']})`,
          },
          surface: {
            ground: 'var(--surface-ground)',
            section: 'var(--surface-section)',
            card: 'var(--surface-card)',
            overlay: 'var(--surface-overlay)',
            border: 'var(--surface-border)',
            hover: 'var(--surface-hover)',
          },
          text: {
            primary: 'var(--text-color)',
            secondary: 'var(--text-secondary-color)',
            disabled: 'var(--text-disabled)',
          },
        },
      },
    },
    components: {
      button: {
        root: {
          borderRadius: '4px',
          label: {
            fontWeight: '400',
          },
        },
      },

      select: {
        root: {
          background: 'var(--surface-card)',
          borderColor: 'var(--surface-border)',
          borderRadius: '8px',
          hoverBorderColor: 'var(--surface-hover)',
          focusRing: {
            color: `rgba(${colorMappings['500']}, 0.2)`,
          },
          color: 'var(--text-color)',
          placeholderColor: '#acacb3',
        },
        dropdown: {
          color: 'var(--text-color)',
        },

        option: {
          padding: '4px 8px',
        },
      },
      inputtext: {
        root: {
          borderColor: 'var(--surface-border)',
          borderRadius: '8px',
          placeholderColor: '#acacb3',
        },
      },
      textarea: {
        root: {
          borderColor: 'var(--surface-border)',
          borderRadius: '8px',
          placeholderColor: '#acacb3',
        },
      },
      multiselect: {
        root: {
          borderColor: 'var(--surface-border)',
          borderRadius: '8px',
          placeholderColor: '#acacb3',
        },
      },
    },
    directives: {
      include: ['Ripple', 'Tooltip'],
    },
  })
}

export const themes: Record<string, Preset> = {}
Object.keys(themeColors).forEach((key) => {
  themes[key] = createThemePreset(themeColors[key].primary)
})

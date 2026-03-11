import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

export const AcaePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
      950: '#2e1065',
    },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            background: '{primary.600}',
            hoverBackground: '{primary.700}',
            activeBackground: '{primary.800}',
            borderColor: '{primary.600}',
            color: '#ffffff',
          },
        },
      },
    },
  },
})

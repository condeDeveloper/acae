import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

export const AcaePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#FFFDE7',
      100: '#FFF9C4',
      200: '#FFF59D',
      300: '#FFF176',
      400: '#FFEE58',
      500: '#FFCC02',
      600: '#E6B800',
      700: '#CCA300',
      800: '#B38F00',
      900: '#997A00',
      950: '#7A6200',
    },
    colorScheme: {
      light: {
        surface: {
          0:   '#ffffff',
          50:  '#E4E9F0',
          100: '#E8EDF4',
          200: '#D8E2EC',
          300: '#C0CDD9',
          400: '#9BA8B7',
          500: '#5A6A7E',
          600: '#3D4F61',
          700: '#2A3847',
          800: '#1C2B3A',
          900: '#111E2B',
          950: '#080E16',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#856900',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
      },
      dark: {
        surface: {
          0:   '#F0F4F8',
          50:  '#E8EDF4',
          100: '#D8E2EC',
          200: '#C0CDD9',
          300: '#9BA8B7',
          400: '#5A6A7E',
          500: '#3D4F61',
          600: '#2A3847',
          700: '#1C2B3A',
          800: '#111E2B',
          900: '#080E16',
          950: '#040810',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#856900',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: 'rgba(255,204,2,0.15)',
          focusBackground: 'rgba(255,204,2,0.25)',
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
            background: '{primary.500}',
            hoverBackground: '{primary.600}',
            activeBackground: '{primary.700}',
            borderColor: '{primary.500}',
            color: '#856900',
          },
        },
      },
    },
  },
})

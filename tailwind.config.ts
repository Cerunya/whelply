import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1B3A2D',
          dark: '#122619',
          light: '#2A5442',
          muted: '#3D6B55',
        },
        honey: {
          DEFAULT: '#C8861A',
          light: '#E8A535',
          pale: '#FDF3E0',
        },
        cream: {
          DEFAULT: '#FDFAF4',
          dark: '#F5EFE0',
          deep: '#EDE4CE',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

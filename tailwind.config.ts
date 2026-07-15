import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        serif: ['Fraunces', 'serif'],
        mono: ['DM Mono', 'monospace'],
      }
    },
  },
  plugins: [require("@tailwindcss/forms")({
    strategy: "class"
  })],
}
export default config

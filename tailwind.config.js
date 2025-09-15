/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary': '#6366f1',
        'primary-focus': '#4f46e5',
        'base-100': '#ffffff',
        'base-200': '#f3f4f6',
        'base-300': '#e5e7eb',
        'base-content': '#1f2937',
        'dark-base-100': '#1f2937',
        'dark-base-200': '#374151',
        'dark-base-300': '#4b5563',
        'dark-base-content': '#d1d5db',
      }
    }
  },
  plugins: [],
}
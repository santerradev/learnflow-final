// file: tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default { // Use export default for ES Modules
  content: [
    "./views/**/*.ejs", // Scans all .ejs files within the views folder and subfolders
  ],
  darkMode: 'class', // Keep dark mode configuration
  theme: {
    extend: {
      colors: { // Keep custom teal colors
        teal: { 
          '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4',
          '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6',
          '600': '#0d9488', '700': '#0f766e', '800': '#115e59',
          '900': '#134e4a', '950': '#042f2e',
        }
      }
    },
  },
  plugins: [],
}
// file: tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Configura o Tailwind para escanear seus arquivos EJS em busca de classes
  content: [
    "./views/**/*.ejs", // Procura em todas as subpastas dentro de /views
  ],
  // Habilita o dark mode baseado na classe 'dark' no elemento <html>
  darkMode: 'class', 
  theme: {
    extend: {
      // Você pode adicionar cores personalizadas aqui se quiser
      colors: {
        // Exemplo: define 'teal' para usar em vez das cores padrão
        teal: {
          '50': '#f0fdfa',
          '100': '#ccfbf1',
          '200': '#99f6e4',
          '300': '#5eead4',
          '400': '#2dd4bf', // Acento Dark Mode
          '500': '#14b8a6', // Acento Dark Mode (Alternativa)
          '600': '#0d9488', // Acento Light Mode
          '700': '#0f766e',
          '800': '#115e59',
          '900': '#134e4a',
          '950': '#042f2e',
        }
      }
    },
  },
  plugins: [],
}
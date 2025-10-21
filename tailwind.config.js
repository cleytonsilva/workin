/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./popup/**/*.{html,js}",
    "./options/**/*.{html,js}",
    "./content/**/*.{html,js}",
    "./shared/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // Paleta WorkIn baseada no PRD
        'linkedin-blue': '#0A66C2',
        'workin-blue': '#00A0DC',
        'workin-success': '#057642',
        'workin-warning': '#F5A623',
        'workin-error': '#CC1016',
        'workin-neutral': '#666666',
        'workin-light': '#F8F9FA',
        'workin-dark': '#1D2226'
      },
      fontFamily: {
        'sans': ['Segoe UI', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '18px'
      },
      borderRadius: {
        'workin': '4px',
        'workin-card': '8px'
      },
      boxShadow: {
        'workin': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'workin-hover': '0 4px 12px rgba(0, 0, 0, 0.15)'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      }
    }
  },
  plugins: []
}
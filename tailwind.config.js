/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // EMERGE Brand Colors
        foundation: '#1A1A1D',      // Rich Charcoal - backgrounds
        movement: '#FF006E',         // Hot Magenta - primary actions
        breakthrough: '#E9FF7A',     // Citrus Yellow - highlights/success
        surface: '#2D2D30',          // Card backgrounds
        'text-primary': '#FFFFFF',
        'text-muted': '#A0A0A0',
        
        // Curriculum accent colors
        wilson: '#4F46E5',           // Indigo
        delta: '#059669',            // Emerald
        camino: '#DC2626',           // Red
        wordgen: '#7C3AED',          // Violet
        amira: '#0891B2',            // Cyan
        
        // Tier colors
        tier2: '#F59E0B',            // Amber
        tier3: '#EF4444',            // Red
      },
      fontFamily: {
        brand: ['Plus Jakarta Sans', 'sans-serif'],
        student: ['Atkinson Hyperlegible', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

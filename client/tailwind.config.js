/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx}', './index.html'],
  safelist: [
    'bg-[#d4eced]', 'text-[#0A5F63]',
    'bg-amber-50', 'text-amber-700',
    'bg-gray-100', 'text-gray-500',
    'bg-gray-100', 'text-gray-600',
    'bg-green-50', 'text-green-700',
    'bg-purple-50', 'text-purple-700',
    'bg-[#fef3c7]', 'text-amber-800',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        cm: {
          bg:    '#F5F4F1',
          surf:  '#FFFFFF',
          bdr:   '#E8E6E3',
          bdrst: '#D4D2CF',
          ac:    '#0D7377',
          ach:   '#0A5F63',
          dim:   'rgba(13,115,119,0.08)',
          t1:    '#111111',
          t2:    '#6B7280',
          t3:    '#9CA3AF',
        },
      },
      animation: {
        'spin-slow': 'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [],
}

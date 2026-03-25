export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable class-based dark mode
    theme: {
        extend: {
            colors: {
                primary: '#3B82F6', // Keeping original primary for brand consistency
                // Light mode colors
                light: {
                    bg: '#FFFFFF',
                    'bg-secondary': '#F9FAFB',
                    'bg-tertiary': '#F3F4F6',
                    text: '#111827',
                    'text-secondary': '#6B7280',
                    'text-tertiary': '#9CA3AF',
                    border: '#E5E7EB',
                    'border-hover': '#D1D5DB',
                },
                // Dark mode colors
                dark: {
                    bg: '#0F172A',
                    'bg-secondary': '#1E293B',
                    'bg-tertiary': '#334155',
                    text: '#F1F5F9',
                    'text-secondary': '#CBD5E1',
                    'text-tertiary': '#94A3B8',
                    border: '#334155',
                    'border-hover': '#475569',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}

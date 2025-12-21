/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f97316', // orange-500 - 明亮温暖的橙色
          light: '#ffedd5', // orange-100
          dark: '#ea580c', // orange-600 - 稍深的橙色
          hover: '#fb923c', // orange-400 - 悬停时的明亮橙色
        },
        autumn: {
          gold: '#fbbf24', // amber-400 - 明亮的金色
          red: '#f87171', // red-400 - 温暖的红色
          brown: '#92400e', // amber-800 - 暖棕色
          leaf: '#f59e0b', // amber-500 - 秋叶色
          bg: '#fffbeb', // amber-50 - 温暖的米白色背景
          bgLight: '#fef3c7', // amber-100 - 浅金色背景
        }
      },
      animation: {
        'flip': 'flip 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        }
      }
    },
  },
  plugins: [],
}

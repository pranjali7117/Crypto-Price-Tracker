 //@type {import('tailwindcss').Config} 
module.exports = {
    content: [
      "./index.html", // Important: Include your main HTML file for Vite
      "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/JSX/TS/TSX files in the src/ directory
    ],
    theme: {
      extend: {
        fontFamily: {
          // Define a custom font family for 'Inter' to use throughout your app
          inter: ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }
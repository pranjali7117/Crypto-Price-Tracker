# 🚀 Crypto Price Tracker

A modern, responsive cryptocurrency price tracking application built with React, Vite, and Tailwind CSS. Get real-time cryptocurrency data, search functionality, and AI-powered insights.

![Crypto Tracker Demo](https://img.shields.io/badge/React-18.2.0-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0.0-purple?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)

## ✨ Features

- **Real-time Cryptocurrency Data**: Live price updates from CoinGecko API
- **Advanced Search**: Search with autocomplete suggestions and keyboard navigation
- **AI-Powered Insights**: Get personalized cryptocurrency insights using Gemini AI
- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Dark Theme**: Eye-friendly dark mode interface
- **API Key Management**: Secure storage for your API keys
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Frontend**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Styling**: Tailwind CSS 4.0
- **APIs**: 
  - CoinGecko API (cryptocurrency data)
  - Google Gemini AI API (insights)
- **Icons**: Heroicons (SVG)
- **Animations**: CSS transitions and transforms

## 🚀 Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/crypto-price-tracker.git
   cd crypto-price-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

### API Keys Setup

To use all features, you'll need to set up API keys:

1. **CoinGecko API**: Free tier available at [CoinGecko](https://www.coingecko.com/en/api)
2. **Gemini AI API**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

Enter your API keys in the app's settings section for full functionality.

## 📱 Features in Detail

### 🔍 Smart Search
- Real-time search with autocomplete
- Keyboard navigation (arrow keys, Enter, Escape)
- Click outside to close suggestions
- Search by name or symbol

### 💡 AI Insights
- Get personalized cryptocurrency analysis
- Powered by Google Gemini AI
- Fallback insights when API key is not available
- Detailed market analysis and trends

### 🎨 Modern UI
- Glassmorphism design elements
- Smooth hover animations
- Responsive grid layout
- Professional color scheme

### 🔐 API Key Management
- Secure local storage
- Password field protection
- Easy apply/reset functionality
- Collapsible settings panel

## 📁 Project Structure

```
crypto-price-tracker/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   └── react.svg
│   ├── App.jsx          # Main application component
│   ├── App.css          # Global styles
│   ├── index.css        # Tailwind CSS imports
│   └── main.jsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── README.md           # Project documentation
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🌐 API Endpoints Used

### CoinGecko API
- `https://api.coingecko.com/api/v3/coins/markets` - Get cryptocurrency market data
- `https://api.coingecko.com/api/v3/search` - Search cryptocurrencies

### Gemini AI API
- `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent` - Generate AI insights

## 🎨 Customization

### Styling
The app uses Tailwind CSS for styling. You can customize:
- Colors in `tailwind.config.js`
- Animations in component classes
- Layout in the main App component

### Features
- Add new cryptocurrency data sources
- Implement additional AI models
- Add more search filters
- Create custom themes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- [CoinGecko](https://www.coingecko.com/) for providing cryptocurrency data
- [Google Gemini AI](https://ai.google.dev/) for AI insights
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework
- [Vite](https://vitejs.dev/) for the build tool
- [React](https://reactjs.org/) for the UI library

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Review the code comments

---

**Made with ❤️ by pranjali**

*Happy trading! 📈*

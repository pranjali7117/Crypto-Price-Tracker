import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

// Main App component
const App = () => {
    const [cryptos, setCryptos] = useState([]); // State to store cryptocurrency data
    const [searchTerm, setSearchTerm] = useState(''); // State for search input
    const [loading, setLoading] = useState(true); // State to manage loading status
    const [error, setError] = useState(null); // State to manage errors during API calls
    const [apiKey, setApiKey] = useState(() => {
        // Load API key from localStorage on component mount
        return localStorage.getItem('coinledger_apiKey') || '';
    }); // State to store the API key for CoinGecko
    const [geminiApiKey, setGeminiApiKey] = useState(() => {
        // Load Gemini API key from localStorage on component mount
        return localStorage.getItem('coinledger_geminiApiKey') || '';
    }); // State to store the Gemini API key
    const [llmInsight, setLlmInsight] = useState(null); // State to store LLM generated insight
    const [isInsightLoading, setIsInsightLoading] = useState(false); // State for LLM loading
    const [insightError, setInsightError] = useState(null); // State for LLM error
    const [showApiKeyInput, setShowApiKeyInput] = useState(false); // State to toggle API key input visibility
    const [showSuggestions, setShowSuggestions] = useState(false); // State to show/hide search suggestions
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1); // State for keyboard navigation
    const searchInputRef = useRef(null); // Ref for search input
    const suggestionsRef = useRef(null); // Ref for suggestions container

    // Function to fetch cryptocurrency data from CoinGecko API
    const fetchCryptoData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // CoinGecko API endpoint for a comprehensive list of coins with market data
            // We're fetching up to 100 coins, ordered by market cap, with 24hr price change
            let apiUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h';

            // If an API key is provided, append it to the URL (CoinGecko demo API key uses x_cg_demo_api_key)
            if (apiKey) {
                apiUrl += `&x_cg_demo_api_key=${apiKey}`;
            }

            const response = await fetch(apiUrl);

            if (!response.ok) {
                // Attempt to parse error message from response body if available
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`HTTP error! Status: ${response.status} - ${errorData.error || errorData.message || 'Unknown error'}`);
            }

            const data = await response.json();
            // The /coins/markets endpoint directly returns an array of coin objects,
            // so we can use the data directly without extensive re-mapping.
            setCryptos(data);
        } catch (err) {
            console.error("Failed to fetch crypto data:", err);
            setError(`Failed to load cryptocurrency data: ${err.message}. Please check your API key or try again later.`);
        } finally {
            setLoading(false);
        }
    }, [apiKey]); // Dependency array includes apiKey so fetchCryptoData re-runs when it changes

    // Function to get LLM insight for a specific cryptocurrency
    const getCryptoInsight = useCallback(async (cryptoName) => {
        setIsInsightLoading(true);
        setInsightError(null);
        setLlmInsight(null); // Clear previous insight

        try {
            // If no Gemini API key is provided, show a fallback insight
            if (!geminiApiKey) {
                const fallbackInsights = [
                    `${cryptoName} is a prominent cryptocurrency in the digital asset market. It continues to attract attention from investors and traders worldwide.`,
                    `${cryptoName} represents a significant player in the blockchain ecosystem. Its performance often reflects broader market trends in the crypto space.`,
                    `${cryptoName} has established itself as a key digital asset with growing adoption and market presence.`,
                    `${cryptoName} continues to evolve in the competitive cryptocurrency landscape, offering unique value propositions to its community.`
                ];
                const randomInsight = fallbackInsights[Math.floor(Math.random() * fallbackInsights.length)];
                setLlmInsight({ name: cryptoName, text: randomInsight });
                return;
            }

            let chatHistory = [];
            const prompt = `Provide a brief, concise, and neutral insight or a "what's new" update about ${cryptoName}. Focus on recent developments, key features, or its general market position. Keep it to 2-3 sentences.`;
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = { contents: chatHistory };
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                setLlmInsight({ name: cryptoName, text: text });
            } else {
                setInsightError("Could not generate insight. Please try again.");
                console.error("Unexpected LLM response structure:", result);
            }
        } catch (err) {
            console.error("Error calling Gemini API:", err);
            setInsightError(`Failed to get insight: ${err.message}.`);
        } finally {
            setIsInsightLoading(false);
        }
    }, [geminiApiKey]);

    // Memoize search suggestions
    const searchSuggestions = useMemo(() => {
        if (!searchTerm || searchTerm.length < 1) return [];

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const suggestions = cryptos.filter(crypto =>
            crypto.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            crypto.symbol.toLowerCase().includes(lowerCaseSearchTerm)
        ).slice(0, 8); // Limit to 8 suggestions

        return suggestions;
    }, [cryptos, searchTerm]);

    // Function to save API keys to localStorage
    const saveApiKey = (key, value) => {
        localStorage.setItem(`coinledger_${key}`, value);
    };

    // Function to clear all API keys
    const clearAllApiKeys = () => {
        localStorage.removeItem('coinledger_apiKey');
        localStorage.removeItem('coinledger_geminiApiKey');
        setApiKey('');
        setGeminiApiKey('');
        setShowApiKeyInput(false);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowSuggestions(value.length > 0);
        setSelectedSuggestionIndex(-1);
    };

    // Handle keyboard navigation in suggestions
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedSuggestionIndex(prev =>
                    prev < searchSuggestions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
                    selectSuggestion(searchSuggestions[selectedSuggestionIndex]);
                }
                break;
            case 'Escape':
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
                searchInputRef.current?.blur();
                break;
        }
    };

    // Handle suggestion selection
    const selectSuggestion = (crypto) => {
        setSearchTerm(crypto.name);
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        searchInputRef.current?.blur();
    };

    // Handle click outside suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
                searchInputRef.current && !searchInputRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setSelectedSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // useEffect hook to fetch data on component mount and when API key changes,
    // and set up interval for refreshing
    useEffect(() => {
        fetchCryptoData();
        // Refresh data every 60 seconds (CoinGecko API has rate limits, adjust as needed)
        const intervalId = setInterval(fetchCryptoData, 60000); // 60 seconds

        // Cleanup function to clear the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [fetchCryptoData]); // Dependency array ensures effect runs when fetchCryptoData changes

    // Memoize filtered cryptos to prevent unnecessary re-renders
    const filteredCryptos = useMemo(() => {
        if (!searchTerm) {
            return cryptos;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return cryptos.filter(crypto =>
            crypto.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            crypto.symbol.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [cryptos, searchTerm]);

    // Render the main application UI
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-inter">
            {/* Animated background particles */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Header section */}
            <header className="relative z-10 pt-8 pb-6 px-4 sm:px-8">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                            <span className="text-2xl">₿</span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                            CoinLedger
                        </h1>
                    </div>
                    <p className="text-xl sm:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Track Smarter. Trade Better.
                    </p>
                    <div className="flex items-center justify-center mt-4 space-x-2 text-sm text-gray-400">
                        <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                            Live Data
                        </div>
                        <span>•</span>
                        <span>Updated every 60s</span>
                    </div>
                </div>
            </header>

            {/* Search section */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 mb-6">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-2xl">
                    {/* Search bar with suggestions */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search cryptocurrencies..."
                            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => searchTerm.length > 0 && setShowSuggestions(true)}
                        />
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-gray-400">
                            {filteredCryptos.length} of {cryptos.length} cryptocurrencies
                        </div>
                    </div>
                </div>
            </div>

            {/* API Settings section */}
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-8 mb-8">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                    {/* API Settings Header */}
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {(!apiKey && !geminiApiKey) ? (
                                    <button
                                        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                                        className="flex items-center text-sm text-gray-300 hover:text-white transition-colors duration-200"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        API Settings
                                    </button>
                                ) : (
                                    <div className="flex items-center text-sm text-green-400">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        API Keys Configured
                                    </div>
                                )}

                                {/* Expand/Collapse Chevron */}
                                <button
                                    onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                                    className="ml-3 p-1 text-gray-400 hover:text-white transition-all duration-200"
                                >
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-200 ${showApiKeyInput ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {apiKey && geminiApiKey && (
                                <button
                                    onClick={clearAllApiKeys}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200"
                                >
                                    Clear All Keys
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Collapsible API Key Input */}
                    {showApiKeyInput && (!apiKey || !geminiApiKey) && (
                        <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">CoinGecko API Key (Optional)</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        placeholder="Enter CoinGecko API Key for higher rate limits"
                                        className="flex-1 p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300 border border-white/20"
                                        value={apiKey}
                                        onChange={(e) => {
                                            setApiKey(e.target.value);
                                            saveApiKey('apiKey', e.target.value);
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && fetchCryptoData()}
                                    />
                                    <button
                                        onClick={fetchCryptoData}
                                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                                    >
                                        Apply
                                    </button>
                                </div>
                                <p className="text-gray-400 text-xs mt-2">
                                    For higher rate limits, add your CoinGecko API key
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key (Optional)</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="password"
                                        placeholder="Enter Gemini API Key for AI insights"
                                        className="flex-1 p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300 border border-white/20"
                                        value={geminiApiKey}
                                        onChange={(e) => {
                                            setGeminiApiKey(e.target.value);
                                            saveApiKey('geminiApiKey', e.target.value);
                                        }}
                                        onKeyPress={(e) => e.key === 'Enter' && getCryptoInsight('Bitcoin')}
                                    />
                                    <button
                                        onClick={() => getCryptoInsight('Bitcoin')}
                                        className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
                                    >
                                        Test & Get Insight
                                    </button>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-gray-400 text-xs">
                                        For AI-powered insights, add your Gemini API key. Without it, you'll get basic insights.
                                    </p>
                                    <a
                                        href="https://aistudio.google.com/app/apikey"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors duration-200 flex items-center"
                                    >
                                        Get API Key
                                        <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* Clear All Keys Button */}
                            {(apiKey || geminiApiKey) && (
                                <div className="pt-4 border-t border-white/10">
                                    <button
                                        onClick={clearAllApiKeys}
                                        className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 text-sm font-medium flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Clear All Saved API Keys
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Search Suggestions - Positioned outside controls container */}
            {showSuggestions && searchSuggestions.length > 0 && (
                <div className="fixed z-[9999] max-w-6xl mx-auto left-1/2 transform -translate-x-1/2 px-4 sm:px-8">
                    <div
                        ref={suggestionsRef}
                        className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl max-h-80 overflow-y-auto"
                        style={{
                            top: searchInputRef.current ? searchInputRef.current.getBoundingClientRect().bottom + 2 : 0,
                            width: searchInputRef.current ? searchInputRef.current.offsetWidth : 'auto'
                        }}
                    >
                        {searchSuggestions.map((crypto, index) => (
                            <div
                                key={crypto.id}
                                className={`flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-white/10 ${index === selectedSuggestionIndex ? 'bg-white/20' : ''
                                    } ${index === 0 ? 'rounded-t-xl' : ''} ${index === searchSuggestions.length - 1 ? 'rounded-b-xl' : ''}`}
                                onClick={() => selectSuggestion(crypto)}
                                onMouseEnter={() => setSelectedSuggestionIndex(index)}
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                                    {crypto.symbol ? crypto.symbol.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-white font-medium">{crypto.name}</div>
                                    <div className="text-gray-400 text-sm">{crypto.symbol?.toUpperCase()}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-semibold">
                                        ${crypto.current_price ? crypto.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : 'N/A'}
                                    </div>
                                    <div className={`text-xs ${crypto.price_change_percentage_24h_in_currency >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {crypto.price_change_percentage_24h_in_currency >= 0 ? '+' : ''}{crypto.price_change_percentage_24h_in_currency ? crypto.price_change_percentage_24h_in_currency.toFixed(2) : 'N/A'}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
            }

            {/* Main content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pb-8">
                {/* Conditional rendering based on loading, error, or data availability */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin animation-delay-1000"></div>
                        </div>
                        <p className="mt-6 text-xl text-gray-300 font-medium">Loading cryptocurrency data...</p>
                        <p className="mt-2 text-sm text-gray-500">Fetching real-time market data</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-red-400 mb-2">Failed to load data</h3>
                        <p className="text-gray-300 mb-4">{error}</p>
                        <button
                            onClick={fetchCryptoData}
                            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredCryptos.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No results found</h3>
                        <p className="text-gray-500">Try adjusting your search terms</p>
                    </div>
                ) : (
                    // Crypto list display
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCryptos.map((crypto, index) => (
                            <CryptoCard
                                key={crypto.id}
                                crypto={crypto}
                                onGetInsight={getCryptoInsight}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* LLM Insight Modal */}
            {
                llmInsight && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                    {llmInsight.name} Insight
                                </h3>
                                <button
                                    onClick={() => setLlmInsight(null)}
                                    className="text-gray-400 hover:text-white transition-colors duration-200"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                                <p className="text-gray-200 leading-relaxed">{llmInsight.text}</p>
                            </div>
                            <button
                                onClick={() => setLlmInsight(null)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )
            }

            {/* LLM Loading/Error Message */}
            {
                (isInsightLoading || insightError) && (
                    <div className="fixed bottom-6 right-6 bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4 rounded-xl shadow-2xl border border-white/10 z-50 animate-in slide-in-from-bottom-2 duration-300">
                        {isInsightLoading && (
                            <div className="flex items-center">
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
                                <p className="font-medium">Generating insight...</p>
                            </div>
                        )}
                        {insightError && (
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-red-400 font-medium">{insightError}</p>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Footer */}
            <footer className="relative z-10 mt-16 py-8 px-4 sm:px-8 border-t border-white/10">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-6 text-gray-400 text-sm">
                        <span>Data provided by <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium">CoinGecko</a></span>
                        <span>•</span>
                        <span>&copy; 2025 CoinLedger</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// CryptoCard component to display individual cryptocurrency details
const CryptoCard = ({ crypto, onGetInsight, index }) => {
    // Determine text color based on 24hr price change
    const priceChangeColor = crypto.price_change_percentage_24h_in_currency >= 0 ? 'text-green-400' : 'text-red-400';
    const priceChangeBg = crypto.price_change_percentage_24h_in_currency >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';
    const priceChangeSign = crypto.price_change_percentage_24h_in_currency >= 0 ? '+' : '';

    return (
        <div
            className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20 hover:border-white/30 animate-in fade-in slide-in-from-bottom-4 duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {crypto.symbol ? crypto.symbol.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                            {crypto.name}
                        </h2>
                        <span className="text-gray-400 text-sm font-medium">
                            {crypto.symbol ? crypto.symbol.toUpperCase() : 'N/A'}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">Rank</div>
                    <div className="text-lg font-bold text-white">#{crypto.market_cap_rank || 'N/A'}</div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="text-xs text-gray-400 mb-1">Current Price</div>
                    <div className="text-2xl font-black text-white">
                        ${crypto.current_price ? crypto.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : 'N/A'}
                    </div>
                </div>

                <div className={`${priceChangeBg} rounded-xl p-3 border border-current/20`}>
                    <div className="text-xs text-gray-400 mb-1">24h Change</div>
                    <div className={`text-lg font-bold ${priceChangeColor} flex items-center`}>
                        {priceChangeSign}{crypto.price_change_percentage_24h_in_currency ? crypto.price_change_percentage_24h_in_currency.toFixed(2) : 'N/A'}%
                        <svg className={`w-4 h-4 ml-1 ${crypto.price_change_percentage_24h_in_currency >= 0 ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <div className="text-gray-400 mb-1">Market Cap</div>
                        <div className="font-semibold text-white">
                            ${crypto.market_cap ? (crypto.market_cap / 1e9).toFixed(2) + 'B' : 'N/A'}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400 mb-1">Volume (24h)</div>
                        <div className="font-semibold text-white">
                            ${crypto.total_volume ? (crypto.total_volume / 1e6).toFixed(1) + 'M' : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => onGetInsight(crypto.name)}
                className="mt-6 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 group/btn"
            >
                <span>Get AI Insight</span>
                <svg className="w-4 h-4 group-hover/btn:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </button>
        </div>
    );
};

// Export the App component as default
export default App;

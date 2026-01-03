import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    // Hardcoded to light theme
    React.useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    const value = {
        theme: 'light',
        toggleTheme: () => { }, // No-op
        isDark: false,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

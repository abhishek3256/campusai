import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = () => {
    const context = useTheme();

    // Safety check to prevent crash if context is missing
    if (!context) {
        console.warn('ThemeToggle used outside of ThemeProvider');
        return null;
    }

    const { theme, toggleTheme } = context;

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-dark-bg-tertiary 
                 text-gray-800 dark:text-dark-text
                 hover:bg-gray-300 dark:hover:bg-dark-border
                 transition-all duration-200"
            aria-label="Toggle theme"
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </button>
    );
};

export default ThemeToggle;

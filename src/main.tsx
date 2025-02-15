import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const Root = () => {
  useEffect(() => {
    // Theme management
    const setThemeBasedOnSystemPreference = () => {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.body.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
    };

    // In your updateBodySize function:
    const updateBodySize = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      document.body.style.height = `${vh}px`;
      document.body.style.width = '100vw';
      
      // Lock scroll position
      window.scrollTo(0, 0);
      document.documentElement.style.overflow = 'hidden';
    };

    // Initial setup
    setThemeBasedOnSystemPreference();
    updateBodySize();

    // Event listeners
    const resizeListener = () => requestAnimationFrame(updateBodySize);
    window.visualViewport?.addEventListener('resize', resizeListener);
    window.addEventListener('resize', resizeListener);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', setThemeBasedOnSystemPreference);

    return () => {
      mediaQuery.removeEventListener('change', setThemeBasedOnSystemPreference);
      window.visualViewport?.removeEventListener('resize', resizeListener);
      window.removeEventListener('resize', resizeListener);
    };
  }, []);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Global CSS required
const style = document.createElement('style');
style.textContent = `
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden !important;
    touch-action: none;
    -webkit-overflow-scrolling: none;
  }
  
  #root {
    height: 100%;
    width: 100%;
  }
`;
document.head.appendChild(style);

// Render
const root = createRoot(document.getElementById('root')!);
root.render(<Root />);
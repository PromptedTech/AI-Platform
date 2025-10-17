import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  themes, 
  getThemeById, 
  getDefaultTheme, 
  getAllThemes,
  applyThemeToDocument,
  getThemeFromStorage,
  saveThemeToStorage 
} from '../lib/themes';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children, user }) => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(true); // Keep for compatibility

  // Load theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true);
      
      try {
        let themeToUse = null;
        
        if (user) {
          // Try to load user's saved theme from Firebase
          try {
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.selectedTheme) {
                themeToUse = getThemeById(userData.selectedTheme);
              }
            }
          } catch (error) {
            console.error('Error loading user theme from Firebase:', error);
          }
        }
        
        // Fallback to localStorage
        if (!themeToUse) {
          const storedTheme = getThemeFromStorage();
          themeToUse = storedTheme ? getThemeById(storedTheme.id) : null;
        }
        
        // Final fallback to default theme
        if (!themeToUse) {
          themeToUse = getDefaultTheme();
        }
        
        setCurrentTheme(themeToUse);
        applyThemeToDocument(themeToUse);
        
        // Set dark mode based on theme
        setIsDark(themeToUse.id !== 'minimal');
        
      } catch (error) {
        console.error('Error loading theme:', error);
        const defaultTheme = getDefaultTheme();
        setCurrentTheme(defaultTheme);
        applyThemeToDocument(defaultTheme);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, [user]);

  const changeTheme = async (themeId) => {
    try {
      const newTheme = getThemeById(themeId);
      
      if (!newTheme) {
        console.error('Theme not found:', themeId);
        return;
      }

      // Apply theme immediately
      setCurrentTheme(newTheme);
      applyThemeToDocument(newTheme);
      saveThemeToStorage(newTheme);
      
      // Update dark mode
      setIsDark(newTheme.id !== 'minimal');
      
      // Save to Firebase if user is logged in
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            await updateDoc(userRef, {
              selectedTheme: themeId,
              updatedAt: new Date().toISOString()
            });
          } else {
            // Create user document with theme preference
            await setDoc(userRef, {
              selectedTheme: themeId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error saving theme to Firebase:', error);
        }
      }
      
    } catch (error) {
      console.error('Error changing theme:', error);
    }
  };

  const toggleTheme = () => {
    // Legacy function for compatibility - switches between dark and light
    const newThemeId = isDark ? 'minimal' : 'nova-default';
    changeTheme(newThemeId);
  };

  const value = {
    currentTheme,
    availableThemes: getAllThemes(),
    isLoading,
    isDark,
    changeTheme,
    toggleTheme,
    // Legacy compatibility
    toggleTheme: toggleTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
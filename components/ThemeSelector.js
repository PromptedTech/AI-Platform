import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { Palette, Check, Sparkles, Droplets, Zap, Sun } from 'lucide-react';

const ThemeSelector = ({ isOpen, onClose }) => {
  const { currentTheme, availableThemes, changeTheme, isLoading } = useTheme();
  const [selectedThemeId, setSelectedThemeId] = useState(currentTheme?.id || 'nova-default');

  const themeIcons = {
    'nova-default': Sparkles,
    'aurora': Sparkles,
    'oceanic': Droplets,
    'neon': Zap,
    'minimal': Sun
  };

  const handleThemeSelect = (themeId) => {
    setSelectedThemeId(themeId);
    changeTheme(themeId);
    
    // Close modal after a short delay to show the change
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Choose Theme
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Customize your Nova AI experience
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Theme Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {availableThemes.map((theme) => {
              const Icon = themeIcons[theme.id] || Palette;
              const isSelected = selectedThemeId === theme.id;
              const isDefault = theme.isDefault;

              return (
                <motion.button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Theme Preview */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      theme.id === 'nova-default' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                      theme.id === 'aurora' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                      theme.id === 'oceanic' ? 'bg-gradient-to-r from-cyan-500 to-blue-500' :
                      theme.id === 'neon' ? 'bg-gradient-to-r from-pink-500 to-cyan-500' :
                      'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-800 dark:text-slate-100">
                          {theme.name}
                        </h3>
                        {isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {/* Color Palette Preview */}
                  <div className="flex gap-2 mb-3">
                    <div 
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700"
                      style={{ 
                        background: theme.cssVariables['--bg-gradient'].replace('linear-gradient(', '').replace(')', '').split(',')[0].trim()
                      }}
                    />
                    <div 
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700"
                      style={{ 
                        background: theme.cssVariables['--chat-bubble-user'].replace('linear-gradient(', '').replace(')', '').split(',')[0].trim()
                      }}
                    />
                    <div 
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700"
                      style={{ 
                        background: theme.cssVariables['--accent-primary']
                      }}
                    />
                    <div 
                      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700"
                      style={{ 
                        background: theme.cssVariables['--sidebar-bg']
                      }}
                    />
                  </div>

                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Your theme preference will be saved automatically
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ThemeSelector;

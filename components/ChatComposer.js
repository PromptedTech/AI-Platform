/**
 * ChatComposer Component
 * 
 * Enhanced chat input with:
 * - Model selection dropdown (GPT-4o, GPT-4 Turbo, etc.)
 * - Knowledge base toggle
 * - File type indicator (text/image)
 * - Auto-growing textarea
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Database, ChevronDown } from 'lucide-react';

const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, fastest' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Efficient and affordable' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Previous generation flagship' },
  { id: 'gpt-4', name: 'GPT-4', description: 'Original GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and economical' },
];

export default function ChatComposer({
  onSend,
  disabled = false,
  placeholder = 'Type your message...',
  showModelSelector = true,
  showKnowledgeToggle = true,
  initialModel = 'gpt-4o-mini',
  initialUseKnowledge = false,
  type = 'text', // 'text' or 'image'
}) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [useKnowledge, setUseKnowledge] = useState(initialUseKnowledge);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowModelMenu(false);
      }
    };

    if (showModelMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showModelMenu]);

  /**
   * Handle send message
   */
  const handleSend = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || disabled) return;

    // Call parent handler with message and settings
    onSend({
      content: trimmedInput,
      model: selectedModel,
      useKnowledge: type === 'text' ? useKnowledge : false,
    });

    // Clear input
    setInput('');
  };

  /**
   * Handle Enter key (send on Enter, new line on Shift+Enter)
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Get selected model info
   */
  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[1];

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      {/* Model Selector & Knowledge Toggle */}
      {(showModelSelector || showKnowledgeToggle) && type === 'text' && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          {/* Model Selector */}
          {showModelSelector && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="font-medium">{selectedModelInfo.name}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showModelMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showModelMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-10">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Select Model
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {AVAILABLE_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setShowModelMenu(false);
                        }}
                        className={`
                          w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                          ${selectedModel === model.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{model.name}</span>
                          {selectedModel === model.id && (
                            <span className="text-blue-500 text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {model.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Knowledge Toggle */}
          {showKnowledgeToggle && (
            <button
              onClick={() => setUseKnowledge(!useKnowledge)}
              disabled={disabled}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm
                ${useKnowledge 
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <Database className={`w-4 h-4 ${useKnowledge ? 'text-green-500' : 'text-gray-500'}`} />
              <span className="font-medium">
                {useKnowledge ? 'Knowledge: ON' : 'Knowledge: OFF'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none max-h-32 overflow-y-auto"
            style={{ minHeight: '48px' }}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium transition-colors disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
        >
          <Send className="w-5 h-5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}

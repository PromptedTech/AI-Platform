# Minimal Dashboard Redesign Reference

## Design Philosophy
Inspired by ChatGPT, Claude, and Perplexity:
- **Centered chat column** (max 780px) - focus on conversation
- **Minimal sidebar** (280px) - clean history list
- **Floating input** - bottom-fixed with glass effect
- **Calm colors** - CSS variables from designSystem.js
- **Generous spacing** - breathing room between messages
- **Subtle animations** - smooth transitions only

## Key CSS Classes to Use

### Layout
```jsx
// Main container
<div className="min-h-screen bg-[var(--color-bg-primary)]">

// Content wrapper - centered chat
<main className="content-center px-4 py-6">

// Sidebar
<aside className="w-[280px] bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-default)]">
```

### Chat Bubbles
```jsx
// User message (right-aligned)
<div className="chat-bubble chat-bubble-user animate-slide-up">
  {message.text}
</div>

// AI message (left-aligned)
<div className="chat-bubble chat-bubble-ai animate-slide-up">
  {message.text}
</div>
```

### Input Bar (Floating)
```jsx
<div className="fixed bottom-0 left-0 right-0 pb-safe-mobile bg-[var(--color-bg-primary)] border-t border-[var(--color-border-default)]">
  <div className="content-center px-4 py-4">
    <div className="glass-minimal rounded-2xl p-2">
      <textarea 
        className="input-minimal resize-none" 
        placeholder="Message Nova AI..."
        rows={1}
      />
      <button className="btn-primary">
        <Send className="w-5 h-5" />
      </button>
    </div>
  </div>
</div>
```

### Sidebar Chat History
```jsx
<div className="space-y-1 p-2">
  {threads.map(thread => (
    <button
      key={thread.id}
      className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth"
    >
      <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
        {thread.title}
      </div>
      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
        {formatTimestamp(thread.updatedAt)}
      </div>
    </button>
  ))}
</div>
```

### Top Bar (Clean)
```jsx
<header className="sticky top-0 z-50 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] shadow-sm">
  <div className="h-16 px-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-primary)] flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Nova AI</h1>
        <p className="text-xs text-[var(--color-text-tertiary)]">GPT-4o</p>
      </div>
    </div>
  </div>
</header>
```

## Component Structure

### Minimal Dashboard Layout
```
┌─────────────────────────────────────────┐
│ Top Bar (Fixed)                         │ h-16
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │  Centered Chat Column        │
│ 280px    │  max-w-[780px]              │
│          │                              │
│ History  │  Messages (scrollable)       │
│ List     │                              │
│          │                              │
│          │                              │
│          ├──────────────────────────────┤
│          │ Floating Input (Fixed)       │ h-20
└──────────┴──────────────────────────────┘
```

### Mobile Layout (<768px)
```
┌─────────────────────────────────────────┐
│ Top Bar                                 │
├─────────────────────────────────────────┤
│                                         │
│ Full Width Chat                         │
│                                         │
│ Messages                                │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ Floating Input                          │
├─────────────────────────────────────────┤
│ Bottom Nav (Chat | History | Profile)  │
└─────────────────────────────────────────┘
```

## Implementation Steps

### 1. Update Main Layout Structure
Replace complex gradient backgrounds with:
```jsx
<div className="min-h-screen bg-[var(--color-bg-primary)] dark">
```

### 2. Create Centered Content Wrapper
```jsx
<main className="flex-1 flex flex-col">
  <div className="content-center flex-1 px-4 py-6">
    {/* Messages */}
  </div>
</main>
```

### 3. Redesign Message Rendering
```jsx
{messages.map((msg, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
  >
    <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
      {msg.content}
    </div>
  </motion.div>
))}
```

### 4. Convert Input to Floating Bar
```jsx
<div className="fixed bottom-0 inset-x-0 pb-safe-mobile">
  <div className="content-center px-4 py-4 bg-[var(--color-bg-primary)] border-t border-[var(--color-border-default)]">
    <div className="glass-minimal rounded-2xl flex items-end gap-2 p-2">
      <textarea
        className="input-minimal flex-1 max-h-32"
        placeholder="Message Nova AI..."
      />
      <button className="btn-primary p-3 rounded-xl">
        <Send className="w-5 h-5" />
      </button>
    </div>
  </div>
</div>
```

### 5. Simplify Sidebar
```jsx
<aside className={`
  fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)]
  w-[280px] bg-[var(--color-bg-secondary)]
  border-r border-[var(--color-border-default)]
  transition-transform duration-300
  ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
`}>
  {/* Search bar */}
  <div className="p-3">
    <input
      type="search"
      placeholder="Search chats..."
      className="input-minimal text-sm"
    />
  </div>
  
  {/* Chat list */}
  <div className="overflow-y-auto px-2">
    {threads.map(thread => (
      <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-smooth">
        <div className="text-sm font-medium truncate">{thread.title}</div>
        <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
          {formatTime(thread.updatedAt)}
        </div>
      </button>
    ))}
  </div>
</aside>
```

## Color Mapping (Old → New)

### Backgrounds
- `bg-[#121620]` → `bg-[var(--color-bg-primary)]`
- `bg-[#1f2532]` → `bg-[var(--color-bg-secondary)]`
- Card backgrounds → `bg-[var(--color-bg-elevated)]`

### Text
- `text-[#e5e7eb]` → `text-[var(--color-text-primary)]`
- `text-[#9ca3af]` → `text-[var(--color-text-secondary)]`
- Muted text → `text-[var(--color-text-tertiary)]`

### Borders
- `border-[#1f2532]` → `border-[var(--color-border-default)]`
- Subtle borders → `border-[var(--color-border-light)]`

### Accent
- `bg-[#8b5cf6]` → `bg-[var(--color-accent-primary)]`
- Hover purple → `hover:bg-[var(--color-accent-hover)]`

## Remove These Elements
- ❌ Heavy gradients (`bg-gradient-to-br`, `from-purple-500`, etc.)
- ❌ Glow effects (`shadow-lg shadow-purple-500/50`)
- ❌ Neon borders
- ❌ Over-styled cards with multiple backgrounds
- ❌ Complex theme selector (simplify to dark/light toggle)

## Add These Features
- ✅ Generous whitespace (mb-6 between messages)
- ✅ Subtle hover states (hover:bg-[var(--color-bg-tertiary)])
- ✅ Smooth transitions (transition-smooth utility)
- ✅ Auto-resizing textarea
- ✅ Safe-area insets for mobile (pb-safe-mobile)
- ✅ Scroll-to-bottom on new messages
- ✅ Loading states with subtle animation

## Mobile Optimizations

### Responsive Breakpoints
```jsx
// Hide sidebar on mobile
<aside className="hidden md:block">

// Show menu button on mobile
<button className="md:hidden">
  <Menu />
</button>

// Floating input full width
<div className="content-center md:max-w-[780px]">
```

### Touch Targets
All interactive elements should be minimum 44px:
```jsx
<button className="min-h-[44px] min-w-[44px]">
```

### Keyboard Handling
```jsx
// Auto-resize textarea
useEffect(() => {
  if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
  }
}, [input]);

// Send on Enter (desktop only)
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
    e.preventDefault();
    sendMessage();
  }
};
```

## Example: Minimal Message Component

```jsx
const MessageBubble = ({ message, isUser }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.25 }}
    className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
  >
    {!isUser && (
      <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center mr-3 flex-shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
    )}
    
    <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}>
      {message.typing ? (
        <TypingMessage text={message.content} />
      ) : (
        <ReactMarkdown className="prose prose-sm max-w-none">
          {message.content}
        </ReactMarkdown>
      )}
      
      <div className="text-xs text-[var(--color-text-muted)] mt-2">
        {formatTimestamp(message.timestamp)}
      </div>
    </div>
    
    {isUser && (
      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center ml-3 flex-shrink-0">
        <User className="w-4 h-4 text-[var(--color-text-secondary)]" />
      </div>
    )}
  </motion.div>
);
```

## Next Steps

1. **Backup current dashboard.js**
   ```bash
   cp pages/dashboard.js pages/dashboard-old.js
   ```

2. **Start with layout structure** - update outer containers first

3. **Replace hardcoded colors** - use CSS variables from globals.css

4. **Simplify components** - remove unused theme variables, gradients

5. **Test responsiveness** - verify on mobile (iPhone), tablet, desktop

6. **Add keyboard shortcuts** - Cmd+K for search, Cmd+N for new chat

7. **Polish animations** - keep only fade/slide, remove bounces/scales

## Testing Checklist

- [ ] Chat bubbles display correctly (user right, AI left)
- [ ] Input bar stays fixed at bottom
- [ ] Sidebar toggles on mobile
- [ ] Safe-area insets work on iPhone (notch/home indicator)
- [ ] Dark mode variables apply correctly
- [ ] Typing animation smooth
- [ ] Message history scrolls properly
- [ ] Auto-scroll to latest message
- [ ] Keyboard shortcuts work
- [ ] Touch targets 44px minimum

# Chat V2 Architecture

Clean, organized, and reusable code structure for the AI Sous-Chef interface.

## 📁 File Organization

```
chat-v2/
├── page.tsx                          # Server component (auth)
├── page-client.tsx                   # Client wrapper (CopilotKit provider + context)
├── copilot-theme.css                 # Mobile-first CSS overrides
├── README.md                         # Feature documentation
├── ARCHITECTURE.md                   # This file
│
├── components/                       # UI Components
│   ├── enhanced-chat.tsx            # Main chat orchestrator (66 lines)
│   ├── empty-state.tsx              # Warm welcome screen
│   ├── smart-prompts.tsx            # Time/location-aware suggestions
│   ├── resource-card.tsx            # Food bank/pantry cards
│   ├── event-card.tsx               # Community event cards
│   ├── post-preview.tsx             # Community post previews
│   ├── typing-indicator.tsx         # Animated loading states
│   ├── voice-input.tsx              # Speech-to-text input
│   │
│   └── tool-renderers/              # Generative UI renderers
│       ├── index.tsx                # Main ToolRenderers component
│       ├── search-resources-renderer.tsx
│       ├── search-events-renderer.tsx
│       ├── search-posts-renderer.tsx
│       ├── directions-renderer.tsx
│       ├── resource-details-renderer.tsx
│       └── user-context-renderer.tsx
│
├── hooks/                            # Custom React Hooks
│   ├── use-chat-suggestions.ts      # Context-aware prompt generation
│   └── use-prompt-injection.ts      # Inject text into chat input
│
└── config/                           # Configuration & Constants
    └── chat-config.ts                # System instructions, labels, constants
```

## 🎯 Design Principles

### **1. Separation of Concerns**
- **Components**: UI presentation only
- **Hooks**: Business logic and side effects
- **Config**: Constants and configuration
- **Tool Renderers**: Isolated generative UI logic

### **2. Single Responsibility**
Each file has ONE clear purpose:
- `search-resources-renderer.tsx` → Only renders search_resources tool
- `use-chat-suggestions.ts` → Only generates suggestions
- `chat-config.ts` → Only stores configuration

### **3. Composability**
Components are small and reusable:
```tsx
<ToolRenderers userLocation={coords} />
  ├─ <SearchResourcesRenderer />
  ├─ <SearchEventsRenderer />
  ├─ <SearchPostsRenderer />
  ├─ <DirectionsRenderer />
  ├─ <ResourceDetailsRenderer />
  └─ <UserContextRenderer />
```

### **4. Type Safety**
All components have explicit interfaces:
```tsx
interface SearchResourcesRendererProps {
  userLocation: { lat: number; lng: number } | null;
}
```

### **5. File Size Limits**
- **Components**: < 150 lines
- **Renderers**: < 60 lines each
- **Hooks**: < 70 lines
- **Main orchestrator**: < 70 lines

## 🔄 Data Flow

```
page.tsx (server)
  ↓ [user session]
page-client.tsx
  ↓ [CopilotKit provider + location context]
enhanced-chat.tsx
  ├─→ ToolRenderers
  │     ├─→ SearchResourcesRenderer (useCopilotAction)
  │     ├─→ SearchEventsRenderer (useCopilotAction)
  │     └─→ ... (5 more renderers)
  ├─→ SmartPrompts (uses usePromptInjection)
  ├─→ VoiceInput (uses usePromptInjection)
  └─→ CopilotChat (official UI component)
```

## 🛠️ Adding New Features

### **Add a new tool renderer:**
1. Create `tool-renderers/new-tool-renderer.tsx`
2. Export renderer component
3. Add to `tool-renderers/index.tsx`
4. Done! ✅

### **Add a new UI component:**
1. Create `components/new-component.tsx`
2. Import into `enhanced-chat.tsx`
3. Use in JSX
4. Done! ✅

### **Add a new hook:**
1. Create `hooks/use-new-feature.ts`
2. Export hook function
3. Import and use in component
4. Done! ✅

### **Modify configuration:**
1. Edit `config/chat-config.ts`
2. Changes apply everywhere
3. Done! ✅

## 📊 Component Dependency Graph

```
enhanced-chat.tsx (main)
  │
  ├─→ ToolRenderers
  │     ├─→ ResourceCard
  │     ├─→ EventCard
  │     └─→ PostPreview
  │
  ├─→ SmartPrompts
  │     └─→ usePromptInjection
  │
  ├─→ VoiceInput
  │     └─→ usePromptInjection
  │
  ├─→ useChatSuggestions
  │
  └─→ CHAT_CONFIG
```

## 🎨 Styling Architecture

### **CSS Structure:**
```css
copilot-theme.css
  ├─ Layout Foundation (mobile-first)
  ├─ Message Bubbles
  ├─ Input Area
  ├─ Empty State
  ├─ Typing Indicator
  ├─ Tool Execution Feedback
  ├─ Scrollbar Styling
  ├─ Accessibility
  ├─ Dark Mode
  └─ Loading States
```

### **Design Tokens:**
Uses CSS variables from Tailwind:
- `hsl(var(--background))`
- `hsl(var(--foreground))`
- `hsl(var(--card))`
- `hsl(var(--muted))`
- `hsl(var(--primary))`
- `hsl(var(--border))`

## 🚀 Performance Optimizations

1. **Lazy Loading**: Tool renderers only mount when needed
2. **Conditional Rendering**: SmartPrompts only show when messageCount === 0
3. **Memo**: Consider adding React.memo to card components if needed
4. **Code Splitting**: Each tool renderer is a separate module

## 🧪 Testing Strategy

### **Unit Tests** (Future):
- `hooks/use-chat-suggestions.test.ts`
- `hooks/use-prompt-injection.test.ts`
- `components/resource-card.test.tsx`

### **Integration Tests** (Future):
- `enhanced-chat.test.tsx`
- Tool renderer interactions

### **E2E Tests** (Future):
- Voice input flow
- Smart prompt selection
- Tool rendering with real data

## 📝 Code Style

### **Naming Conventions:**
- Components: PascalCase (ResourceCard)
- Hooks: camelCase with "use" prefix (useChatSuggestions)
- Constants: SCREAMING_SNAKE_CASE (CHAT_CONFIG)
- Props interfaces: ComponentNameProps (ResourceCardProps)

### **Import Order:**
1. React imports
2. Third-party imports (CopilotKit, etc.)
3. Internal components
4. Internal hooks
5. Internal config
6. Types

### **Comments:**
- JSDoc for exported components/hooks
- Inline comments for complex logic only
- File headers for purpose description

## 🔐 Security Considerations

1. **XSS Prevention**: All user content rendered through React (auto-escaped)
2. **External Links**: Use `rel="noopener noreferrer"` for `target="_blank"`
3. **Voice Input**: Only transcription, no command execution
4. **Tool Results**: Validated and typed before rendering

## 🎓 Key Learnings

1. **Small files are maintainable** - Easy to find, edit, and test
2. **One concern per file** - Clear mental model
3. **Hooks extract logic** - Components stay presentational
4. **Config centralizes constants** - Change once, apply everywhere
5. **Tool renderers are plugins** - Add/remove without touching main component

This architecture scales well and makes the codebase a joy to work with! 🎉

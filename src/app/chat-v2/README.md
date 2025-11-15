# TheFeed AI Sous-Chef v2 (CopilotKit)

A complete reimagining of the AI chat interface with mobile-first design, generative UI, and creative enhancements.

## ✨ What We Built

### **Phase 1: Mobile-First Foundation**
- ✅ **Responsive CSS** - Mobile-first design with 680px max-width container (like iMessage/WhatsApp)
- ✅ **Message bubbles** - User messages align right with warm accent, AI messages align left with muted style
- ✅ **Centered layout** - Professional chat interface that works on all screen sizes
- ✅ **Dark mode support** - Enhanced shadows and contrast for dark theme

### **Phase 2: Enhanced Components**

#### **EmptyState** (`components/empty-state.tsx`)
- Warm welcome message with personality
- 🥘 Friendly icon with fade-in animation
- Quick prompt suggestions
- Neighborly copy that explains capabilities

#### **SmartPrompts** (`components/smart-prompts.tsx`)
- **Context-aware suggestions** based on:
  - Time of day (breakfast/lunch/dinner prompts)
  - Day of week (weekend events)
  - Location detection (nearby resources)
- Grid layout with 4 intelligent suggestions
- Auto-hides after first message

#### **ResourceCard** (`components/resource-card.tsx`)
- Beautiful card design for food banks/pantries
- Shows: name, address, distance, open/closed status, hours
- Services tags (fresh bread, produce, etc.)
- Quick actions: Directions, Call, Visit Website
- Integrated Google Maps directions

#### **EventCard** (`components/event-card.tsx`)
- Event type badges (potluck, volunteer, food-distribution)
- Verified status indicator
- Date/time formatting with `date-fns`
- Location and distance display
- Direct link to event detail page for RSVP

#### **PostPreview** (`components/post-preview.tsx`)
- Post kind badges (sharing, requesting, event)
- Time ago formatting
- Content preview (3 lines max)
- Link to full post in community feed

#### **TypingIndicator** (`components/typing-indicator.tsx`)
- Animated bouncing dots
- Context-aware messages:
  - "🔍 Searching nearby resources..."
  - "🗺️ Calculating distances..."
  - "📅 Checking event schedules..."
  - "🧠 Thinking about your request..."

#### **VoiceInput** (`components/voice-input.tsx`)
- Web Speech API integration
- Browser support detection
- Visual feedback (red pulse when listening)
- Auto-transcription to input field
- Gracefully degrades if not supported

### **Phase 3: Generative UI Integration**

#### **EnhancedChat** (`components/enhanced-chat.tsx`)
The main wrapper that brings everything together:

**Generative UI for All 7 Tools:**
1. **search_resources** - Renders resource cards with live distance, hours, and actions
2. **search_events** - Renders event cards with RSVP links
3. **search_posts** - Renders post previews from community feed
4. **get_directions** - Renders Google Maps link card
5. **get_resource_by_id** - Renders detailed resource card
6. **get_user_context** - Renders saved locations list
7. **log_chat** - Silent (no UI)

**Features:**
- Status-aware rendering (inProgress → executing → complete)
- Loading messages for each tool
- Empty state detection
- Voice input integration
- Smart prompt suggestions via `useCopilotChatSuggestions`

## 🎨 Design Principles

1. **Mobile-First** - Starts at 320px, scales up gracefully
2. **Warm & Neighborly** - TheFeed is about community, not enterprise
3. **Clear Hierarchy** - Visual distinction between user/AI messages
4. **Accessibility** - Focus states, reduced motion support, screen reader optimized
5. **Performance** - Lazy loading, optimized animations

## 🚀 Usage

```tsx
import ChatV2Client from "@/app/chat-v2/page-client";

// In server component:
const session = await auth.api.getSession({ headers: await headers() });

return (
  <ChatV2Client
    user={session?.user || null}
  />
);
```

## 📦 Components Structure

```
chat-v2/
├── page.tsx                    # Server component (auth)
├── page-client.tsx             # Client wrapper (CopilotKit provider)
├── copilot-theme.css           # Mobile-first CSS overrides
├── README.md                   # This file
└── components/
    ├── enhanced-chat.tsx       # Main chat with generative UI
    ├── empty-state.tsx         # Warm welcome screen
    ├── smart-prompts.tsx       # Time/location-aware suggestions
    ├── resource-card.tsx       # Food bank/pantry cards
    ├── event-card.tsx          # Community event cards
    ├── post-preview.tsx        # Community post previews
    ├── typing-indicator.tsx    # Animated loading states
    └── voice-input.tsx         # Speech-to-text input
```

## 🎯 Creative Features Implemented

✅ **Context-aware prompts** - Changes based on time of day and location
✅ **Generative UI** - Rich cards for all tool results
✅ **Voice input** - Hands-free accessibility
✅ **Smart typing indicators** - Contextual loading messages
✅ **Empty state with personality** - Warm, neighborly welcome
✅ **Mobile-optimized** - 680px centered container
✅ **Quick actions** - Directions, Call, RSVP buttons on cards
✅ **Dark mode support** - Enhanced for both themes

## 🔜 Future Enhancements

Planned but not yet implemented:

- ⏳ **Keyboard shortcuts** (/ for focus, Esc to clear)
- ⏳ **Floating action button** (mobile quick menu)
- ⏳ **Mini-map integration** (header preview)
- ⏳ **Deep link intents** (auto-send from ?intent=hungry)
- ⏳ **Celebration animations** (confetti on helpful actions)
- ⏳ **OpenRouter + Anthropic** (switch from OpenAI to Claude)
- ⏳ **Recent searches chips** (quick access to history)
- ⏳ **Impact metrics** (gamification widget)
- ⏳ **Seasonal themes** (holiday decorations)

## 🐛 Known Issues

1. **OpenRouter Integration** - Currently using OpenAI directly; custom baseURL doesn't work with beta.chat.completions API
2. **Suggested Prompts** - Need to integrate click handler with CopilotChat input
3. **Message Count** - Need proper event listener for hasMessages state

## 💡 Technical Notes

- **CopilotKit Version**: 1.10.6
- **Uses**: `useCopilotAction` with `render` prop for generative UI
- **Context Injection**: `useCopilotReadable` for location/user data
- **Styling**: CSS overrides (no headless UI yet)
- **Tools**: All 7 backend tools have frontend renderers

## 🎓 Lessons Learned

1. **CopilotKit's generative UI is powerful** - `useCopilotAction` with `render` allows full control over tool visualization
2. **Mobile-first CSS is critical** - The initial full-width layout was unusable
3. **Context matters** - Time-based and location-based prompts feel intelligent
4. **Voice input adds accessibility** - Web Speech API works well for supported browsers
5. **Visual feedback is essential** - Loading states and progress indicators build trust

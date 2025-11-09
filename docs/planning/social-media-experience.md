# TheFeed - Social Media Experience Plan

**Project**: TheFeed (formerly FoodShare)
**Vision**: Transform food insecurity into community action through innovative social mechanics
**Last Updated**: 2025-01-06

---

## 🎯 Core Philosophy

**"Every meal tells a story. Every story sparks action."**

TheFeed isn't another social network—it's a **movement visualization platform** that makes the invisible crisis of food insecurity visible, actionable, and communal through real-time impact tracking and story-driven engagement.

---

## 🌊 The Three Waves (Core Mechanics)

### Wave 1: **"Ripple Effect"** - Story Chains
**Purpose**: Turn individual acts into visible community narratives

#### How It Works
1. **Origin Post**: Someone shares/receives food → posts with photo/story
2. **Ripple Continuation**: Recipients add "what happened next"
   - "Made chili for 8 people with these ingredients"
   - "Shared half with my neighbor who's recovering from surgery"
3. **Inspiration Ripple**: Others post "this inspired me to..."
4. **Visual Chain**: Animated thread showing food → meals → community impact

#### Technical Implementation
```typescript
// Database Schema
ripples {
  id: uuid
  originPostId: uuid
  rippleType: 'continuation' | 'inspiration' | 'multiplication'
  authorId: uuid
  content: text
  mediaUrls: string[]
  peopleImpacted: number
  createdAt: timestamp
}

ripple_chains {
  id: uuid
  originPostId: uuid
  totalRipples: number
  totalPeopleReached: number
  depth: number // how many levels deep
  lastActivityAt: timestamp
}
```

#### UX Components
- `<RippleOrigin>` - Initial post with "Start a Ripple" CTA
- `<RippleThread>` - Animated chain visualization
- `<RippleContinuation>` - Quick form to add to chain
- `<RippleMetrics>` - "This started with 5 lbs of rice → fed 47 people"

#### Gamification
- **Ripple Starter**: Created 5 ripples that others continued
- **Ripple Amplifier**: Your ripples reached 100+ people
- **Deep Wave**: Created a ripple chain 10+ levels deep

---

### Wave 2: **"The Heat Map"** - Live Need Visualization
**Purpose**: Make invisible food insecurity visible and actionable in real-time

#### How It Works
1. **Need Signals**: Anonymous requests create "heat" in neighborhoods
   - "3 families need dinner tonight in 95824"
   - Doesn't expose individuals, shows aggregate need
2. **Surplus Signals**: Food shares create "cool zones"
3. **Real-Time Balance**: Map shows hot (red) → warm (orange) → balanced (green) → surplus (blue)
4. **Community Goals**: "Cool down this neighborhood by 6 PM"

#### Technical Implementation
```typescript
// Geospatial aggregation
heat_zones {
  id: uuid
  zipCode: string
  lat: number
  lng: number
  needLevel: number // 0-100 scale
  surplusLevel: number // 0-100 scale
  activeRequests: number
  activeShares: number
  lastUpdated: timestamp
}

// Real-time updates via WebSocket
heat_events {
  type: 'need_added' | 'share_added' | 'match_completed'
  zoneId: uuid
  impactDelta: number
  timestamp: timestamp
}
```

#### UX Components
- `<HeatMapView>` - Mapbox GL with color-coded zones
- `<ZoneDetail>` - Click zone to see "15 people need help, 8 shares available"
- `<QuickAction>` - "Share food in this zone" / "Claim nearby share"
- `<ZonePulse>` - Animated pulse when new need/share added
- `<CooldownProgress>` - "32% to balanced in 95824"

#### Gamification
- **Neighborhood Hero**: Cooled down your neighborhood 10 times
- **Heat Fighter**: Responded to hot zones within 1 hour
- **Zone Balancer**: Helped achieve balance in 5+ neighborhoods

---

### Wave 3: **"Flash Missions"** - Urgent Collective Action
**Purpose**: Create Twitch-stream-like excitement for urgent food needs

#### How It Works
1. **Mission Triggered**: High-urgency need detected
   - "50 people need dinner tonight - MISSION ACTIVE"
2. **Live Countdown**: Timer ticking, progress bar filling
3. **Community Contribution**: People chip in real-time
   - "5 people just committed meals!"
   - "32/50 people covered - 18 to go!"
4. **Success Celebration**: Confetti animation, community recognition
5. **Mission Replay**: Show how it came together

#### Technical Implementation
```typescript
missions {
  id: uuid
  title: string
  description: string
  urgency: 'critical' | 'high' | 'moderate'
  targetPeople: number
  currentProgress: number
  deadline: timestamp
  location: string
  status: 'active' | 'completed' | 'expired'
  createdAt: timestamp
}

mission_contributions {
  id: uuid
  missionId: uuid
  userId: uuid
  contributionType: 'food_share' | 'volunteer' | 'coordination'
  peopleImpacted: number
  createdAt: timestamp
}

// WebSocket for live updates
mission_updates {
  missionId: uuid
  type: 'progress' | 'completion' | 'contribution'
  data: json
  timestamp: timestamp
}
```

#### UX Components
- `<MissionAlert>` - Push notification + in-app banner
- `<MissionCard>` - Large format with countdown, progress bar
- `<LiveFeed>` - "Sarah just committed 10 meals!" scroll
- `<ContributeModal>` - Quick commitment flow
- `<MissionSuccess>` - Animated celebration with contributor list
- `<MissionHistory>` - "You've completed 12 flash missions"

#### Gamification
- **First Responder**: First to contribute to 5 missions
- **Mission Critical**: Completed 25 flash missions
- **Clutch Player**: Provided the final contribution 10 times

---

## 🎮 Gamification System

### Achievement Tiers
```typescript
achievements {
  id: uuid
  userId: uuid
  type: 'ripple' | 'heat_map' | 'mission' | 'impact' | 'community'
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend'
  unlockedAt: timestamp
  metadata: json
}
```

### Badge Categories

#### 🌊 Ripple Badges
- **Storyteller**: Shared 10 food journey stories
- **Chain Reaction**: Started ripples that reached 100+ people
- **Deep Impact**: Created a ripple chain 15+ levels deep

#### 🔥 Heat Map Badges
- **Zone Defender**: Helped cool 5 different neighborhoods
- **First Alert**: First to respond in a hot zone 10 times
- **Balancer**: Brought 3 zones from red to green

#### ⚡ Mission Badges
- **Quick Draw**: Responded to missions within 5 minutes
- **Mission Commander**: Completed 50 flash missions
- **Legend**: Completed a mission solo

#### 💝 Impact Badges
- **Century Club**: Helped feed 100 people
- **Millennium**: Helped feed 1000 people
- **Community Pillar**: Active for 6+ months

#### 🤝 Social Badges
- **Connector**: Inspired 25 people to take action
- **Mentor**: Helped 10 new users complete their first action
- **Ambassador**: Invited 5 people who became active

### Progress Tracking
- Personal impact dashboard
- Weekly/monthly summaries
- Shareable achievements ("I helped feed 150 people this month!")
- City-wide leaderboards (opt-in, anonymous option)

---

## 📱 Feed Algorithm & Content Mix

### Feed Composition (Personalized)
```
50% - Ripple stories from your area
20% - Active flash missions (urgent)
15% - Heat map updates (nearby zones)
10% - Achievement celebrations (community members)
5% - App updates & tips
```

### Ranking Factors
1. **Proximity** (within 5 miles = highest priority)
2. **Urgency** (flash missions > time-sensitive shares)
3. **Engagement potential** (ripple chains vs isolated posts)
4. **Recency** (< 2 hours = boost)
5. **User connections** (people you've collaborated with)

### Feed Filters
- **All**: Complete personalized feed
- **Missions**: Only active flash missions
- **Heat Map**: Zone-based needs and surplus
- **Ripples**: Story chains only
- **My Impact**: Your contributions and their effects

---

## 🏗️ Technical Architecture

### Database Schema (Complete)

```sql
-- Core social tables
posts {
  id: uuid PRIMARY KEY
  userId: uuid REFERENCES users(id)
  postType: enum('ripple_origin', 'share_offer', 'gratitude', 'milestone')
  content: text
  mediaUrls: text[]
  location: geometry(Point, 4326)
  visibility: enum('public', 'community', 'private')
  metadata: jsonb
  createdAt: timestamp
  updatedAt: timestamp
}

-- Ripple system
ripples {
  id: uuid PRIMARY KEY
  originPostId: uuid REFERENCES posts(id)
  parentRippleId: uuid REFERENCES ripples(id)
  rippleType: enum('continuation', 'inspiration', 'multiplication')
  authorId: uuid REFERENCES users(id)
  content: text
  mediaUrls: text[]
  peopleImpacted: integer
  depth: integer
  createdAt: timestamp
}

ripple_chains {
  id: uuid PRIMARY KEY
  originPostId: uuid REFERENCES posts(id)
  totalRipples: integer
  totalPeopleReached: integer
  maxDepth: integer
  lastActivityAt: timestamp
}

-- Heat map system
heat_zones {
  id: uuid PRIMARY KEY
  zipCode: varchar(10)
  geom: geometry(Polygon, 4326)
  needLevel: integer CHECK (needLevel BETWEEN 0 AND 100)
  surplusLevel: integer CHECK (surplusLevel BETWEEN 0 AND 100)
  activeRequests: integer
  activeShares: integer
  lastUpdated: timestamp
}

anonymous_requests {
  id: uuid PRIMARY KEY
  zoneId: uuid REFERENCES heat_zones(id)
  peopleCount: integer
  urgency: enum('low', 'medium', 'high', 'critical')
  fulfilled: boolean
  expiresAt: timestamp
  createdAt: timestamp
}

-- Mission system
missions {
  id: uuid PRIMARY KEY
  title: varchar(200)
  description: text
  urgency: enum('critical', 'high', 'moderate')
  targetPeople: integer
  currentProgress: integer
  deadline: timestamp
  zoneId: uuid REFERENCES heat_zones(id)
  status: enum('active', 'completed', 'expired')
  createdAt: timestamp
  completedAt: timestamp
}

mission_contributions {
  id: uuid PRIMARY KEY
  missionId: uuid REFERENCES missions(id)
  userId: uuid REFERENCES users(id)
  contributionType: enum('food_share', 'volunteer', 'coordination')
  peopleImpacted: integer
  createdAt: timestamp
}

-- Gamification
achievements {
  id: uuid PRIMARY KEY
  userId: uuid REFERENCES users(id)
  achievementType: varchar(50)
  tier: enum('bronze', 'silver', 'gold', 'platinum', 'legend')
  metadata: jsonb
  unlockedAt: timestamp
}

user_stats {
  userId: uuid PRIMARY KEY REFERENCES users(id)
  totalRipplesCreated: integer
  totalPeopleHelped: integer
  totalMissionsCompleted: integer
  zonesHelped: integer[]
  streakDays: integer
  lastActiveAt: timestamp
}

-- Reactions & engagement
reactions {
  id: uuid PRIMARY KEY
  targetId: uuid -- post or ripple ID
  targetType: enum('post', 'ripple')
  userId: uuid REFERENCES users(id)
  reactionType: enum('grateful', 'inspired', 'helpful', 'celebrate')
  createdAt: timestamp
  UNIQUE(targetId, targetType, userId)
}

-- Notifications
notifications {
  id: uuid PRIMARY KEY
  userId: uuid REFERENCES users(id)
  type: enum('ripple_added', 'mission_active', 'zone_alert', 'achievement', 'gratitude')
  data: jsonb
  read: boolean
  createdAt: timestamp
}
```

### API Routes Structure

```
src/app/api/
├── feed/
│   ├── route.ts              # GET personalized feed
│   └── filters/route.ts      # GET feed with filters
├── posts/
│   ├── route.ts              # GET list, POST create
│   └── [postId]/
│       ├── route.ts          # GET, PATCH, DELETE
│       ├── ripples/route.ts  # GET ripples, POST add ripple
│       └── reactions/route.ts # POST add reaction
├── ripples/
│   ├── [rippleId]/route.ts   # GET, PATCH, DELETE
│   └── chains/[chainId]/route.ts # GET entire chain
├── heat-map/
│   ├── zones/route.ts        # GET all zones with heat levels
│   ├── [zoneId]/route.ts     # GET zone details
│   └── stream/route.ts       # WebSocket for real-time updates
├── missions/
│   ├── route.ts              # GET active missions, POST create
│   ├── [missionId]/
│   │   ├── route.ts          # GET details
│   │   ├── contribute/route.ts # POST contribution
│   │   └── stream/route.ts   # WebSocket for live updates
│   └── history/route.ts      # GET completed missions
├── achievements/
│   ├── route.ts              # GET user achievements
│   └── unlock/route.ts       # POST check for unlocks
├── profile/
│   └── [userId]/
│       ├── route.ts          # GET public profile
│       ├── stats/route.ts    # GET impact stats
│       └── ripples/route.ts  # GET user's ripple chains
└── notifications/
    ├── route.ts              # GET notifications
    └── [notificationId]/read/route.ts # PATCH mark read
```

### Component Architecture

```
src/components/
├── feed/
│   ├── Feed.tsx              # Main feed container
│   ├── FeedFilters.tsx       # Filter tabs
│   ├── PostCard.tsx          # Universal post card
│   └── InfiniteScroll.tsx    # Virtualized scrolling
├── ripples/
│   ├── RippleOrigin.tsx      # Initial post with ripple CTA
│   ├── RippleThread.tsx      # Animated chain visualization
│   ├── RippleContinuation.tsx # Add to ripple form
│   ├── RippleMetrics.tsx     # Impact statistics
│   └── RippleDetail.tsx      # Full chain view
├── heat-map/
│   ├── HeatMapView.tsx       # Mapbox with zones
│   ├── ZoneOverlay.tsx       # Color-coded polygons
│   ├── ZonePopup.tsx         # Zone details popup
│   ├── ZonePulse.tsx         # Animated pulse effect
│   └── QuickActionBar.tsx    # Respond to zone
├── missions/
│   ├── MissionAlert.tsx      # Top banner for active mission
│   ├── MissionCard.tsx       # Large format card
│   ├── MissionProgress.tsx   # Progress bar + countdown
│   ├── LiveContributions.tsx # Scrolling contributor feed
│   ├── ContributeModal.tsx   # Quick contribution flow
│   ├── MissionSuccess.tsx    # Celebration animation
│   └── MissionHistory.tsx    # Past missions list
├── gamification/
│   ├── AchievementUnlock.tsx # Modal animation
│   ├── BadgeDisplay.tsx      # Badge showcase
│   ├── ImpactDashboard.tsx   # Personal stats
│   ├── Leaderboard.tsx       # Opt-in leaderboards
│   └── ProgressBar.tsx       # Toward next achievement
├── composer/
│   ├── PostComposer.tsx      # Create post modal
│   ├── MediaUpload.tsx       # Image/video upload
│   ├── LocationPicker.tsx    # Map location selector
│   └── PostTypeSelector.tsx  # Ripple/Share/Gratitude
└── shared/
    ├── ReactionPicker.tsx    # Reaction buttons
    ├── UserAvatar.tsx        # Profile picture
    └── ImpactBadge.tsx       # "Fed 47 people" pill
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Core feed + basic ripple system

#### Week 1: Database & API
- [ ] Set up new schema tables (posts, ripples, ripple_chains)
- [ ] Create `/api/feed` endpoint with basic algorithm
- [ ] Create `/api/posts` CRUD operations
- [ ] Create `/api/posts/[id]/ripples` endpoint
- [ ] Set up authentication middleware

#### Week 2: Basic Feed UI
- [ ] `<Feed>` component with infinite scroll
- [ ] `<PostCard>` universal component
- [ ] `<PostComposer>` with image upload
- [ ] `<FeedFilters>` (All/Ripples/Mine)
- [ ] Basic routing: `/feed`, `/post/[id]`

#### Week 3: Ripple System v1
- [ ] `<RippleOrigin>` component
- [ ] `<RippleThread>` basic visualization
- [ ] `<RippleContinuation>` form
- [ ] Ripple chain calculation logic
- [ ] "Add to ripple" CTA and flow

#### Week 4: Polish & Testing
- [ ] Mobile responsive design
- [ ] Image optimization & compression
- [ ] Error handling & loading states
- [ ] Basic analytics tracking
- [ ] User testing with 10 beta users

**Deliverable**: Users can post stories, create ripples, view feed

---

### Phase 2: Heat Map (Weeks 5-8)
**Goal**: Geographic visualization of need

#### Week 5: Geospatial Setup
- [ ] Add PostGIS extension to database
- [ ] Create `heat_zones` table with polygons
- [ ] Seed initial ZIP code zones
- [ ] Build `/api/heat-map/zones` endpoint
- [ ] Implement zone aggregation logic

#### Week 6: Heat Map UI
- [ ] `<HeatMapView>` with Mapbox GL
- [ ] Color-coded zone overlays
- [ ] `<ZonePopup>` with details
- [ ] Toggle between map and feed view
- [ ] "Help this zone" quick action

#### Week 7: Anonymous Requests
- [ ] `anonymous_requests` table
- [ ] Form to submit anonymous need
- [ ] Zone heat level calculation
- [ ] Real-time zone updates
- [ ] Privacy controls & safeguards

#### Week 8: Zone Matching
- [ ] Match surplus to nearby needs
- [ ] Notification when nearby need matches your share
- [ ] "Cool down zone" gamification
- [ ] Zone leaderboards
- [ ] Testing with geographic distribution

**Deliverable**: Users can see and respond to geographic food needs

---

### Phase 3: Flash Missions (Weeks 9-12)
**Goal**: Real-time collective action

#### Week 9: Mission System Backend
- [ ] `missions` & `mission_contributions` tables
- [ ] `/api/missions` CRUD endpoints
- [ ] Mission creation triggers (AI or admin)
- [ ] WebSocket setup for real-time updates
- [ ] Mission completion logic

#### Week 10: Mission UI
- [ ] `<MissionAlert>` banner component
- [ ] `<MissionCard>` with countdown
- [ ] `<LiveContributions>` scroll feed
- [ ] `<ContributeModal>` quick flow
- [ ] Push notification integration

#### Week 11: Mission Lifecycle
- [ ] `<MissionSuccess>` celebration animation
- [ ] Mission expiration handling
- [ ] `<MissionHistory>` page
- [ ] Mission replay feature
- [ ] Contributor recognition

#### Week 12: Testing & Optimization
- [ ] Load testing with 100 concurrent users
- [ ] WebSocket stability
- [ ] Mobile performance optimization
- [ ] Analytics dashboard
- [ ] Beta launch with 50 users

**Deliverable**: Users can participate in real-time community missions

---

### Phase 4: Gamification & Polish (Weeks 13-16)
**Goal**: Long-term engagement through achievements

#### Week 13: Achievement System
- [ ] `achievements` & `user_stats` tables
- [ ] Achievement detection logic
- [ ] `/api/achievements` endpoints
- [ ] Badge unlocking system
- [ ] Achievement notification flow

#### Week 14: Gamification UI
- [ ] `<AchievementUnlock>` modal animation
- [ ] `<ImpactDashboard>` personal stats
- [ ] `<BadgeDisplay>` profile showcase
- [ ] `<Leaderboard>` opt-in feature
- [ ] Shareable achievement cards

#### Week 15: Social Features
- [ ] User profiles (`/profile/[userId]`)
- [ ] Following system (optional)
- [ ] Direct messages for coordination
- [ ] Report/block functionality
- [ ] Community guidelines page

#### Week 16: Final Polish
- [ ] Accessibility audit (WCAG AA)
- [ ] Performance optimization
- [ ] A/B testing feed algorithm
- [ ] Documentation for users
- [ ] Prepare for public launch

**Deliverable**: Full-featured social platform ready for public launch

---

## 📊 Success Metrics

### Engagement Metrics
- **Daily Active Users (DAU)**: Target 500 in month 1, 2000 in month 3
- **Posts Per User Per Week**: Target 2+
- **Ripple Continuation Rate**: % of ripples that spawn new ripples (target 40%)
- **Mission Participation Rate**: % of active users who join missions (target 60%)
- **Time in App**: Average session duration (target 8+ minutes)

### Impact Metrics
- **People Fed**: Total people helped through platform
- **Meals Shared**: Total meal equivalents coordinated
- **Zones Balanced**: Hot zones cooled to green
- **Missions Completed**: % of missions that reach goal (target 80%)
- **Ripple Depth**: Average depth of ripple chains (target 5+)

### Community Metrics
- **User Retention**: 7-day (target 70%), 30-day (target 50%)
- **NPS Score**: Net Promoter Score (target 70+)
- **User-Generated Content**: Posts per day (target 100+)
- **Cross-Neighborhood Activity**: Users helping outside their area (target 30%)

---

## 🎨 Design Principles

### 1. Dignity-First
- Never shame or spotlight individuals in need
- Anonymous request system
- Celebrate helpers without patronizing receivers
- "Neighbor helping neighbor" language

### 2. Urgency Without Panic
- Time-sensitive prompts without guilt
- Celebrate small wins loudly
- Normalize asking for help
- Make it easy to say "I can help right now"

### 3. Playful Seriousness
- Gamification that respects the serious issue
- Achievements that feel earned, not trivial
- Visual joy (animations, celebrations)
- But never lose sight of the mission

### 4. Hyper-Local First
- Prioritize what's walking distance
- Show neighborhood names, not just zips
- Build micro-communities by area
- Scale up to city, then region

### 5. Mobile-First, Always
- Design for 375px first
- One-handed operation
- Quick actions (<30 seconds)
- Offline-friendly where possible

---

## 🔒 Safety & Moderation

### Content Moderation
- AI pre-screening for inappropriate content
- User reporting system
- Community moderators (volunteer)
- 24-hour response SLA for reports

### Privacy Controls
- Granular visibility settings
- Anonymous mode for requests
- Location fuzzing (never exact address)
- Opt-in for leaderboards/public stats

### Safety Features
- In-person meetup guidelines
- Verification badges for food banks
- Block/report functionality
- Emergency contact information

---

## 💡 AI Integration Opportunities

### Content Suggestions
- "Share a story about your recent visit to [Food Bank Name]"
- Auto-suggest hashtags based on content
- Generate shareable impact graphics

### Smart Matching
- Match food shares with nearby requests
- Suggest ripple continuations
- Identify mission opportunities from patterns

### Personalization
- Customize feed algorithm per user
- Suggest next actions based on history
- Tailor achievement goals to user pace

---

## 🎬 Launch Strategy

### Beta Phase (Month 1)
- 50 invited users in Sacramento area
- Weekly feedback sessions
- Rapid iteration based on feedback
- Seed initial content (ripples, missions)

### Soft Launch (Month 2)
- Open to 500 users (waitlist)
- Partner with 5 local food banks
- Local press release
- Social media campaign

### Public Launch (Month 3)
- Remove waitlist
- City-wide marketing push
- Launch party/event
- Influencer partnerships

### Scale (Month 4-6)
- Expand to 3 more cities
- White-label for other regions
- API for partner integrations
- Community ambassador program

---

## 🤔 Open Questions & Decisions Needed

1. **Should ripples be linear chains or tree-like branches?**
   - Linear: Easier to visualize, simpler UX
   - Tree: More realistic, complex interactions

2. **How to handle mission creation authority?**
   - Admin-only: Quality control, slower
   - AI-triggered: Scalable, needs monitoring
   - Community-submitted: Democratic, moderation needed

3. **Anonymous vs identified contributions?**
   - Fully anonymous: Maximum dignity, less social motivation
   - Opt-in identity: User choice, complex UI
   - Always identified: Maximum social proof, may deter some

4. **Monetization strategy?**
   - Keep free forever: Grant-funded
   - Premium features: "TheFeed Plus" for power users
   - Partner fees: Charge food banks/nonprofits for analytics
   - None: Stay nonprofit, donation-funded

5. **Geographic scaling approach?**
   - City-by-city: Deep local impact
   - National from day 1: Faster growth
   - Regional clusters: Balance both

---

## 📚 References & Inspiration

- **Be My Eyes**: On-demand help, dignity-focused
- **Nextdoor**: Hyper-local focus
- **TikTok**: Content algorithm, short-form engagement
- **Twitch**: Live collective action
- **Strava**: Activity tracking, achievement system
- **Citizen**: Real-time alerts, community response

---

## 🎯 Next Steps (Immediate)

1. **User Research**: Interview 10 target users about concept
2. **Prototype**: Build clickable Figma prototype of 3 core flows
3. **Technical Spike**: Test WebSocket performance with Vercel
4. **Partnership**: Reach out to 3 food banks for pilot
5. **Name Validation**: Ensure "TheFeed" domain available & trademark clear

---

*This is a living document. Update as we learn and iterate.*

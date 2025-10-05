# Task 25: Course Player Immersive Experience - Expansion & Analysis

## Overview
Task 25 aims to create an immersive course player experience that transforms the current basic lesson page into a comprehensive learning environment with sidebar navigation, notes, Q&A discussions, and resources.

## Current Status
- **Task ID:** 25
- **Status:** pending
- **Priority:** high
- **Dependencies:** Task 12 (Enhanced video player) - COMPLETED
- **Complexity Score:** 7/10

## Existing Implementation Review

### Current Lesson Page (`src/app/courses/[id]/lessons/[lessonId]/page.tsx`)
- Basic 2-column layout (main content + sidebar)
- SimpleVideoPlayer integration
- Progress tracking with API calls
- Module/lesson navigation in sidebar
- Previous/next lesson navigation
- Instructor info card
- No notes, Q&A, or resources yet

### Existing Video Player (`src/components/video/video-player.tsx`)
- Comprehensive video controls with keyboard shortcuts
- Adaptive quality selection
- Picture-in-picture support
- Progress tracking and analytics
- Session heartbeat system
- Thumbnail preview on seek
- Mobile-responsive controls
- 920+ lines of production-ready code

## Proposed Subtasks (10 detailed tasks)

### Subtask 25.1: Course Player Layout Component
**Estimated Complexity:** 6/10
**Description:** Create immersive layout wrapper with responsive sidebar and main content area
**Implementation:**
- Create `src/components/course/course-player-layout.tsx`
- Responsive layout: fixed sidebar on desktop, collapsible on mobile
- Header with course title and breadcrumb navigation
- Sidebar toggle button for mobile (hamburger icon)
- Main content area with dynamic width
- Proper z-index layering for overlays
- Use shadcn/ui Sheet component for mobile sidebar

**Technical Details:**
- Tailwind responsive breakpoints: `md:grid-cols-[300px_1fr]`
- Fixed sidebar height with scroll: `h-[calc(100vh-64px)] overflow-y-auto`
- Mobile bottom sheet with 80% viewport height
- Keyboard shortcut: `[` and `]` to toggle sidebar

### Subtask 25.2: Lesson Sidebar with Progress Tree
**Estimated Complexity:** 7/10
**Description:** Build collapsible module/lesson tree with progress indicators and current lesson highlighting
**Implementation:**
- Create `src/components/course/lesson-sidebar.tsx`
- Collapsible module sections using Accordion component
- Lesson items with icons (PlayCircle, FileText, Quiz, CheckCircle)
- Progress percentage per module
- Current lesson highlighting with border/background
- Completion checkmarks (green CheckCircle)
- Duration display per lesson
- Click to navigate to lesson

**Technical Details:**
- Use shadcn Accordion for expandable modules
- Active lesson: `bg-primary/10 border-l-4 border-primary`
- Completed lesson: `text-muted-foreground` with green checkmark
- Module progress: calculate `(completedLessons / totalLessons) * 100`
- Smooth scroll to current lesson on mount

### Subtask 25.3: Notes Panel with Rich Text Editor
**Estimated Complexity:** 8/10
**Description:** Implement note-taking functionality with timestamp links and localStorage sync
**Implementation:**
- Create `src/components/course/lesson-notes.tsx`
- Rich text editor using existing RichTextEditor component
- "Add note at current timestamp" button (video timestamp link)
- Note list with timestamp chips
- Click timestamp to seek video to that position
- Save to localStorage: `notes-${courseId}-${lessonId}`
- Sync to database with debounced API calls
- Search/filter notes within lesson

**Technical Details:**
- Note structure: `{ id, content, timestamp, createdAt, lessonId }`
- LocalStorage key pattern: `course-notes-{userId}-{courseId}`
- API endpoint: `/api/courses/[courseId]/lessons/[lessonId]/notes`
- Debounce save: 2 seconds using `useDebouncedCallback`
- Timestamp format: `MM:SS` clickable chips
- Markdown support via RichTextEditor

### Subtask 25.4: Q&A Discussion Panel
**Estimated Complexity:** 9/10
**Description:** Build threaded comment system with replies, upvotes, and instructor badges
**Implementation:**
- Create `src/components/course/lesson-discussions.tsx`
- Comment form with RichTextEditor
- Threaded comment display (parent → replies)
- Upvote/downvote buttons with count
- Instructor badge on instructor comments
- Reply functionality with nested threading
- Sort options: Most Recent, Most Upvoted, Unanswered
- Load more pagination (10 comments per page)

**Technical Details:**
- Database schema: Comment model with `parentId` for threading
- API endpoints:
  - `POST /api/courses/[courseId]/lessons/[lessonId]/discussions`
  - `GET /api/courses/[courseId]/lessons/[lessonId]/discussions`
  - `POST /api/courses/[courseId]/lessons/[lessonId]/discussions/[commentId]/vote`
- Instructor detection: compare `comment.userId` with `course.instructorId`
- Upvote state management: track user votes in separate table
- Real-time updates (optional): consider adding polling or WebSocket

### Subtask 25.5: Resources and Downloads Section
**Estimated Complexity:** 5/10
**Description:** Display lesson resources with download buttons and file previews
**Implementation:**
- Create `src/components/course/lesson-resources.tsx`
- Resource list with file icon, name, size, and download button
- Resource categories: Code Samples, Assets, Documentation
- File type icons (PDF, ZIP, PNG, etc.)
- Download button with progress indicator
- Preview for text/image files (modal)
- Resource count badge

**Technical Details:**
- Database: add `LessonResource` model with fields:
  - `id, lessonId, title, description, fileUrl, fileSize, fileType, category, order`
- API endpoint: `GET /api/courses/[courseId]/lessons/[lessonId]/resources`
- Download tracking: `POST /api/courses/[courseId]/resources/[resourceId]/download`
- File icons: use lucide-react icons (FileText, FileArchive, FileImage)
- File size formatting: `formatBytes()` utility

### Subtask 25.6: Autoplay with Countdown Timer
**Estimated Complexity:** 6/10
**Description:** Implement next lesson autoplay with countdown and skip option
**Implementation:**
- Create `src/components/course/autoplay-countdown.tsx`
- Show modal/toast 5 seconds before video ends
- Countdown timer: "Next lesson in 5... 4... 3..."
- Skip/Cancel buttons
- Auto-navigate to next lesson on countdown end
- Save autoplay preference in localStorage
- Settings toggle in player header

**Technical Details:**
- Trigger on `onTimeUpdate` when `currentTime >= duration - 5`
- Toast notification using shadcn Sonner
- Countdown using `useEffect` with 1-second interval
- LocalStorage key: `autoplay-enabled-${userId}`
- Navigate using Next.js router: `router.push()`
- Clear countdown interval on unmount

### Subtask 25.7: Keyboard Shortcuts Modal
**Estimated Complexity:** 4/10
**Description:** Create comprehensive keyboard shortcuts guide modal
**Implementation:**
- Create `src/components/course/keyboard-shortcuts-modal.tsx`
- Modal triggered by `?` key
- Categorized shortcuts:
  - Video Controls (Space, K, J, L, arrows)
  - Navigation (N/P for next/prev lesson)
  - Player Features (F, M, C, PiP)
  - UI ([/] for sidebar, ? for help)
- Printable reference option
- Search/filter shortcuts

**Technical Details:**
- Use shadcn Dialog component
- Keyboard event listener at layout level
- Shortcut categories as sections
- Visual key display: `<kbd>` elements styled
- Print CSS: `@media print` rules
- Close on Escape key

### Subtask 25.8: Progress Tracking Integration
**Estimated Complexity:** 7/10
**Description:** Automatic lesson completion tracking with API sync and UI updates
**Implementation:**
- Extend existing progress tracking in lesson page
- Auto-mark complete on video end (90%+ watched)
- Manual "Mark as Complete" button
- Course progress percentage in header
- Completion celebration animation
- Certificate availability notification on course completion
- Progress sync across devices

**Technical Details:**
- API endpoint: `POST /api/progress` (already exists)
- Progress calculation: aggregate lesson completion in course
- Completion trigger: video `onEnded` callback
- Manual completion: button with confirmation
- Celebration: confetti animation using `canvas-confetti`
- Certificate check: if `courseProgress >= 100%`, show certificate link
- Sync on mount: fetch latest progress from API

### Subtask 25.9: Tab System for Notes/Q&A/Resources
**Estimated Complexity:** 5/10
**Description:** Tabbed interface for notes, discussions, and resources with keyboard navigation
**Implementation:**
- Create `src/components/course/lesson-tabs.tsx`
- Tabs: Overview, Notes, Discussions, Resources
- Keyboard navigation: Alt+1/2/3/4 for tab switching
- Active tab persistence in URL query param
- Tab badges with counts (3 notes, 12 discussions, 5 resources)
- Smooth tab transitions

**Technical Details:**
- Use shadcn Tabs component
- URL pattern: `?tab=notes` for deep linking
- useSearchParams hook for URL state
- Keyboard shortcuts: Alt+number for tabs
- Badge counts from API data
- Lazy load tab content with Suspense

### Subtask 25.10: Responsive Mobile Layout
**Estimated Complexity:** 8/10
**Description:** Optimize entire player experience for mobile with bottom sheet and touch controls
**Implementation:**
- Mobile sidebar as bottom sheet (80vh)
- Swipe gestures for lesson navigation
- Touch-friendly tab bar
- Fullscreen video on mobile (hide UI chrome)
- Compact notes/discussion UI
- Mobile keyboard (virtual) friendly
- Landscape mode optimization

**Technical Details:**
- Bottom sheet using shadcn Sheet with `side="bottom"`
- Swipe detection: `react-swipeable` or native touch events
- Mobile breakpoint: `md:hidden` for mobile-specific UI
- Fullscreen: use Fullscreen API on video tap
- Tab bar: fixed bottom bar with icons
- Text input: auto-scroll to input when focused
- Landscape: `orientation: landscape` CSS media query

## Complexity Analysis

**Overall Task Complexity:** 7/10 (High)

**Breakdown:**
- **UI/UX Complexity:** 8/10 - Multiple interacting components with state management
- **Data Management:** 7/10 - localStorage sync, API integration, real-time updates
- **Technical Complexity:** 7/10 - Video integration, keyboard shortcuts, mobile optimization
- **Testing Complexity:** 6/10 - Cross-browser, mobile testing, user experience validation

**Why High Complexity:**
1. Multiple interdependent components (sidebar, tabs, notes, discussions)
2. Real-time state synchronization (video progress, notes, discussions)
3. Complex keyboard shortcut system
4. Mobile responsive design with different interaction patterns
5. Integration with existing video player and progress tracking
6. Database schema changes for discussions and resources
7. Performance optimization for smooth UX

**Recommended Expansion:** 8-10 subtasks
**Actual Subtasks:** 10 (aligned with recommendation)

## Key UX Features to Implement

1. **Seamless Video Integration:** VideoPlayer component already handles playback, we wrap it in immersive context
2. **Persistent State:** Notes and tab state persist across page refreshes
3. **Keyboard-First Navigation:** Power users can navigate entire course without mouse
4. **Mobile-Optimized:** Touch-friendly controls, bottom sheet, swipe gestures
5. **Progress Visualization:** Clear indication of course completion status
6. **Social Learning:** Q&A discussions foster community engagement
7. **Resource Accessibility:** Easy access to downloadable course materials
8. **Autoplay Flow:** Smooth transition between lessons for continuous learning

## Dependencies & Prerequisites

**Completed:**
- ✅ Task 12: Enhanced video player with advanced controls
- ✅ VideoPlayer component with full feature set
- ✅ Progress tracking API endpoints
- ✅ RichTextEditor component for content editing

**Required:**
- Database schema updates for:
  - `LessonNote` model (notes)
  - `LessonDiscussion` model (Q&A)
  - `LessonResource` model (resources)
  - `DiscussionVote` model (upvotes/downvotes)

**API Endpoints to Create:**
- `/api/courses/[courseId]/lessons/[lessonId]/notes` (GET, POST, PUT, DELETE)
- `/api/courses/[courseId]/lessons/[lessonId]/discussions` (GET, POST)
- `/api/courses/[courseId]/lessons/[lessonId]/discussions/[commentId]/vote` (POST)
- `/api/courses/[courseId]/lessons/[lessonId]/resources` (GET)
- `/api/courses/[courseId]/resources/[resourceId]/download` (POST)

## Implementation Priority

**Phase 1 (Core Layout - Start Here):**
1. Subtask 25.1: Course Player Layout Component
2. Subtask 25.2: Lesson Sidebar with Progress Tree
3. Subtask 25.9: Tab System for Notes/Q&A/Resources

**Phase 2 (Content Features):**
4. Subtask 25.3: Notes Panel with Rich Text Editor
5. Subtask 25.5: Resources and Downloads Section
6. Subtask 25.8: Progress Tracking Integration

**Phase 3 (Advanced Features):**
7. Subtask 25.4: Q&A Discussion Panel
8. Subtask 25.6: Autoplay with Countdown Timer
9. Subtask 25.7: Keyboard Shortcuts Modal

**Phase 4 (Mobile Optimization):**
10. Subtask 25.10: Responsive Mobile Layout

## Testing Strategy

1. **User Experience Testing:**
   - Video playback interruption testing
   - Note-taking during video playback
   - Discussion posting and interaction
   - Resource download functionality

2. **Progress Tracking Tests:**
   - Lesson completion accuracy
   - Course progress calculation
   - Cross-device sync verification

3. **Accessibility Testing:**
   - Keyboard navigation completeness
   - Screen reader compatibility
   - Focus management in modals/sheets

4. **Mobile Testing:**
   - Touch gesture responsiveness
   - Bottom sheet behavior
   - Virtual keyboard handling
   - Portrait/landscape orientation

5. **Cross-Browser Testing:**
   - Chrome, Firefox, Safari, Edge
   - Mobile browsers (iOS Safari, Chrome Mobile)
   - Video player compatibility

## Next Steps

**IMMEDIATE ACTION:** Begin implementation of Subtask 25.1 (Course Player Layout Component)

This will establish the foundation for all other features and provide the container structure for the immersive experience.

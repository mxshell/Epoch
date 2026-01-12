# AGENT.md

## Overview

Epoch is a React timeline editor. Users create tracks (rows) and events (time-bound rectangles). Events can be dragged, resized, and moved between tracks.

## Tech Stack

-   React 19 + TypeScript
-   Vite (dev server, build)
-   Tailwind CSS (utility classes, no CSS files)
-   Lucide React (icons)
-   No state management library (useState + useRef)
-   LocalStorage for persistence

## File Structure

```
App.tsx                 # Main component, all state, all handlers
types.ts                # TypeScript interfaces (ITrack, IEvent, IDragState, etc.)
constants.ts            # Default data, zoom levels, color palette
components/
  AppHeader.tsx         # Top bar with zoom controls
  TrackSidebar.tsx      # Left sidebar, track list, drag-to-reorder
  TimelineCanvas.tsx    # Main canvas, renders events, handles interactions
  Modal.tsx             # Base modal wrapper
  TrackModal.tsx        # Edit/create track
  EventModal.tsx        # Edit/create event
  DataModal.tsx         # Import/export JSON, timeline bounds settings
  Button.tsx            # Reusable button component
  color/ColorPicker.tsx # Color selection grid
utils/
  dateUtils.ts          # Date parsing, formatting, arithmetic (parseDate, formatDate, addDays, getDaysDiff, etc.)
  eventLanes.ts         # Calculate lane assignments for overlapping events
```

## Data Model

```typescript
interface ITrack {
    id: string;
    title: string;
    color: string;
    order: number; // Controls vertical position
}

interface IEvent {
    id: string;
    trackId: string;
    title: string;
    description?: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
    color?: string;
}
```

## State Location

ALL state lives in `App.tsx`:

-   `data: { tracks: ITrack[], events: IEvent[] }` — main data
-   `zoomIndex` — current zoom level index
-   `dragState` — event drag/resize state
-   `isPanning` — canvas pan state
-   `viewBounds` — min/max year for timeline range
-   `editingTrack`, `editingEvent` — modal editing targets
-   `activeModal` — which modal is open (enum ModalType)

## Key Patterns

### Event Positioning

Events are positioned via pixel calculation:

```typescript
left = getDaysDiff(timelineRange.min, eventStart) * pixelsPerDay;
width = durationDays * pixelsPerDay;
```

### Drag/Resize

-   `handleDragStart()` — captures initial state
-   Global `mousemove`/`mouseup` listeners update position
-   On mouseup, calculate delta days and update event dates

### Lane Stacking

`utils/eventLanes.ts` assigns lane indices to overlapping events. Track height expands based on max lane count.

### Zoom

`ZOOM_LEVELS` array in constants.ts. Values are pixels-per-day. Zoom preserves center point using `targetZoomCenterRef`.

### Persistence

Data saved to `localStorage` keys: `chrono_data`, `chrono_bounds`

## Common Tasks

### Add new event field

1. Update `IEvent` in `types.ts`
2. Update `EventModal.tsx` form
3. Handle in `handleSaveEvent()` in `App.tsx`

### Add new track field

1. Update `ITrack` in `types.ts`
2. Update `TrackModal.tsx` form
3. Handle in `handleSaveTrack()` in `App.tsx`

### Modify zoom behavior

Edit `ZOOM_LEVELS` or `DEFAULT_ZOOM_INDEX` in `constants.ts`

### Change default colors

Edit `COLOR_PALETTE` in `constants.ts`

### Add new modal

1. Add enum value to `ModalType` in `types.ts`
2. Create modal component extending `Modal.tsx` pattern
3. Add state and handlers in `App.tsx`
4. Add conditional render in `App.tsx` return

## Commands

```bash
pnpm install   # Install deps
pnpm dev       # Dev server (localhost:5173)
pnpm build     # Production build to dist/
pnpm preview   # Preview production build
```

## Conventions

-   Functional components only
-   Tailwind for all styling (no CSS files)
-   Date strings always "YYYY-MM-DD" format
-   IDs generated via `crypto.randomUUID()`
-   No external state management
-   Components receive data + callbacks as props
-   All business logic in App.tsx handlers

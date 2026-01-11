# Epoch

**See your life unfold.** A beautiful, intuitive timeline editor that helps you visualize your journey—past milestones, present projects, and future dreams—all in one panoramic view.

## Features

-   **Multi-Track Timeline** - Organize events into separate tracks (Work, Personal, Learning, etc.)
-   **Drag & Drop** - Move events by dragging, resize by dragging edges
-   **Smart Lane Stacking** - Overlapping events automatically stack in lanes
-   **Dynamic Track Heights** - Tracks expand to fit overlapping events
-   **Zoom Controls** - From year overview to day-level detail
-   **Color Coding** - Customizable colors for tracks and individual events
-   **Import/Export** - Save and load timelines as JSON files
-   **Responsive Design** - Works on desktop and tablet

## Quick Start

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm run dev
```

## Usage

| Action           | How                                         |
| ---------------- | ------------------------------------------- |
| **Add Event**    | Double-click on empty canvas                |
| **Edit Event**   | Double-click on an event                    |
| **Move Event**   | Drag the event                              |
| **Resize Event** | Drag the left or right edge                 |
| **Add Track**    | Click the + button in the sidebar           |
| **Edit Track**   | Hover over track name, click "Edit"         |
| **Zoom**         | Use zoom controls in header or scroll wheel |
| **Pan**          | Click and drag on empty canvas              |

## 🏗️ Tech Stack

-   **React 19** - UI framework
-   **TypeScript** - Type safety
-   **Vite** - Build tool and dev server
-   **Tailwind CSS** - Styling
-   **Lucide React** - Icons

## 📁 Project Structure

```
├── App.tsx              # Main application component
├── components/
│   ├── AppHeader.tsx    # Header with zoom controls
│   ├── TimelineCanvas.tsx # Main timeline rendering
│   ├── TrackSidebar.tsx # Track list sidebar
│   ├── EventModal.tsx   # Event editor modal
│   ├── TrackModal.tsx   # Track editor modal
│   └── DataModal.tsx    # Import/export settings
├── utils/
│   ├── dateUtils.ts     # Date manipulation helpers
│   └── eventLanes.ts    # Lane calculation for overlapping events
├── types.ts             # TypeScript interfaces
└── constants.ts         # Default data and configuration
```

## 🎨 Customization

### Colors

Edit the `COLOR_PALETTE` in `constants.ts` to customize available colors:

```typescript
export const COLOR_PALETTE = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#10b981", // Emerald
    "#3b82f6", // Blue
    // ... add more
];
```

### Zoom Levels

Adjust zoom levels in `constants.ts`:

```typescript
export const ZOOM_LEVELS = [0.5, 1, 2.5, 5, 10, 25, 50, 100, 200];
// Values represent pixels per day
```

## Data Format

Epoch uses a simple JSON format for import/export:

```json
{
    "tracks": [{ "id": "1", "title": "Work", "color": "#3b82f6", "order": 0 }],
    "events": [
        {
            "id": "e1",
            "trackId": "1",
            "title": "Project Launch",
            "startDate": "2024-01-15",
            "endDate": "2024-02-28",
            "color": "#3b82f6"
        }
    ]
}
```

## Deployment

### GitHub Pages (Automatic)

This project includes a GitHub Actions workflow for automatic deployment:

1. Push your code to the `main` branch
2. Go to **Settings → Pages** in your GitHub repository
3. Set **Source** to "GitHub Actions"
4. The site will deploy automatically on every push

### Manual Build

```bash
# Build for production
npm run build
# or
pnpm build

# Preview the build locally
npm run preview
```

The built files will be in the `dist/` folder, ready to deploy to any static hosting service.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

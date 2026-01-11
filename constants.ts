import { ITrack, IEvent } from './types';

// Helper to get date string relative to today (local timezone)
const getDateStr = (daysFromCenterDate: number): string => {
  const date = new Date(); 
  // set center date to 2026-04-20
  date.setMonth(3);
  date.setDate(20);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromCenterDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentYear = () => {
  const date = new Date();
  return date.getFullYear();
};

export const DEFAULT_MIN_YEAR = getCurrentYear();
export const DEFAULT_MAX_YEAR = getCurrentYear() + 1;

export const DEFAULT_TRACKS: ITrack[] = [
  { id: 'work', title: 'Work', color: '#3b82f6', order: 0 },
  { id: 'personal', title: 'Personal', color: '#10b981', order: 1 },
  { id: 'learning', title: 'Learning', color: '#8b5cf6', order: 2 },
];

export const DEFAULT_EVENTS: IEvent[] = [
  // Work Track - Projects with some overlap to show lanes
  {
    id: 'w1',
    trackId: 'work',
    title: 'Website Redesign',
    startDate: getDateStr(-60),
    endDate: getDateStr(-25),
    color: '#3b82f6',
  },
  {
    id: 'w2',
    trackId: 'work',
    title: 'Mobile App Launch',
    startDate: getDateStr(-35),
    endDate: getDateStr(-10),
    color: '#06b6d4',
  },
  {
    id: 'w3',
    trackId: 'work',
    title: 'Q1 Planning',
    startDate: getDateStr(-5),
    endDate: getDateStr(14),
    color: '#6366f1',
  },

  // Personal Track - Life events
  {
    id: 'p1',
    trackId: 'personal',
    title: 'Vacation',
    startDate: getDateStr(-45),
    endDate: getDateStr(-38),
    color: '#14b8a6',
  },
  {
    id: 'p2',
    trackId: 'personal',
    title: 'Home Renovation',
    startDate: getDateStr(-30),
    endDate: getDateStr(-5),
    color: '#10b981',
  },
  {
    id: 'p3',
    trackId: 'personal',
    title: 'Birthday Party',
    startDate: getDateStr(7),
    endDate: getDateStr(7),
    color: '#f43f5e',
  },

  // Learning Track - Courses and growth
  {
    id: 'l1',
    trackId: 'learning',
    title: 'React Course',
    startDate: getDateStr(-50),
    endDate: getDateStr(-30),
    color: '#8b5cf6',
  },
  {
    id: 'l2',
    trackId: 'learning',
    title: 'TypeScript Workshop',
    startDate: getDateStr(-25),
    endDate: getDateStr(-18),
    color: '#a855f7',
  },
  {
    id: 'l3',
    trackId: 'learning',
    title: 'Design Bootcamp',
    startDate: getDateStr(-10),
    endDate: getDateStr(20),
    color: '#d946ef',
  },
];

export const DRAG_THRESHOLD_PX = 3;

// Pixels per day
// 0.5 = 180px/year (Year view)
// 2 = 60px/month (Month view)
// 10 = Month view detailed
// 50 = Day view
// 200 = Detailed day/hour view
export const ZOOM_LEVELS = [0.1, 0.5, 1, 2.5, 5, 10, 25, 50, 100, 200]; 
export const DEFAULT_ZOOM_INDEX = 4; // 10px/day

export const COLOR_PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#64748b', // Slate
];

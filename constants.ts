import { ITrack, IEvent } from './types';

export const DEFAULT_TRACKS: ITrack[] = [
  { id: '1', title: 'Work', color: '#3b82f6', order: 0 },
  { id: '2', title: 'Personal', color: '#10b981', order: 1 },
];

export const DEFAULT_EVENTS: IEvent[] = [
  {
    id: '1',
    trackId: '1',
    title: 'Started New Job',
    startDate: new Date().toISOString().split('T')[0],
    color: '#3b82f6',
    description: 'Joined the new company as a Senior Engineer.'
  }
];

// Pixels per day
// 0.5 = 180px/year (Year view)
// 2 = 60px/month (Month view)
// 10 = Month view detailed
// 50 = Day view
// 200 = Detailed day/hour view
export const ZOOM_LEVELS = [0.5, 1, 2.5, 5, 10, 25, 50, 100, 200]; 
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
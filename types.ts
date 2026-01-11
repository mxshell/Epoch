export interface ITrack {
  id: string;
  title: string;
  color: string;
  order: number;
}

export interface IEvent {
  id: string;
  trackId: string;
  title: string;
  description?: string;
  startDate: string; // ISO Date string YYYY-MM-DD
  endDate?: string; // ISO Date string YYYY-MM-DD
  color?: string;
}

export interface ITimelineData {
  tracks: ITrack[];
  events: IEvent[];
}

export interface IViewSettings {
  zoom: number; // Pixels per day
  minDate: Date;
  maxDate: Date;
}

export enum ModalType {
  NONE,
  EDIT_TRACK,
  EDIT_EVENT,
  AI_GENERATE,
  IMPORT_EXPORT
}

export type DragMode = 'move' | 'resize-start' | 'resize-end';

export interface IDragState {
  isDragging: boolean;
  eventId: string | null;
  mode: DragMode | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  initialStartDate: string;
  initialEndDate: string;
  initialTrackId: string;
  targetTrackId: string | null;
}
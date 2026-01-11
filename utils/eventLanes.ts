import { IEvent } from "../types";
import { parseDate } from "./dateUtils";

export type EventWithLane = IEvent & { lane: number };

export type TrackLaneInfo = {
    trackId: string;
    maxLanes: number;
    events: EventWithLane[];
};

/**
 * Check if two events overlap in time
 */
function eventsOverlap(a: IEvent, b: IEvent): boolean {
    const aStart = parseDate(a.startDate).getTime();
    const aEnd = parseDate(a.endDate || a.startDate).getTime();
    const bStart = parseDate(b.startDate).getTime();
    const bEnd = parseDate(b.endDate || b.startDate).getTime();

    // Events overlap if one starts before the other ends
    return aStart <= bEnd && bStart <= aEnd;
}

/**
 * Assign lanes to events within a track to prevent visual overlap.
 * Uses a greedy algorithm: assign each event to the first available lane.
 */
function assignLanesToEvents(events: IEvent[]): EventWithLane[] {
    if (events.length === 0) return [];

    // Sort events by start date, then by end date (shorter events first)
    const sortedEvents = [...events].sort((a, b) => {
        const aStart = parseDate(a.startDate).getTime();
        const bStart = parseDate(b.startDate).getTime();
        if (aStart !== bStart) return aStart - bStart;
        
        const aEnd = parseDate(a.endDate || a.startDate).getTime();
        const bEnd = parseDate(b.endDate || b.startDate).getTime();
        return aEnd - bEnd;
    });

    const result: EventWithLane[] = [];
    const lanes: IEvent[][] = []; // Each lane contains events assigned to it

    for (const event of sortedEvents) {
        // Find the first lane where this event doesn't overlap with any existing event
        let assignedLane = -1;
        
        for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
            const laneEvents = lanes[laneIndex];
            const hasOverlap = laneEvents.some(e => eventsOverlap(e, event));
            
            if (!hasOverlap) {
                assignedLane = laneIndex;
                break;
            }
        }

        // If no suitable lane found, create a new one
        if (assignedLane === -1) {
            assignedLane = lanes.length;
            lanes.push([]);
        }

        lanes[assignedLane].push(event);
        result.push({ ...event, lane: assignedLane });
    }

    return result;
}

/**
 * Calculate lane information for all tracks
 */
export function calculateTrackLanes(
    events: IEvent[],
    trackIds: string[]
): Map<string, TrackLaneInfo> {
    const result = new Map<string, TrackLaneInfo>();

    for (const trackId of trackIds) {
        const trackEvents = events.filter(e => e.trackId === trackId);
        const eventsWithLanes = assignLanesToEvents(trackEvents);
        const maxLanes = eventsWithLanes.length > 0 
            ? Math.max(...eventsWithLanes.map(e => e.lane)) + 1 
            : 1;

        result.set(trackId, {
            trackId,
            maxLanes,
            events: eventsWithLanes,
        });
    }

    return result;
}

/**
 * Get the height for a track based on number of lanes
 * Base height per lane + padding
 */
export const EVENT_HEIGHT = 72; // Height of each event in pixels
export const LANE_GAP = 8; // Gap between lanes
export const TRACK_PADDING = 16; // Top and bottom padding

export function getTrackHeight(maxLanes: number): number {
    return Math.max(
        100, // Minimum track height
        maxLanes * EVENT_HEIGHT + (maxLanes - 1) * LANE_GAP + TRACK_PADDING * 2
    );
}

/**
 * Get the top position for an event based on its lane
 */
export function getEventTopPosition(lane: number): number {
    return TRACK_PADDING + lane * (EVENT_HEIGHT + LANE_GAP);
}


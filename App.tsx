import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ITrack,
    IEvent,
    ITimelineData,
    ModalType,
    IDragState,
    DragMode,
    IViewBounds,
} from "./types";
import {
    DEFAULT_EVENTS,
    DEFAULT_TRACKS,
    ZOOM_LEVELS,
    DEFAULT_ZOOM_INDEX,
    COLOR_PALETTE,
    DEFAULT_MIN_YEAR,
    DEFAULT_MAX_YEAR,
    DRAG_THRESHOLD_PX,
} from "./constants";
import {
    parseDate,
    formatDate,
    normalizeDateString,
    addDays,
    getDaysDiff,
    getMonthYear,
    startOfYear,
    startOfMonth,
    startOfDay,
    addMonths,
    addYears,
    addHours,
} from "./utils/dateUtils";
import { AppHeader } from "./components/AppHeader";
import { TrackSidebar } from "./components/TrackSidebar";
import { TimelineCanvas } from "./components/TimelineCanvas";
import { TrackModal } from "./components/TrackModal";
import { EventModal } from "./components/EventModal";
import { DataModal } from "./components/DataModal";
import { calculateTrackLanes } from "./utils/eventLanes";

// -- Main App Component --

const normalizeEventDates = (event: IEvent): IEvent => {
    const startDate = normalizeDateString(event.startDate) || event.startDate;
    const endDate =
        normalizeDateString(event.endDate || event.startDate) ||
        event.endDate ||
        event.startDate;
    return {
        ...event,
        startDate,
        endDate,
    };
};

const normalizeEventList = (events: IEvent[]) =>
    events.map((event) => normalizeEventDates(event));

export default function App() {
    // -- State --
    const [data, setData] = useState<ITimelineData>(() => {
        const saved = localStorage.getItem("chrono_data");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed?.tracks && parsed?.events) {
                    return {
                        tracks: parsed.tracks,
                        events: normalizeEventList(parsed.events),
                    };
                }
            } catch {
                // fall through to defaults
            }
        }
        return {
            tracks: DEFAULT_TRACKS,
            events: normalizeEventList(DEFAULT_EVENTS),
        };
    });

    const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX);
    const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);

    // Drag State (for Events)
    const [dragState, setDragState] = useState<IDragState>({
        isDragging: false,
        eventId: null,
        mode: null,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        initialStartDate: "",
        initialEndDate: "",
        initialTrackId: "",
        targetTrackId: null,
    });

    // Panning State (for Canvas)
    const [isPanning, setIsPanning] = useState(false); // For cursor UI only
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Refs for panning logic
    const panStateRef = useRef({
        isActive: false, // Mouse is down on canvas
        isPanning: false, // Threshold exceeded, actively scrolling
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
    });
    const wasPanningRef = useRef(false); // Flag to block click event after pan
    const targetZoomCenterRef = useRef<number | null>(null); // Timestamp to keep centered during zoom

    const [suppressClick, setSuppressClick] = useState(false);

    const dataRef = useRef(data);
    const zoomIndexRef = useRef(zoomIndex);
    const dragStateRef = useRef(dragState);

    // Edit State
    const [editingTrack, setEditingTrack] = useState<ITrack | null>(null);
    const [editingEvent, setEditingEvent] = useState<IEvent | null>(null);

    // AI State
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // View Calculation / Settings
    const pixelsPerDay = ZOOM_LEVELS[zoomIndex];
    const clampYear = (year: number) => Math.min(2100, Math.max(1900, year));

    const [viewBounds, setViewBounds] = useState<IViewBounds>(() => {
        const saved = localStorage.getItem("chrono_bounds");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (
                    typeof parsed.minYear === "number" &&
                    typeof parsed.maxYear === "number"
                ) {
                    return {
                        minYear: clampYear(parsed.minYear),
                        maxYear: clampYear(parsed.maxYear),
                    };
                }
            } catch {
                // fall through to defaults
            }
        }
        return { minYear: DEFAULT_MIN_YEAR, maxYear: DEFAULT_MAX_YEAR };
    });
    const [boundsDraft, setBoundsDraft] = useState<IViewBounds>(() => ({
        minYear: DEFAULT_MIN_YEAR,
        maxYear: DEFAULT_MAX_YEAR,
    }));

    const timelineRange = useMemo(() => {
        const minYearDate = new Date(viewBounds.minYear, 0, 1);
        const maxYearDate = new Date(viewBounds.maxYear, 11, 31);
        // Always honor user-defined bounds as the visible canvas limits
        if (minYearDate >= maxYearDate) {
            const safeMax = addYears(minYearDate, 1);
            return { min: minYearDate, max: safeMax };
        }
        return { min: minYearDate, max: maxYearDate };
    }, [viewBounds]);

    const totalDays = getDaysDiff(timelineRange.min, timelineRange.max);
    const totalWidth = totalDays * pixelsPerDay;

    // -- Effects --
    useEffect(() => {
        localStorage.setItem("chrono_data", JSON.stringify(data));
        dataRef.current = data;
    }, [data]);

    useEffect(() => {
        localStorage.setItem("chrono_bounds", JSON.stringify(viewBounds));
    }, [viewBounds]);

    useEffect(() => {
        zoomIndexRef.current = zoomIndex;
    }, [zoomIndex]);

    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);

    // Restore scroll position logic for centered zooming
    useLayoutEffect(() => {
        if (
            targetZoomCenterRef.current !== null &&
            scrollContainerRef.current
        ) {
            const container = scrollContainerRef.current;
            const targetTime = targetZoomCenterRef.current;

            // Calculate where this time should be in pixels relative to the NEW minDate
            const timeDiff = targetTime - timelineRange.min.getTime();
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            const targetPixel = daysDiff * pixelsPerDay;

            // Center it
            const newScrollLeft = targetPixel - container.clientWidth / 2;

            container.scrollLeft = newScrollLeft;
            targetZoomCenterRef.current = null;
        }
    }, [zoomIndex, timelineRange, pixelsPerDay]);

    // Scroll to center on today's date on initial load
    const hasScrolledToTodayRef = useRef(false);
    useLayoutEffect(() => {
        if (!hasScrolledToTodayRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize to midnight

            // Calculate days from timeline start to today
            const daysFromStart = getDaysDiff(timelineRange.min, today);
            const todayPixel = daysFromStart * pixelsPerDay;

            // Center the view on today
            const newScrollLeft = todayPixel - container.clientWidth / 2;
            container.scrollLeft = Math.max(0, newScrollLeft);

            hasScrolledToTodayRef.current = true;
        }
    }, [timelineRange, pixelsPerDay]);

    // -- Panning Logic --
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            // Panning Logic
            if (panStateRef.current.isActive) {
                // Stop panning if we somehow started dragging an event (race condition safeguard)
                if (dragStateRef.current.isDragging) return;

                const dx = e.clientX - panStateRef.current.startX;
                const dy = e.clientY - panStateRef.current.startY;

                // Check threshold to treat as pan
                if (
                    !panStateRef.current.isPanning &&
                    (Math.abs(dx) > 5 || Math.abs(dy) > 5)
                ) {
                    panStateRef.current.isPanning = true;
                    wasPanningRef.current = true;
                    setIsPanning(true);
                }

                if (
                    panStateRef.current.isPanning &&
                    scrollContainerRef.current
                ) {
                    e.preventDefault(); // Prevent text selection/native drag
                    scrollContainerRef.current.scrollLeft =
                        panStateRef.current.scrollLeft - dx;
                    scrollContainerRef.current.scrollTop =
                        panStateRef.current.scrollTop - dy;
                }
            }

            // Event Dragging Logic (Existing)
            if (dragStateRef.current.isDragging) {
                e.preventDefault(); // Prevent text selection during drag
                const state = dragStateRef.current;
                let targetId = state.targetTrackId;
                if (state.mode === "move") {
                    const el = document.elementFromPoint(e.clientX, e.clientY);
                    const trackRow = el?.closest("[data-track-id]");
                    if (trackRow) {
                        targetId = trackRow.getAttribute("data-track-id");
                    }
                }

                setDragState((prev) => ({
                    ...prev,
                    currentX: e.clientX,
                    currentY: e.clientY,
                    targetTrackId: targetId,
                }));
            }
        };

        const handleGlobalMouseUp = (e: MouseEvent) => {
            // Panning Cleanup
            if (panStateRef.current.isActive) {
                panStateRef.current.isActive = false;
                if (panStateRef.current.isPanning) {
                    setIsPanning(false);
                }
                panStateRef.current.isPanning = false;
                // Note: we do NOT reset wasPanningRef here; it guards the subsequent 'click' event
            }

            // Event Dragging Cleanup
            const state = dragStateRef.current;
            if (state.isDragging && state.eventId) {
                // Use e.clientX directly to avoid race condition with React state updates
                const deltaX = e.clientX - state.startX;
                const deltaY = e.clientY - state.startY;
                const movedEnough =
                    Math.abs(deltaX) > DRAG_THRESHOLD_PX ||
                    (state.mode === "move" &&
                        Math.abs(deltaY) > DRAG_THRESHOLD_PX);

                // Detect target track from actual mouse position at release
                let finalTargetTrackId = state.initialTrackId;
                if (state.mode === "move") {
                    const el = document.elementFromPoint(e.clientX, e.clientY);
                    const trackRow = el?.closest("[data-track-id]");
                    if (trackRow) {
                        finalTargetTrackId =
                            trackRow.getAttribute("data-track-id") ||
                            state.initialTrackId;
                    }
                }

                if (movedEnough) {
                    setSuppressClick(true);
                    setTimeout(() => setSuppressClick(false), 50);

                    const pxPerDay = ZOOM_LEVELS[zoomIndexRef.current];
                    const deltaDays = Math.round(deltaX / pxPerDay);

                    let newStartDate = parseDate(state.initialStartDate);
                    let newEndDate = parseDate(state.initialEndDate);
                    let newTrackId = state.initialTrackId;

                    if (state.mode === "move") {
                        newStartDate = addDays(
                            parseDate(state.initialStartDate),
                            deltaDays
                        );
                        const duration = getDaysDiff(
                            parseDate(state.initialStartDate),
                            parseDate(state.initialEndDate)
                        );
                        newEndDate = addDays(newStartDate, duration);
                        newTrackId = finalTargetTrackId;
                    } else if (state.mode === "resize-start") {
                        newStartDate = addDays(
                            parseDate(state.initialStartDate),
                            deltaDays
                        );
                        if (newStartDate > newEndDate)
                            newStartDate = newEndDate;
                    } else if (state.mode === "resize-end") {
                        newEndDate = addDays(
                            parseDate(state.initialEndDate),
                            deltaDays
                        );
                        if (newEndDate < newStartDate)
                            newEndDate = newStartDate;
                    }

                    setData((prev) => ({
                        ...prev,
                        events: prev.events.map((ev) => {
                            if (ev.id === state.eventId) {
                                return {
                                    ...ev,
                                    startDate: formatDate(newStartDate),
                                    endDate: formatDate(newEndDate),
                                    trackId: newTrackId,
                                };
                            }
                            return ev;
                        }),
                    }));
                }

                setDragState((prev) => ({
                    ...prev,
                    isDragging: false,
                    eventId: null,
                    targetTrackId: null,
                }));
            }
        };

        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("mouseup", handleGlobalMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleGlobalMouseMove);
            window.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, []);

    // -- Handlers --

    const calculateCenterTime = () => {
        if (!scrollContainerRef.current) return null;
        const container = scrollContainerRef.current;
        const centerOffsetPx = container.scrollLeft + container.clientWidth / 2;
        // Use the CURRENT pixelsPerDay and minDate for calculation before state update
        const daysFromMin = centerOffsetPx / pixelsPerDay;
        return timelineRange.min.getTime() + daysFromMin * 24 * 60 * 60 * 1000;
    };

    const handleZoom = (dir: "in" | "out") => {
        const centerTime = calculateCenterTime();
        if (centerTime !== null) {
            targetZoomCenterRef.current = centerTime;
        }
        setZoomIndex((prev) =>
            Math.max(
                0,
                Math.min(ZOOM_LEVELS.length - 1, prev + (dir === "in" ? 1 : -1))
            )
        );
    };

    const handleWheelZoom = (e: React.WheelEvent) => {
        // Only zoom if Ctrl key is pressed (standard browser behavior for pinch-zoom or wheel zoom)
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1; // Down is out, Up is in

            const newIndex = Math.max(
                0,
                Math.min(ZOOM_LEVELS.length - 1, zoomIndex + delta)
            );
            if (newIndex !== zoomIndex) {
                const centerTime = calculateCenterTime();
                if (centerTime !== null) {
                    targetZoomCenterRef.current = centerTime;
                }
                setZoomIndex(newIndex);
            }
        }
    };

    const handleDragStart = (
        e: React.MouseEvent,
        event: IEvent,
        mode: DragMode
    ) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        // Note: Don't call e.preventDefault() here as it blocks double-click events

        setDragState({
            isDragging: true,
            eventId: event.id,
            mode,
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            initialStartDate: event.startDate,
            initialEndDate: event.endDate || event.startDate,
            initialTrackId: event.trackId,
            targetTrackId: event.trackId,
        });
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        // Only handle left click on the canvas (tracks or background)
        if (e.button !== 0) return;
        // Don't start panning if dragging an event (handled by propagation stop, but safety check)
        if (dragState.isDragging) return;

        panStateRef.current = {
            isActive: true,
            isPanning: false,
            startX: e.clientX,
            startY: e.clientY,
            scrollLeft: scrollContainerRef.current?.scrollLeft || 0,
            scrollTop: scrollContainerRef.current?.scrollTop || 0,
        };
        wasPanningRef.current = false;
    };

    const handleCloseModal = () => {
        setActiveModal(ModalType.NONE);
        setEditingTrack(null);
        setEditingEvent(null);
        // Reset drafts to persisted view bounds on close
        setBoundsDraft(viewBounds);
    };

    const handleAddTrack = () => {
        setEditingTrack({
            id: crypto.randomUUID(),
            title: "New Track",
            color: COLOR_PALETTE[0],
            order: data.tracks.length,
        });
        setActiveModal(ModalType.EDIT_TRACK);
    };

    const handleEditTrack = (track: ITrack) => {
        setEditingTrack({ ...track });
        setActiveModal(ModalType.EDIT_TRACK);
    };

    const handleSaveTrack = () => {
        if (!editingTrack) return;
        setData((prev) => {
            const exists = prev.tracks.find((t) => t.id === editingTrack.id);
            if (exists) {
                return {
                    ...prev,
                    tracks: prev.tracks.map((t) =>
                        t.id === editingTrack.id ? editingTrack : t
                    ),
                };
            }
            return { ...prev, tracks: [...prev.tracks, editingTrack] };
        });
        handleCloseModal();
    };

    const handleDeleteTrack = () => {
        if (!editingTrack) return;
        if (
            confirm("Are you sure? This will delete all events in this track.")
        ) {
            setData((prev) => ({
                tracks: prev.tracks.filter((t) => t.id !== editingTrack.id),
                events: prev.events.filter(
                    (e) => e.trackId !== editingTrack.id
                ),
            }));
            handleCloseModal();
        }
    };

    const handleReorderTracks = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;

        setData((prev) => {
            const sortedTracks = [...prev.tracks].sort(
                (a, b) => a.order - b.order
            );
            const [movedTrack] = sortedTracks.splice(fromIndex, 1);
            sortedTracks.splice(toIndex, 0, movedTrack);

            // Update order property for all tracks
            const updatedTracks = sortedTracks.map((track, index) => ({
                ...track,
                order: index,
            }));

            return { ...prev, tracks: updatedTracks };
        });
    };

    const handleAddEvent = (trackId: string, dateStr?: string) => {
        const startDate = dateStr ? parseDate(dateStr) : new Date();
        const endDate = addDays(startDate, 7); // Default 7-day duration
        setEditingEvent({
            id: crypto.randomUUID(),
            trackId,
            title: "New Event",
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            color:
                data.tracks.find((t) => t.id === trackId)?.color ||
                COLOR_PALETTE[6],
        });
        setActiveModal(ModalType.EDIT_EVENT);
    };

    const handleEditEvent = (event: IEvent) => {
        if (suppressClick) return;
        setEditingEvent(normalizeEventDates(event));
        setActiveModal(ModalType.EDIT_EVENT);
    };

    const handleSaveEvent = () => {
        if (!editingEvent) return;
        // Ensure endDate is always set (default to startDate if empty)
        const eventToSave = normalizeEventDates({
            ...editingEvent,
            endDate: editingEvent.endDate || editingEvent.startDate,
        });
        setData((prev) => {
            const exists = prev.events.find((e) => e.id === eventToSave.id);
            if (exists) {
                return {
                    ...prev,
                    events: prev.events.map((e) =>
                        e.id === eventToSave.id ? eventToSave : e
                    ),
                };
            }
            return { ...prev, events: [...prev.events, eventToSave] };
        });
        handleCloseModal();
    };

    const handleDeleteEvent = () => {
        if (!editingEvent) return;
        setData((prev) => ({
            ...prev,
            events: prev.events.filter((e) => e.id !== editingEvent.id),
        }));
        handleCloseModal();
    };

    const handleExport = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `timeline-${formatDate(new Date())}.json`;
        a.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const imported = JSON.parse(evt.target?.result as string);
                    if (imported.tracks && imported.events) {
                        setData({
                            tracks: imported.tracks,
                            events: normalizeEventList(imported.events),
                        });
                    } else {
                        alert("Invalid JSON format");
                    }
                } catch (err) {
                    alert("Failed to parse JSON");
                }
            };
            reader.readAsText(file);
        }
    };

    const handleResetTimeline = () => {
        if (confirm("Are you sure? This cannot be undone.")) {
            setData({ tracks: [], events: [] });
            handleCloseModal();
        }
    };
    const handleBoundsDraftChange = (bounds: {
        minYear: number;
        maxYear: number;
    }) => {
        const minYear = clampYear(Math.floor(bounds.minYear));
        const maxYear = clampYear(Math.floor(bounds.maxYear));
        if (Number.isNaN(minYear) || Number.isNaN(maxYear)) return;
        const safeMin = Math.min(minYear, maxYear - 1);
        const safeMax = Math.max(maxYear, safeMin + 1);
        setBoundsDraft({ minYear: safeMin, maxYear: safeMax });
    };

    const handleSaveBounds = () => {
        setViewBounds({
            minYear: clampYear(boundsDraft.minYear),
            maxYear: clampYear(boundsDraft.maxYear),
        });
    };

    const handleTrackDoubleClick = (e: React.MouseEvent, trackId: string) => {
        if (e.target !== e.currentTarget) return;
        if (suppressClick) return;
        // Panning check is likely not needed for double click as pan is click+drag,
        // but good to keep if user double clicks while finishing a pan (unlikely)
        if (wasPanningRef.current) return;

        const offsetX = e.nativeEvent.offsetX;
        const daysToAdd = Math.floor(offsetX / pixelsPerDay);
        const date = addDays(timelineRange.min, daysToAdd);
        handleAddEvent(trackId, formatDate(date));
    };

    // -- Dynamic Rendering Logic --

    const getScaleConfig = () => {
        // Determine what to show based on zoom level (pixelsPerDay)
        if (pixelsPerDay < 1) {
            // Zoom < 1px/day (Year View)
            return {
                top: {
                    unit: "year",
                    step: 5,
                    format: (d: Date) => d.getFullYear().toString(),
                },
                bottom: {
                    unit: "year",
                    step: 1,
                    format: (d: Date) => d.getFullYear().toString(),
                },
                grid: "year",
            };
        } else if (pixelsPerDay < 5) {
            // Zoom < 5px/day (Month View compacted)
            return {
                top: {
                    unit: "year",
                    step: 1,
                    format: (d: Date) => d.getFullYear().toString(),
                },
                bottom: {
                    unit: "month",
                    step: 3,
                    format: (d: Date) =>
                        d.toLocaleString("default", { month: "short" }),
                },
                grid: "month",
            };
        } else if (pixelsPerDay < 20) {
            // Zoom < 20px/day (Month View standard)
            return {
                top: {
                    unit: "year",
                    step: 1,
                    format: (d: Date) => d.getFullYear().toString(),
                },
                bottom: {
                    unit: "month",
                    step: 1,
                    format: (d: Date) =>
                        d.toLocaleString("default", { month: "short" }),
                },
                grid: "month",
            };
        } else if (pixelsPerDay < 60) {
            // Zoom < 60px/day (Day/Week View)
            return {
                top: {
                    unit: "month",
                    step: 1,
                    format: (d: Date) => getMonthYear(d),
                },
                bottom: {
                    unit: "day",
                    step: 7,
                    format: (d: Date) => d.getDate().toString(),
                },
                grid: "week",
            };
        } else if (pixelsPerDay < 150) {
            // Zoom < 150px/day (Day View)
            return {
                top: {
                    unit: "month",
                    step: 1,
                    format: (d: Date) => getMonthYear(d),
                },
                bottom: {
                    unit: "day",
                    step: 1,
                    format: (d: Date) => d.getDate().toString(),
                },
                grid: "day",
            };
        } else {
            // Zoom >= 150px/day (Hour View)
            return {
                top: {
                    unit: "day",
                    step: 1,
                    format: (d: Date) =>
                        d.toLocaleDateString(undefined, {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                        }),
                },
                bottom: {
                    unit: "hour",
                    step: 6,
                    format: (d: Date) => d.getHours() + ":00",
                },
                grid: "hour",
            };
        }
    };

    const renderTimeScale = () => {
        const config = getScaleConfig();
        const ticks = [];

        const generateTicks = (rowConfig: any, isTop: boolean) => {
            const rowTicks = [];
            let curr = new Date(timelineRange.min);

            // Align start
            if (rowConfig.unit === "year") curr = startOfYear(curr);
            else if (rowConfig.unit === "month") curr = startOfMonth(curr);
            else if (rowConfig.unit === "day") curr = startOfDay(curr);
            else if (rowConfig.unit === "hour") {
                curr = startOfDay(curr);
                curr.setHours(0, 0, 0, 0);
            }

            while (curr < timelineRange.max) {
                if (curr >= timelineRange.min) {
                    const left =
                        getDaysDiff(timelineRange.min, curr) * pixelsPerDay;
                    if (rowConfig.unit === "hour") {
                        const diffMs =
                            curr.getTime() - timelineRange.min.getTime();
                        const diffDays = diffMs / (1000 * 60 * 60 * 24);
                        const exactLeft = diffDays * pixelsPerDay;

                        rowTicks.push(
                            <div
                                key={`tick-${isTop}-${curr.toISOString()}`}
                                className={`absolute pl-2 truncate flex items-center select-none border-l transition-colors
                        ${
                            isTop
                                ? "top-0 h-6 text-xs font-bold text-slate-900 z-10 border-slate-300 bg-white/50"
                                : "top-6 h-6 text-[11px] font-semibold text-slate-600 border-slate-300/70"
                        }
                     `}
                                style={{ left: `${exactLeft}px` }}
                            >
                                {rowConfig.format(curr)}
                            </div>
                        );
                    } else {
                        rowTicks.push(
                            <div
                                key={`tick-${isTop}-${curr.toISOString()}`}
                                className={`absolute pl-2 truncate flex items-center select-none border-l transition-colors
                        ${
                            isTop
                                ? "top-0 h-6 text-xs font-bold text-slate-900 z-10 border-slate-300 bg-white/50"
                                : "top-6 h-6 text-[11px] font-semibold text-slate-600 border-slate-300/70"
                        }
                     `}
                                style={{ left: `${left}px` }}
                            >
                                {rowConfig.format(curr)}
                            </div>
                        );
                    }
                }

                if (rowConfig.unit === "year")
                    curr = addYears(curr, rowConfig.step);
                else if (rowConfig.unit === "month")
                    curr = addMonths(curr, rowConfig.step);
                else if (rowConfig.unit === "day")
                    curr = addDays(curr, rowConfig.step);
                else if (rowConfig.unit === "hour")
                    curr = addHours(curr, rowConfig.step);
            }
            return rowTicks;
        };

        ticks.push(...generateTicks(config.top, true));
        ticks.push(...generateTicks(config.bottom, false));
        return ticks;
    };

    const renderGridLines = () => {
        const config = getScaleConfig();
        const lines = [];

        let curr = new Date(timelineRange.min);
        const unit = config.grid;

        if (unit === "year") curr = startOfYear(curr);
        else if (unit === "month") curr = startOfMonth(curr);
        else if (unit === "week") curr = startOfDay(curr);
        else if (unit === "day") curr = startOfDay(curr);
        else if (unit === "hour") {
            curr = startOfDay(curr);
        }

        while (curr < timelineRange.max) {
            if (curr >= timelineRange.min) {
                let left = 0;
                if (unit === "hour") {
                    const diffMs = curr.getTime() - timelineRange.min.getTime();
                    const diffDays = diffMs / (1000 * 60 * 60 * 24);
                    left = diffDays * pixelsPerDay;
                } else {
                    left = getDaysDiff(timelineRange.min, curr) * pixelsPerDay;
                }

                lines.push(
                    <div
                        key={`grid-${curr.toISOString()}`}
                        className={`absolute top-0 bottom-0 border-l pointer-events-none
                    ${
                        unit === "year" || unit === "month"
                            ? "border-slate-200/50"
                            : "border-slate-100/50 border-dashed"
                    }
                 `}
                        style={{ left: `${left}px` }}
                    />
                );
            }

            if (unit === "year") curr = addYears(curr, 1);
            else if (unit === "month") curr = addMonths(curr, 1);
            else if (unit === "week") curr = addDays(curr, 7);
            else if (unit === "day") curr = addDays(curr, 1);
            else if (unit === "hour") curr = addHours(curr, 6);
        }
        return lines;
    };

    const getEventStyle = (event: IEvent) => {
        const start = parseDate(event.startDate);
        const end = event.endDate ? parseDate(event.endDate) : start;
        const daysFromMin = getDaysDiff(timelineRange.min, start);
        const durationDays =
            Math.max(
                0.5,
                (end.getTime() - start.getTime()) / (1000 * 3600 * 24)
            ) + (event.endDate ? 1 : 1);

        return {
            left: `${daysFromMin * pixelsPerDay}px`,
            width: `${Math.max(
                pixelsPerDay * 0.5,
                durationDays * pixelsPerDay
            )}px`,
            backgroundColor: event.color,
        };
    };

    // -- Ruler/Guide Render Logic --
    const renderDragGuides = () => {
        if (!dragState.isDragging || !dragState.eventId) return null;

        const deltaX = dragState.currentX - dragState.startX;
        const deltaY = dragState.currentY - dragState.startY;
        const movedEnough =
            dragState.mode === "move"
                ? Math.abs(deltaX) > DRAG_THRESHOLD_PX ||
                  Math.abs(deltaY) > DRAG_THRESHOLD_PX
                : Math.abs(deltaX) > DRAG_THRESHOLD_PX;
        if (!movedEnough) return null;
        const deltaDays = Math.round(deltaX / pixelsPerDay);
        const initialStart = parseDate(dragState.initialStartDate);
        const initialEnd = parseDate(dragState.initialEndDate);

        let previewStart = initialStart;
        let previewEnd = initialEnd;

        if (dragState.mode === "move") {
            previewStart = addDays(initialStart, deltaDays);
            const duration = getDaysDiff(initialStart, initialEnd);
            previewEnd = addDays(previewStart, duration);
        } else if (dragState.mode === "resize-start") {
            previewStart = addDays(initialStart, deltaDays);
            if (previewStart > initialEnd) previewStart = initialEnd;
            previewEnd = initialEnd;
        } else if (dragState.mode === "resize-end") {
            previewEnd = addDays(initialEnd, deltaDays);
            if (previewEnd < initialStart) previewEnd = initialStart;
            previewStart = initialStart;
        }

        const startPx =
            getDaysDiff(timelineRange.min, previewStart) * pixelsPerDay;
        const endPx =
            (getDaysDiff(timelineRange.min, previewEnd) + 1) * pixelsPerDay;

        const isStartActive =
            dragState.mode === "move" || dragState.mode === "resize-start";
        const isEndActive =
            dragState.mode === "move" || dragState.mode === "resize-end";

        const GuideLine = ({
            px,
            date,
            active,
            labelAlign,
        }: {
            px: number;
            date: string;
            active: boolean;
            labelAlign: "left" | "right";
        }) => (
            <>
                <div
                    className={`absolute top-0 bottom-0 border-l-[2px] z-[60] transition-colors duration-75
              ${
                  active
                      ? "border-brand-500/80 border-dashed"
                      : "border-slate-300/50 border-dotted"
              }
           `}
                    style={{ left: `${px}px` }}
                />
                <div
                    className={`absolute top-0 z-[70] px-2 py-1 text-[10px] font-bold rounded shadow-sm border transition-all duration-75 whitespace-nowrap
              ${
                  active
                      ? "bg-brand-600 text-white border-brand-700"
                      : "bg-white text-slate-500 border-slate-200"
              }
           `}
                    style={{
                        left: `${px}px`,
                        transform: `translateX(${
                            labelAlign === "right" ? "-100%" : "0"
                        }) translateY(0px)`,
                        marginLeft: labelAlign === "left" ? "4px" : "0",
                        marginRight: labelAlign === "right" ? "4px" : "0",
                    }}
                >
                    {date}
                </div>
            </>
        );

        return (
            <div className="absolute inset-0 pointer-events-none z-[60]">
                <GuideLine
                    px={startPx}
                    date={formatDate(previewStart)}
                    active={isStartActive}
                    labelAlign="left"
                />
                <GuideLine
                    px={endPx}
                    date={formatDate(previewEnd)}
                    active={isEndActive}
                    labelAlign="right"
                />
            </div>
        );
    };

    const timeScale = useMemo(
        () => renderTimeScale(),
        [timelineRange, pixelsPerDay]
    );
    const gridLines = useMemo(
        () => renderGridLines(),
        [timelineRange, pixelsPerDay]
    );
    const dragGuideOverlay = useMemo(
        () => renderDragGuides(),
        [dragState, pixelsPerDay, timelineRange]
    );

    // Calculate lane assignments for overlapping events
    const trackLaneInfo = useMemo(
        () =>
            calculateTrackLanes(
                data.events,
                data.tracks.map((t) => t.id)
            ),
        [data.events, data.tracks]
    );

    // Sort tracks by order for consistent display
    const sortedTracks = useMemo(
        () => [...data.tracks].sort((a, b) => a.order - b.order),
        [data.tracks]
    );

    const isTrackModalOpen = activeModal === ModalType.EDIT_TRACK;
    const isEventModalOpen = activeModal === ModalType.EDIT_EVENT;
    const isDataModalOpen = activeModal === ModalType.IMPORT_EXPORT;

    return (
        <div className="flex flex-col h-screen bg-slate-50 select-none text-slate-800 font-sans">
            <AppHeader
                pixelsPerDay={pixelsPerDay}
                zoomIndex={zoomIndex}
                zoomLevelsLength={ZOOM_LEVELS.length}
                onZoomIn={() => handleZoom("in")}
                onZoomOut={() => handleZoom("out")}
                onOpenData={() => {
                    setBoundsDraft(viewBounds);
                    setActiveModal(ModalType.IMPORT_EXPORT);
                }}
            />

            <div className="flex-1 overflow-hidden relative flex flex-col cursor-default">
                <div className="flex-1 flex overflow-hidden">
                    <TrackSidebar
                        tracks={sortedTracks}
                        trackLaneInfo={trackLaneInfo}
                        onAddTrack={handleAddTrack}
                        onEditTrack={handleEditTrack}
                        onReorderTracks={handleReorderTracks}
                    />

                    <TimelineCanvas
                        tracks={sortedTracks}
                        trackLaneInfo={trackLaneInfo}
                        dragState={dragState}
                        isPanning={isPanning}
                        totalWidth={totalWidth}
                        pixelsPerDay={pixelsPerDay}
                        scrollContainerRef={scrollContainerRef}
                        onCanvasMouseDown={handleCanvasMouseDown}
                        onWheelZoom={handleWheelZoom}
                        onTrackDoubleClick={handleTrackDoubleClick}
                        onDragStart={handleDragStart}
                        onEditEvent={handleEditEvent}
                        timeScale={timeScale}
                        gridLines={gridLines}
                        dragGuides={dragGuideOverlay}
                        getEventStyle={getEventStyle}
                    />
                </div>
            </div>

            <TrackModal
                isOpen={isTrackModalOpen}
                editingTrack={editingTrack}
                onClose={handleCloseModal}
                onChange={(track) => setEditingTrack(track)}
                onSave={handleSaveTrack}
                onDelete={handleDeleteTrack}
                tracks={data.tracks}
            />

            <EventModal
                isOpen={isEventModalOpen}
                editingEvent={editingEvent}
                tracks={data.tracks}
                onClose={handleCloseModal}
                onChange={(event) => setEditingEvent(event)}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
            />

            <DataModal
                isOpen={isDataModalOpen}
                onClose={handleCloseModal}
                onExport={handleExport}
                onImport={handleImport}
                onReset={handleResetTimeline}
                minYear={boundsDraft.minYear}
                maxYear={boundsDraft.maxYear}
                onBoundsChange={handleBoundsDraftChange}
                onSaveBounds={handleSaveBounds}
            />
        </div>
    );
}

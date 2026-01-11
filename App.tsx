import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    useLayoutEffect,
} from "react";
import {
    Plus,
    ZoomIn,
    ZoomOut,
    Download,
    Upload,
    Settings,
    Trash2,
    Edit2,
    Calendar,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Menu,
    GripVertical,
    Search,
} from "lucide-react";
import {
    ITrack,
    IEvent,
    ITimelineData,
    ModalType,
    IDragState,
    DragMode,
} from "./types";
import {
    DEFAULT_EVENTS,
    DEFAULT_TRACKS,
    ZOOM_LEVELS,
    DEFAULT_ZOOM_INDEX,
    COLOR_PALETTE,
} from "./constants";
import {
    parseDate,
    formatDate,
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
import { Modal } from "./components/Modal";
import { Button } from "./components/Button";

// -- Sub-components --

const ColorPicker: React.FC<{
    selected: string;
    onChange: (c: string) => void;
}> = ({ selected, onChange }) => (
    <div className="flex flex-wrap gap-2 mt-2">
        {COLOR_PALETTE.map((c) => (
            <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    selected === c
                        ? "border-slate-600 scale-110 shadow-sm"
                        : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
            />
        ))}
    </div>
);

// -- Main App Component --

export default function App() {
    // -- State --
    const [data, setData] = useState<ITimelineData>(() => {
        const saved = localStorage.getItem("chrono_data");
        return saved
            ? JSON.parse(saved)
            : { tracks: DEFAULT_TRACKS, events: DEFAULT_EVENTS };
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

    // View Calculation
    const pixelsPerDay = ZOOM_LEVELS[zoomIndex];

    const timelineRange = useMemo(() => {
        if (data.events.length === 0) {
            const now = new Date();
            return { min: addDays(now, -365), max: addDays(now, 365) };
        }
        const dates = data.events.flatMap((e) => [
            parseDate(e.startDate).getTime(),
            e.endDate
                ? parseDate(e.endDate).getTime()
                : parseDate(e.startDate).getTime(),
        ]);
        const minTime = Math.min(...dates);
        const maxTime = Math.max(...dates);

        // Add dynamic buffer based on zoom level to ensure screen is filled
        const bufferDays = 365 / (pixelsPerDay > 10 ? pixelsPerDay : 0.5);

        return {
            min: addDays(new Date(minTime), -Math.max(30, bufferDays)),
            max: addDays(new Date(maxTime), Math.max(30, bufferDays)),
        };
    }, [data.events, pixelsPerDay]);

    const totalDays = getDaysDiff(timelineRange.min, timelineRange.max);
    const totalWidth = totalDays * pixelsPerDay;

    // -- Effects --
    useEffect(() => {
        localStorage.setItem("chrono_data", JSON.stringify(data));
        dataRef.current = data;
    }, [data]);

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

        const handleGlobalMouseUp = () => {
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
                const deltaX = state.currentX - state.startX;

                if (
                    Math.abs(deltaX) > 2 ||
                    (state.mode === "move" &&
                        state.targetTrackId !== state.initialTrackId)
                ) {
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
                        if (state.targetTrackId)
                            newTrackId = state.targetTrackId;
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
        e.stopPropagation();
        e.preventDefault();

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
        setActiveModal(ModalType.NONE);
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
            setActiveModal(ModalType.NONE);
        }
    };

    const handleAddEvent = (trackId: string, dateStr?: string) => {
        setEditingEvent({
            id: crypto.randomUUID(),
            trackId,
            title: "New Event",
            startDate: dateStr || formatDate(new Date()),
            color:
                data.tracks.find((t) => t.id === trackId)?.color ||
                COLOR_PALETTE[6],
        });
        setActiveModal(ModalType.EDIT_EVENT);
    };

    const handleEditEvent = (event: IEvent) => {
        if (suppressClick) return;
        setEditingEvent({ ...event });
        setActiveModal(ModalType.EDIT_EVENT);
    };

    const handleSaveEvent = () => {
        if (!editingEvent) return;
        setData((prev) => {
            const exists = prev.events.find((e) => e.id === editingEvent.id);
            if (exists) {
                return {
                    ...prev,
                    events: prev.events.map((e) =>
                        e.id === editingEvent.id ? editingEvent : e
                    ),
                };
            }
            return { ...prev, events: [...prev.events, editingEvent] };
        });
        setActiveModal(ModalType.NONE);
    };

    const handleDeleteEvent = () => {
        if (!editingEvent) return;
        setData((prev) => ({
            ...prev,
            events: prev.events.filter((e) => e.id !== editingEvent.id),
        }));
        setActiveModal(ModalType.NONE);
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
                        setData(imported);
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

    return (
        <div className="flex flex-col h-screen bg-slate-50 select-none text-slate-800 font-sans">
            {/* Refined Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-40 border-b border-slate-200/60 sticky top-0 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
                        <Calendar size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                            ChronoCraft
                        </h1>
                        <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                            Timeline Editor
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* <Button variant="ghost" size="sm" onClick={() => setActiveModal(ModalType.AI_GENERATE)} 
              className="text-brand-600 bg-brand-50 hover:bg-brand-100 hover:text-brand-700 border border-brand-100" 
              icon={<Sparkles size={16}/>}>
            AI Assist
          </Button> */}

                    <div className="h-8 w-px bg-slate-200 mx-1" />

                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleZoom("out")}
                            disabled={zoomIndex === 0}
                            className="h-7 w-8 p-0 rounded-md hover:bg-white hover:shadow-sm"
                        >
                            <ZoomOut size={16} />
                        </Button>
                        <span className="text-[10px] font-medium text-slate-500 w-14 text-center tabular-nums">
                            {Math.round(pixelsPerDay)} px/d
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleZoom("in")}
                            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                            className="h-7 w-8 p-0 rounded-md hover:bg-white hover:shadow-sm"
                        >
                            <ZoomIn size={16} />
                        </Button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-1" />

                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAddTrack}
                            icon={<Plus size={16} />}
                            className="shadow-brand-500/20 shadow-lg"
                        >
                            Track
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                                setActiveModal(ModalType.IMPORT_EXPORT)
                            }
                            icon={<Settings size={16} />}
                        >
                            Data
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative flex flex-col cursor-default">
                {/* Sticky Time Header */}
                <div className="h-12 bg-white/90 backdrop-blur-sm border-b border-slate-200 shrink-0 overflow-hidden relative z-30 shadow-sm">
                    <div className="w-56 h-full border-r border-slate-200 absolute left-0 top-0 bg-slate-50/50 flex items-center px-6 text-xs font-bold text-slate-400 tracking-wider uppercase">
                        Tracks
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Fixed Sidebar */}
                    <div className="w-56 shrink-0 bg-white/50 backdrop-blur-sm z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col pt-0 border-r border-slate-100">
                        {data.tracks.map((track) => (
                            <div
                                key={track.id}
                                className="h-32 p-4 flex flex-col justify-between group hover:bg-slate-50/80 transition-all border-b border-slate-50 relative"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-1 h-8 rounded-full shrink-0"
                                        style={{ backgroundColor: track.color }}
                                    ></div>
                                    <div className="overflow-hidden">
                                        <h3
                                            className="font-semibold text-slate-700 truncate leading-tight"
                                            title={track.title}
                                        >
                                            {track.title}
                                        </h3>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            {
                                                data.events.filter(
                                                    (e) =>
                                                        e.trackId === track.id
                                                ).length
                                            }{" "}
                                            events
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] text-slate-400 hover:text-brand-600"
                                        onClick={() => handleEditTrack(track)}
                                    >
                                        Edit
                                    </Button>
                                    <div className="text-[10px] text-slate-300 font-mono">
                                        #{track.order + 1}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="p-4">
                            <Button
                                variant="ghost"
                                className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 rounded-xl transition-all"
                                onClick={handleAddTrack}
                            >
                                <Plus size={20} />
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Timeline */}
                    <div
                        id="timeline-scroll-container"
                        ref={scrollContainerRef}
                        className={`flex-1 overflow-x-auto overflow-y-auto timeline-scroll bg-slate-50/30 relative 
               ${isPanning ? "cursor-grabbing" : "cursor-grab"}
            `}
                        onMouseDown={handleCanvasMouseDown}
                        onWheel={handleWheelZoom}
                    >
                        <div
                            style={{
                                width: `${totalWidth}px`,
                                minHeight: "100%",
                            }}
                            className="relative"
                        >
                            {/* Time Scale - Now sticky and taller */}
                            <div className="h-12 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 w-full">
                                {renderTimeScale()}
                            </div>

                            <div className="absolute inset-0 z-0 pointer-events-none mt-12">
                                {renderGridLines()}
                            </div>

                            {renderDragGuides()}

                            <div className="flex flex-col relative z-0">
                                {data.tracks.map((track) => {
                                    const isTargetTrack =
                                        dragState.isDragging &&
                                        dragState.targetTrackId === track.id;
                                    return (
                                        <div
                                            key={track.id}
                                            data-track-id={track.id}
                                            className={`h-32 border-b border-slate-100 relative group transition-colors 
                        ${
                            isTargetTrack
                                ? "bg-brand-50/40"
                                : "hover:bg-white/40"
                        }`}
                                            onDoubleClick={(e) =>
                                                handleTrackDoubleClick(
                                                    e,
                                                    track.id
                                                )
                                            }
                                        >
                                            {/* Hover hint for double click */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none">
                                                <div className="flex items-center gap-1 text-slate-400 text-xs">
                                                    <Plus size={12} />{" "}
                                                    Double-click to add event
                                                </div>
                                            </div>

                                            {data.events
                                                .filter(
                                                    (e) =>
                                                        e.trackId === track.id
                                                )
                                                .map((event) => {
                                                    const isDraggingThis =
                                                        dragState.isDragging &&
                                                        dragState.eventId ===
                                                            event.id;
                                                    let style: React.CSSProperties =
                                                        getEventStyle(event);

                                                    if (isDraggingThis) {
                                                        const deltaX =
                                                            dragState.currentX -
                                                            dragState.startX;
                                                        const deltaY =
                                                            dragState.currentY -
                                                            dragState.startY;

                                                        if (
                                                            dragState.mode ===
                                                            "move"
                                                        ) {
                                                            style = {
                                                                ...style,
                                                                transform: `translate(${deltaX}px, ${deltaY}px)`,
                                                                zIndex: 50,
                                                                cursor: "grabbing",
                                                                pointerEvents:
                                                                    "none",
                                                                boxShadow:
                                                                    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                                                                opacity: 0.95,
                                                                scale: "1.02",
                                                            };
                                                        } else if (
                                                            dragState.mode ===
                                                            "resize-start"
                                                        ) {
                                                            const originalLeft =
                                                                parseFloat(
                                                                    style.left as string
                                                                );
                                                            const originalWidth =
                                                                parseFloat(
                                                                    style.width as string
                                                                );
                                                            style = {
                                                                ...style,
                                                                left: `${
                                                                    originalLeft +
                                                                    deltaX
                                                                }px`,
                                                                width: `${Math.max(
                                                                    pixelsPerDay,
                                                                    originalWidth -
                                                                        deltaX
                                                                )}px`,
                                                                zIndex: 50,
                                                                cursor: "ew-resize",
                                                            };
                                                        } else if (
                                                            dragState.mode ===
                                                            "resize-end"
                                                        ) {
                                                            const originalWidth =
                                                                parseFloat(
                                                                    style.width as string
                                                                );
                                                            style = {
                                                                ...style,
                                                                width: `${Math.max(
                                                                    pixelsPerDay,
                                                                    originalWidth +
                                                                        deltaX
                                                                )}px`,
                                                                zIndex: 50,
                                                                cursor: "ew-resize",
                                                            };
                                                        }
                                                    }

                                                    const {
                                                        backgroundColor,
                                                        ...wrapperStyle
                                                    } = style;

                                                    return (
                                                        <div
                                                            key={event.id}
                                                            className={`absolute top-4 h-20 group/event ${
                                                                !isDraggingThis
                                                                    ? "z-10 cursor-grab"
                                                                    : ""
                                                            }`}
                                                            style={wrapperStyle}
                                                            onMouseDown={(e) =>
                                                                handleDragStart(
                                                                    e,
                                                                    event,
                                                                    "move"
                                                                )
                                                            }
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditEvent(
                                                                    event
                                                                );
                                                            }}
                                                            title={`${event.title}`}
                                                        >
                                                            <div
                                                                className={`w-full h-full rounded-xl shadow-sm border border-black/5 px-3 py-2 flex flex-col overflow-hidden text-white transition-all duration-200 ease-out relative
                                    ${
                                        !isDraggingThis
                                            ? "hover:shadow-md hover:-translate-y-0.5 hover:brightness-[1.03]"
                                            : ""
                                    }
                                `}
                                                                style={{
                                                                    backgroundColor,
                                                                }}
                                                            >
                                                                {/* Glossy highlight */}
                                                                <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                                                                {!dragState.isDragging && (
                                                                    <>
                                                                        <div
                                                                            className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 z-20 flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity"
                                                                            onMouseDown={(
                                                                                e
                                                                            ) =>
                                                                                handleDragStart(
                                                                                    e,
                                                                                    event,
                                                                                    "resize-start"
                                                                                )
                                                                            }
                                                                        >
                                                                            <GripVertical
                                                                                size={
                                                                                    10
                                                                                }
                                                                                className="text-white/70"
                                                                            />
                                                                        </div>
                                                                        <div
                                                                            className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 z-20 flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity"
                                                                            onMouseDown={(
                                                                                e
                                                                            ) =>
                                                                                handleDragStart(
                                                                                    e,
                                                                                    event,
                                                                                    "resize-end"
                                                                                )
                                                                            }
                                                                        >
                                                                            <GripVertical
                                                                                size={
                                                                                    10
                                                                                }
                                                                                className="text-white/70"
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="font-semibold text-sm truncate pointer-events-none drop-shadow-sm">
                                                                    {
                                                                        event.title
                                                                    }
                                                                </div>
                                                                <div className="mt-auto flex items-baseline justify-between pointer-events-none">
                                                                    <div className="text-[10px] font-medium opacity-90">
                                                                        {
                                                                            event.startDate
                                                                        }
                                                                    </div>
                                                                    {event.endDate && (
                                                                        <div className="text-[10px] opacity-75">
                                                                            →
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={activeModal === ModalType.EDIT_TRACK}
                onClose={() => setActiveModal(ModalType.NONE)}
                title={editingTrack?.id === "new" ? "New Track" : "Edit Track"}
                footer={
                    <>
                        {editingTrack?.id &&
                            data.tracks.find(
                                (t) => t.id === editingTrack.id
                            ) && (
                                <Button
                                    variant="danger"
                                    onClick={handleDeleteTrack}
                                    className="mr-auto"
                                >
                                    Delete
                                </Button>
                            )}
                        <Button
                            variant="secondary"
                            onClick={() => setActiveModal(ModalType.NONE)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTrack}>Save Track</Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Track Title
                        </label>
                        <input
                            type="text"
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={editingTrack?.title || ""}
                            onChange={(e) =>
                                setEditingTrack((prev) =>
                                    prev
                                        ? { ...prev, title: e.target.value }
                                        : null
                                )
                            }
                            placeholder="e.g., Marketing Projects"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Color Theme
                        </label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                            <ColorPicker
                                selected={editingTrack?.color || "#3b82f6"}
                                onChange={(c) =>
                                    setEditingTrack((prev) =>
                                        prev ? { ...prev, color: c } : null
                                    )
                                }
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={activeModal === ModalType.EDIT_EVENT}
                onClose={() => setActiveModal(ModalType.NONE)}
                title="Edit Event"
                footer={
                    <>
                        <Button
                            variant="danger"
                            onClick={handleDeleteEvent}
                            className="mr-auto"
                        >
                            Delete
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => setActiveModal(ModalType.NONE)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEvent}>Save Event</Button>
                    </>
                }
            >
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Event Title
                        </label>
                        <input
                            type="text"
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={editingEvent?.title || ""}
                            onChange={(e) =>
                                setEditingEvent((prev) =>
                                    prev
                                        ? { ...prev, title: e.target.value }
                                        : null
                                )
                            }
                            placeholder="What happened?"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Start Date
                            </label>
                            <input
                                type="date"
                                className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={editingEvent?.startDate || ""}
                                onChange={(e) =>
                                    setEditingEvent((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  startDate: e.target.value,
                                              }
                                            : null
                                    )
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                End Date{" "}
                                <span className="text-slate-400 font-normal normal-case">
                                    (Optional)
                                </span>
                            </label>
                            <input
                                type="date"
                                className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={editingEvent?.endDate || ""}
                                min={editingEvent?.startDate}
                                onChange={(e) =>
                                    setEditingEvent((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  endDate: e.target.value,
                                              }
                                            : null
                                    )
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            Description
                        </label>
                        <textarea
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
                            rows={3}
                            value={editingEvent?.description || ""}
                            onChange={(e) =>
                                setEditingEvent((prev) =>
                                    prev
                                        ? {
                                              ...prev,
                                              description: e.target.value,
                                          }
                                        : null
                                )
                            }
                            placeholder="Add details..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Track
                            </label>
                            <select
                                className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={editingEvent?.trackId || ""}
                                onChange={(e) =>
                                    setEditingEvent((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  trackId: e.target.value,
                                              }
                                            : null
                                    )
                                }
                            >
                                {data.tracks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                                Event Color
                            </label>
                            <div className="h-[42px] flex items-center">
                                <ColorPicker
                                    selected={editingEvent?.color || "#3b82f6"}
                                    onChange={(c) =>
                                        setEditingEvent((prev) =>
                                            prev ? { ...prev, color: c } : null
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* <Modal
        isOpen={activeModal === ModalType.AI_GENERATE}
        onClose={() => setActiveModal(ModalType.NONE)}
        title="AI Timeline Generator"
        footer={
          <>
            <Button variant="secondary" onClick={() => setActiveModal(ModalType.NONE)}>Cancel</Button>
            <Button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt.trim()}>
              {isGenerating ? 'Dreaming...' : 'Generate Timeline'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-brand-50 to-white border border-brand-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
             <div className="p-2 bg-brand-100 rounded-lg text-brand-600">
                <Sparkles size={20} />
             </div>
             <div className="text-sm text-slate-600 leading-relaxed">
               <strong className="text-brand-800 block mb-1">Unleash your creativity</strong>
               Enter any historical event, project plan, or biography. Our AI will structure tracks and events instantly.
             </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Topic Prompt</label>
            <input
              type="text"
              placeholder="e.g. The Evolution of Video Games"
              className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-3 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              autoFocus
            />
          </div>
          {aiError && (
             <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
               {aiError}
             </div>
          )}
        </div>
      </Modal> */}

            <Modal
                isOpen={activeModal === ModalType.IMPORT_EXPORT}
                onClose={() => setActiveModal(ModalType.NONE)}
                title="Data Management"
                footer={
                    <Button onClick={() => setActiveModal(ModalType.NONE)}>
                        Close
                    </Button>
                }
            >
                <div className="space-y-6">
                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-600">
                                <Download size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">
                                    Export Data
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Save your timeline as a JSON file.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleExport}
                            className="w-full justify-center"
                        >
                            Download JSON
                        </Button>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-600">
                                <Upload size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">
                                    Import Data
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Restore from a backup file.
                                </p>
                            </div>
                        </div>
                        <label className="block">
                            <span className="sr-only">Choose file</span>
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-xs file:font-semibold
                  file:bg-brand-50 file:text-brand-700
                  hover:file:bg-brand-100
                  cursor-pointer
                "
                            />
                        </label>
                    </div>

                    <div className="border border-red-100 bg-red-50/50 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-white rounded-lg border border-red-100 shadow-sm text-red-500">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900 text-sm">
                                    Reset Timeline
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Clear all tracks and events.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="danger"
                            size="sm"
                            className="w-full justify-center"
                            onClick={() => {
                                if (
                                    confirm(
                                        "Are you sure? This cannot be undone."
                                    )
                                ) {
                                    setData({ tracks: [], events: [] });
                                    setActiveModal(ModalType.NONE);
                                }
                            }}
                        >
                            Clear Everything
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

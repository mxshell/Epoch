import React from "react";
import { GripVertical, Plus } from "lucide-react";
import { IEvent, ITrack, IDragState, DragMode } from "../types";

type TimelineCanvasProps = {
    tracks: ITrack[];
    events: IEvent[];
    dragState: IDragState;
    isPanning: boolean;
    totalWidth: number;
    pixelsPerDay: number;
    scrollContainerRef: React.RefObject<HTMLDivElement>;
    onCanvasMouseDown: (e: React.MouseEvent) => void;
    onWheelZoom: (e: React.WheelEvent) => void;
    onTrackDoubleClick: (e: React.MouseEvent, trackId: string) => void;
    onDragStart: (e: React.MouseEvent, event: IEvent, mode: DragMode) => void;
    onEditEvent: (event: IEvent) => void;
    timeScale: React.ReactNode;
    gridLines: React.ReactNode;
    dragGuides: React.ReactNode;
    getEventStyle: (event: IEvent) => React.CSSProperties;
};

const HoverHint = () => (
    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 pointer-events-none">
        <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Plus size={12} /> Double-click to add event
        </div>
    </div>
);

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
    tracks,
    events,
    dragState,
    isPanning,
    totalWidth,
    pixelsPerDay,
    scrollContainerRef,
    onCanvasMouseDown,
    onWheelZoom,
    onTrackDoubleClick,
    onDragStart,
    onEditEvent,
    timeScale,
    gridLines,
    dragGuides,
    getEventStyle,
}) => {
    const renderEvent = (event: IEvent, isDraggingThis: boolean) => {
        let style: React.CSSProperties = getEventStyle(event);

        if (isDraggingThis) {
            const deltaX = dragState.currentX - dragState.startX;
            const deltaY = dragState.currentY - dragState.startY;

            if (dragState.mode === "move") {
                style = {
                    ...style,
                    transform: `translate(${deltaX}px, ${deltaY}px)`,
                    zIndex: 50,
                    cursor: "grabbing",
                    pointerEvents: "none",
                    boxShadow:
                        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    opacity: 0.95,
                    scale: "1.02",
                };
            } else if (dragState.mode === "resize-start") {
                const originalLeft = parseFloat(style.left as string);
                const originalWidth = parseFloat(style.width as string);
                style = {
                    ...style,
                    left: `${originalLeft + deltaX}px`,
                    width: `${Math.max(
                        pixelsPerDay,
                        originalWidth - deltaX
                    )}px`,
                    zIndex: 50,
                    cursor: "ew-resize",
                };
            } else if (dragState.mode === "resize-end") {
                const originalWidth = parseFloat(style.width as string);
                style = {
                    ...style,
                    width: `${Math.max(
                        pixelsPerDay,
                        originalWidth + deltaX
                    )}px`,
                    zIndex: 50,
                    cursor: "ew-resize",
                };
            }
        }

        const { backgroundColor, ...wrapperStyle } = style;

        return (
            <div
                key={event.id}
                className={`absolute top-4 h-20 group/event ${
                    !isDraggingThis ? "z-10 cursor-grab" : ""
                }`}
                style={wrapperStyle}
                onMouseDown={(e) => onDragStart(e, event, "move")}
                onClick={(e) => {
                    e.stopPropagation();
                    onEditEvent(event);
                }}
                title={`${event.title}`}
            >
                <div
                    className={`w-full h-full rounded-xl shadow-sm border border-black/5 px-3 py-2 flex flex-col overflow-hidden text-white transition-all duration-200 ease-out relative ${
                        !isDraggingThis
                            ? "hover:shadow-md hover:-translate-y-0.5 hover:brightness-[1.03]"
                            : ""
                    }`}
                    style={{
                        backgroundColor,
                    }}
                >
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                    {!dragState.isDragging && (
                        <>
                            <div
                                className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 z-20 flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity"
                                onMouseDown={(e) =>
                                    onDragStart(e, event, "resize-start")
                                }
                            >
                                <GripVertical size={10} className="text-white/70" />
                            </div>
                            <div
                                className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 z-20 flex items-center justify-center opacity-0 group-hover/event:opacity-100 transition-opacity"
                                onMouseDown={(e) =>
                                    onDragStart(e, event, "resize-end")
                                }
                            >
                                <GripVertical size={10} className="text-white/70" />
                            </div>
                        </>
                    )}

                    <div className="font-semibold text-sm truncate pointer-events-none drop-shadow-sm">
                        {event.title}
                    </div>
                    <div className="mt-auto flex items-baseline justify-between pointer-events-none">
                        <div className="text-[10px] font-medium opacity-90">
                            {event.startDate}
                        </div>
                        {event.endDate && (
                            <div className="text-[10px] opacity-75">→</div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div
            id="timeline-scroll-container"
            ref={scrollContainerRef}
            className={`flex-1 overflow-x-auto overflow-y-auto timeline-scroll bg-slate-50/30 relative ${
                isPanning ? "cursor-grabbing" : "cursor-grab"
            }`}
            onMouseDown={onCanvasMouseDown}
            onWheel={onWheelZoom}
        >
            <div
                style={{
                    width: `${totalWidth}px`,
                    minHeight: "100%",
                }}
                className="relative"
            >
                <div className="h-12 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 w-full">
                    {timeScale}
                </div>

                <div className="absolute inset-0 z-0 pointer-events-none mt-12">
                    {gridLines}
                </div>

                {dragGuides}

                <div className="flex flex-col relative z-0">
                    {tracks.map((track) => {
                        const isTargetTrack =
                            dragState.isDragging &&
                            dragState.targetTrackId === track.id;
                        return (
                            <div
                                key={track.id}
                                data-track-id={track.id}
                                className={`h-32 border-b border-slate-100 relative group transition-colors ${
                                    isTargetTrack
                                        ? "bg-brand-50/40"
                                        : "hover:bg-white/40"
                                }`}
                                onDoubleClick={(e) =>
                                    onTrackDoubleClick(e, track.id)
                                }
                            >
                                <HoverHint />
                                {events
                                    .filter((e) => e.trackId === track.id)
                                    .map((event) =>
                                        renderEvent(
                                            event,
                                            dragState.isDragging &&
                                                dragState.eventId === event.id
                                        )
                                    )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


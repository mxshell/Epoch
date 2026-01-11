import React, { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { Button } from "./Button";
import { ITrack } from "../types";
import { TrackLaneInfo, getTrackHeight } from "../utils/eventLanes";

type TrackSidebarProps = {
    tracks: ITrack[];
    trackLaneInfo: Map<string, TrackLaneInfo>;
    onAddTrack: () => void;
    onEditTrack: (track: ITrack) => void;
    onReorderTracks: (fromIndex: number, toIndex: number) => void;
};

export const TrackSidebar: React.FC<TrackSidebarProps> = ({
    tracks,
    trackLaneInfo,
    onAddTrack,
    onEditTrack,
    onReorderTracks,
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        
        // Add a slight delay to allow the drag image to be created
        setTimeout(() => {
            const draggedEl = e.currentTarget as HTMLElement;
            draggedEl.style.opacity = "0.5";
        }, 0);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const draggedEl = e.currentTarget as HTMLElement;
        draggedEl.style.opacity = "1";
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        
        if (draggedIndex !== null && draggedIndex !== toIndex) {
            onReorderTracks(draggedIndex, toIndex);
        }
        
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    return (
        <div className="w-56 shrink-0 bg-white/50 backdrop-blur-sm z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col border-r border-slate-100 overflow-y-auto">
            {/* Spacer to match TimelineCanvas time scale header */}
            <div className="h-12 shrink-0 sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-10" />
            {tracks.map((track, index) => {
                const laneInfo = trackLaneInfo.get(track.id);
                const trackHeight = laneInfo ? getTrackHeight(laneInfo.maxLanes) : getTrackHeight(1);
                const eventCount = laneInfo?.events.length || 0;
                
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                const showDropAbove = isDragOver && draggedIndex !== null && draggedIndex > index;
                const showDropBelow = isDragOver && draggedIndex !== null && draggedIndex < index;
                
                return (
                    <div
                        key={track.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`p-4 flex flex-col justify-between group hover:bg-slate-50/80 transition-all border-b border-slate-50 relative cursor-grab active:cursor-grabbing ${
                            isDragging ? "opacity-50 bg-slate-100" : ""
                        }`}
                        style={{ height: `${trackHeight}px` }}
                    >
                        {/* Drop indicator - above */}
                        {showDropAbove && (
                            <div className="absolute -top-0.5 left-0 right-0 h-1 bg-brand-500 rounded-full z-10 shadow-sm" />
                        )}
                        
                        {/* Drop indicator - below */}
                        {showDropBelow && (
                            <div className="absolute -bottom-0.5 left-0 right-0 h-1 bg-brand-500 rounded-full z-10 shadow-sm" />
                        )}
                        
                        <div className="flex items-start gap-3">
                            {/* Drag handle */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-slate-400 hover:text-slate-600 shrink-0 -ml-1 mt-1">
                                <GripVertical size={14} />
                            </div>
                            
                            <div
                                className="w-1 h-8 rounded-full shrink-0"
                                style={{ backgroundColor: track.color }}
                            ></div>
                            <div className="overflow-hidden flex-1">
                                <h3
                                    className="font-semibold text-slate-700 truncate leading-tight"
                                    title={track.title}
                                >
                                    {track.title}
                                </h3>
                                <div className="text-[10px] text-slate-400 mt-1">
                                    {eventCount} events
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-[10px] text-slate-400 hover:text-brand-600"
                                onClick={() => onEditTrack(track)}
                            >
                                Edit
                            </Button>
                            <div className="text-[10px] text-slate-300 font-mono">
                                #{track.order + 1}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div className="p-4">
                <Button
                    variant="ghost"
                    className="w-full h-12 border-dashed border-2 border-slate-200 text-slate-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/50 rounded-xl transition-all"
                    onClick={onAddTrack}
                >
                    <Plus size={20} />
                </Button>
            </div>
        </div>
    );
};

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "./Button";
import { ITrack } from "../types";
import { TrackLaneInfo, getTrackHeight } from "../utils/eventLanes";

type TrackSidebarProps = {
    tracks: ITrack[];
    trackLaneInfo: Map<string, TrackLaneInfo>;
    onAddTrack: () => void;
    onEditTrack: (track: ITrack) => void;
};

export const TrackSidebar: React.FC<TrackSidebarProps> = ({
    tracks,
    trackLaneInfo,
    onAddTrack,
    onEditTrack,
}) => (
    <div className="w-56 shrink-0 bg-white/50 backdrop-blur-sm z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col border-r border-slate-100 overflow-y-auto">
        {/* Spacer to match TimelineCanvas time scale header */}
        <div className="h-12 shrink-0 sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-10" />
        {tracks.map((track) => {
            const laneInfo = trackLaneInfo.get(track.id);
            const trackHeight = laneInfo ? getTrackHeight(laneInfo.maxLanes) : getTrackHeight(1);
            const eventCount = laneInfo?.events.length || 0;
            
            return (
            <div
                key={track.id}
                className="p-4 flex flex-col justify-between group hover:bg-slate-50/80 transition-all border-b border-slate-50 relative"
                style={{ height: `${trackHeight}px` }}
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


import React from "react";
import { Plus } from "lucide-react";
import { Button } from "./Button";
import { IEvent, ITrack } from "../types";

type TrackSidebarProps = {
    tracks: ITrack[];
    events: IEvent[];
    onAddTrack: () => void;
    onEditTrack: (track: ITrack) => void;
};

const getEventCount = (trackId: string, events: IEvent[]) =>
    events.filter((e) => e.trackId === trackId).length;

export const TrackSidebar: React.FC<TrackSidebarProps> = ({
    tracks,
    events,
    onAddTrack,
    onEditTrack,
}) => (
    <div className="w-56 shrink-0 bg-white/50 backdrop-blur-sm z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col pt-0 border-r border-slate-100">
        {tracks.map((track) => (
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
                            {getEventCount(track.id, events)} events
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
        ))}
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


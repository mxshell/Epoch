import React from "react";
import { Calendar, Plus, Settings, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./Button";

type AppHeaderProps = {
    pixelsPerDay: number;
    zoomIndex: number;
    zoomLevelsLength: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onAddTrack: () => void;
    onOpenData: () => void;
};

export const AppHeader: React.FC<AppHeaderProps> = ({
    pixelsPerDay,
    zoomIndex,
    zoomLevelsLength,
    onZoomIn,
    onZoomOut,
    onAddTrack,
    onOpenData,
}) => {
    return (
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
                <div className="h-8 w-px bg-slate-200 mx-1" />

                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onZoomOut}
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
                        onClick={onZoomIn}
                        disabled={zoomIndex === zoomLevelsLength - 1}
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
                        onClick={onAddTrack}
                        icon={<Plus size={16} />}
                        className="shadow-brand-500/20 shadow-lg"
                    >
                        Track
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onOpenData}
                        icon={<Settings size={16} />}
                    >
                        Data
                    </Button>
                </div>
            </div>
        </header>
    );
};


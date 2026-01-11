import React from "react";
import {
    Calendar,
    Settings,
    ZoomIn,
    ZoomOut,
    MousePointerClick,
    Move,
    GripHorizontal,
} from "lucide-react";
import { Button } from "./Button";

type AppHeaderProps = {
    pixelsPerDay: number;
    zoomIndex: number;
    zoomLevelsLength: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onOpenData: () => void;
};

const QuickGuide = () => (
    <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
            <MousePointerClick size={12} className="text-slate-300" />
            <span>
                <span className="text-slate-500 font-medium">Double-click</span>{" "}
                canvas to add
            </span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <div className="flex items-center gap-1.5">
            <MousePointerClick size={12} className="text-slate-300" />
            <span>
                <span className="text-slate-500 font-medium">Double-click</span>{" "}
                event to edit
            </span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <div className="flex items-center gap-1.5">
            <Move size={12} className="text-slate-300" />
            <span>
                <span className="text-slate-500 font-medium">Drag</span> to move
            </span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <div className="flex items-center gap-1.5">
            <GripHorizontal size={12} className="text-slate-300" />
            <span>
                <span className="text-slate-500 font-medium">Drag edges</span>{" "}
                to resize
            </span>
        </div>
    </div>
);

export const AppHeader: React.FC<AppHeaderProps> = ({
    pixelsPerDay,
    zoomIndex,
    zoomLevelsLength,
    onZoomIn,
    onZoomOut,
    onOpenData,
}) => {
    return (
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md z-40 border-b border-slate-200/60 sticky top-0 shrink-0">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
                        <Calendar size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                            Epoch
                        </h1>
                        <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                            Timeline Editor
                        </span>
                    </div>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden md:block" />
                <QuickGuide />
            </div>

            <div className="flex items-center gap-3">
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

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onOpenData}
                    icon={<Settings size={16} />}
                >
                    Settings
                </Button>
            </div>
        </header>
    );
};

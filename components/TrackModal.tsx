import React from "react";
import { ITrack } from "../types";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { ColorPicker } from "./color/ColorPicker";

type TrackModalProps = {
    isOpen: boolean;
    editingTrack: ITrack | null;
    onClose: () => void;
    onChange: (track: ITrack) => void;
    onSave: () => void;
    onDelete: () => void;
    tracks: ITrack[];
};

export const TrackModal: React.FC<TrackModalProps> = ({
    isOpen,
    editingTrack,
    onClose,
    onChange,
    onSave,
    onDelete,
    tracks,
}) => {
    if (!isOpen || !editingTrack) return null;

    const exists = tracks.some((t) => t.id === editingTrack.id);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={exists ? "Edit Track" : "New Track"}
            footer={
                <>
                    {exists && (
                        <Button variant="danger" onClick={onDelete} className="mr-auto">
                            Delete
                        </Button>
                    )}
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onSave}>Save Track</Button>
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
                        value={editingTrack.title}
                        onChange={(e) =>
                            onChange({
                                ...editingTrack,
                                title: e.target.value,
                            })
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
                            selected={editingTrack.color || "#3b82f6"}
                            onChange={(color) =>
                                onChange({ ...editingTrack, color })
                            }
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};


import React from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { ColorPicker } from "./color/ColorPicker";
import { IEvent, ITrack } from "../types";

type EventModalProps = {
    isOpen: boolean;
    editingEvent: IEvent | null;
    tracks: ITrack[];
    onClose: () => void;
    onChange: (event: IEvent) => void;
    onSave: () => void;
    onDelete: () => void;
};

export const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    editingEvent,
    tracks,
    onClose,
    onChange,
    onSave,
    onDelete,
}) => {
    if (!isOpen || !editingEvent) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Event"
            footer={
                <>
                    <Button variant="danger" onClick={onDelete} className="mr-auto">
                        Delete
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onSave}>Save Event</Button>
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
                        value={editingEvent.title}
                        onChange={(e) =>
                            onChange({ ...editingEvent, title: e.target.value })
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
                            value={editingEvent.startDate || ""}
                            onChange={(e) =>
                                onChange({
                                    ...editingEvent,
                                    startDate: e.target.value,
                                })
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
                            value={editingEvent.endDate || ""}
                            min={editingEvent.startDate}
                            onChange={(e) =>
                                onChange({
                                    ...editingEvent,
                                    endDate: e.target.value,
                                })
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
                        value={editingEvent.description || ""}
                        onChange={(e) =>
                            onChange({
                                ...editingEvent,
                                description: e.target.value,
                            })
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
                            value={editingEvent.trackId || ""}
                            onChange={(e) =>
                                onChange({
                                    ...editingEvent,
                                    trackId: e.target.value,
                                })
                            }
                        >
                            {tracks.map((t) => (
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
                                selected={editingEvent.color || "#3b82f6"}
                                onChange={(color) =>
                                    onChange({ ...editingEvent, color })
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};


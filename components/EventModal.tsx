import React from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { ColorPicker } from "./color/ColorPicker";
import { IEvent, ITrack } from "../types";
import { normalizeDateString } from "../utils/dateUtils";

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

    const startDateValue = normalizeDateString(editingEvent.startDate);
    const endDateValue = normalizeDateString(
        editingEvent.endDate || editingEvent.startDate
    );

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
                            value={startDateValue}
                            onChange={(e) => {
                                const newStartDate = e.target.value;
                                const currentEndDate = endDateValue || newStartDate;
                                // If new start date is after current end date, adjust end date
                                const updatedEndDate = newStartDate > currentEndDate ? newStartDate : currentEndDate;
                                onChange({
                                    ...editingEvent,
                                    startDate: newStartDate,
                                    endDate: updatedEndDate,
                                });
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="block w-full rounded-lg border-slate-200 bg-slate-50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                            value={endDateValue}
                            min={startDateValue}
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
                    <ColorPicker
                        selected={editingEvent.color || "#3b82f6"}
                        onChange={(color) =>
                            onChange({ ...editingEvent, color })
                        }
                    />
                </div>
            </div>
        </Modal>
    );
};

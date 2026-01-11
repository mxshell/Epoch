import React from "react";
import { Download, Settings, Trash2, Upload } from "lucide-react";
import { Button } from "./Button";
import { Modal } from "./Modal";

type DataModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onExport: () => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onReset: () => void;
    minYear: number;
    maxYear: number;
    onBoundsChange: (bounds: { minYear: number; maxYear: number }) => void;
    onSaveBounds: () => void;
};

export const DataModal: React.FC<DataModalProps> = ({
    isOpen,
    onClose,
    onExport,
    onImport,
    onReset,
    minYear,
    maxYear,
    onBoundsChange,
    onSaveBounds,
}) => {
    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Data Management"
            footer={<Button onClick={onClose}>Close</Button>}
        >
            <div className="space-y-6">
                <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-600">
                            <Settings size={18} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 text-sm">
                                Canvas Range
                            </h3>
                            <p className="text-xs text-slate-500">
                                Set the earliest and latest years shown on the timeline.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex flex-col gap-1.5">
                            Oldest Year
                            <input
                                type="number"
                                className="block w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={minYear}
                                min={1900}
                                max={2100}
                                onChange={(e) =>
                                    onBoundsChange({
                                        minYear: Number(e.target.value),
                                        maxYear,
                                    })
                                }
                            />
                        </label>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex flex-col gap-1.5">
                            Future Limit
                            <input
                                type="number"
                                className="block w-full rounded-lg border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
                                value={maxYear}
                                min={1900}
                                max={2100}
                                onChange={(e) =>
                                    onBoundsChange({
                                        minYear,
                                        maxYear: Number(e.target.value),
                                    })
                                }
                            />
                        </label>
                        <div className="col-span-2 flex justify-end">
                            <Button onClick={onSaveBounds} className="px-4">
                                Save
                            </Button>
                        </div>
                    </div>
                </div>

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
                    <Button onClick={onExport} className="w-full justify-center">
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
                            onChange={onImport}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
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
                        onClick={onReset}
                    >
                        Clear Everything
                    </Button>
                </div>
            </div>
        </Modal>
    );
};


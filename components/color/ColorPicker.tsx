import React from "react";
import { COLOR_PALETTE } from "../../constants";

type ColorPickerProps = {
    selected: string;
    onChange: (color: string) => void;
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
    selected,
    onChange,
}) => (
    <div className="flex flex-wrap gap-2">
        {COLOR_PALETTE.map((c) => (
            <button
                key={c}
                type="button"
                onClick={() => onChange(c)}
                className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selected === c
                        ? "border-slate-600 scale-110 shadow-sm"
                        : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
            />
        ))}
    </div>
);


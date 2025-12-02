/**
 * Simple Slider Component
 *
 * Basic dual-thumb range slider for confidence filtering.
 * This is a simplified version until we can properly install @radix-ui/react-slider
 */

"use client";

import * as React from "react";

interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number[];
  onValueChange: (value: number[]) => void;
  className?: string;
}

export function Slider({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  className = "",
}: SliderProps) {
  // For now, we'll use two separate range inputs as a workaround
  const [minValue, maxValue] = value;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = parseInt(e.target.value);
    if (newMin <= maxValue) {
      onValueChange([newMin, maxValue]);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = parseInt(e.target.value);
    if (newMax >= minValue) {
      onValueChange([minValue, newMax]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Min</label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={handleMinChange}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Max</label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={handleMaxChange}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  );
}

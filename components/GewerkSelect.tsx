"use client";

import { useState } from "react";
import { GEWERKE } from "@/lib/types";

interface GewerkSelectProps {
  value: string;
  onChange: (value: string) => void;
  className: string;
  placeholder?: string;
}

export default function GewerkSelect({ value, onChange, className, placeholder = "Gewerk wählen…" }: GewerkSelectProps) {
  const matchesList = (GEWERKE as readonly string[]).includes(value);
  const [customMode, setCustomMode] = useState(value !== "" && !matchesList);

  return (
    <div className="space-y-1.5">
      <select
        className={className}
        value={customMode ? "Sonstiges" : value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "Sonstiges") {
            setCustomMode(true);
            onChange("");
          } else {
            setCustomMode(false);
            onChange(v);
          }
        }}
      >
        <option value="">{placeholder}</option>
        {GEWERKE.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      {customMode && (
        <input
          className={className}
          placeholder="Gewerk eingeben"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}

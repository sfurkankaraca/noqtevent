"use client";

import { useRef } from "react";
import Image from "next/image";

export interface FocalPoint {
  x: number;
  y: number;
}

interface Props {
  src: string;
  value: FocalPoint;
  onChange: (fp: FocalPoint) => void;
  aspectRatio?: string;
}

export default function FocalPointPicker({ src, value, onChange, aspectRatio = "3/4" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">Odak noktası (tıkla)</p>
      <div
        ref={containerRef}
        className="relative cursor-crosshair rounded-xl overflow-hidden border-2 border-foreground/20 hover:border-foreground/40 transition-colors select-none"
        style={{ aspectRatio, maxWidth: 140 }}
        onClick={handleClick}
      >
        <Image
          src={src}
          alt=""
          fill
          className="object-cover pointer-events-none"
          style={{ objectPosition: `${value.x}% ${value.y}%` }}
          unoptimized
        />
        {/* Crosshair lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 bottom-0 w-px bg-white/50"
            style={{ left: `${value.x}%` }}
          />
          <div
            className="absolute left-0 right-0 h-px bg-white/50"
            style={{ top: `${value.y}%` }}
          />
        </div>
        {/* Dot */}
        <div
          className="absolute w-3.5 h-3.5 rounded-full bg-white border-2 border-foreground/40 shadow pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${value.x}%`, top: `${value.y}%` }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground tabular-nums">
        {value.x}% · {value.y}%
        {value.x === 50 && value.y === 50 && " (merkez)"}
      </p>
      {(value.x !== 50 || value.y !== 50) && (
        <button
          type="button"
          onClick={() => onChange({ x: 50, y: 50 })}
          className="text-[10px] text-muted-foreground hover:text-foreground underline transition-colors"
        >
          Merkeze al
        </button>
      )}
    </div>
  );
}

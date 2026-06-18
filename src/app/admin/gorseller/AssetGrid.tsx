"use client";

import { useState } from "react";
import Image from "next/image";
import { deleteAsset } from "./actions";

type Asset = {
  id: string;
  category: string;
  label: string;
  public_url: string;
  file_path: string;
  created_at: string;
};

export default function AssetGrid({ assets }: { assets: Asset[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (!confirm("Bu görseli silmek istediğinden emin misin?")) return;
    setDeleting(id);
    await deleteAsset(id, filePath);
    setDeleting(null);
  };

  if (!assets.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className="group relative bg-white rounded-2xl border border-border overflow-hidden"
        >
          <div className="relative aspect-video bg-secondary/30">
            <Image
              src={asset.public_url}
              alt={asset.label}
              fill
              className="object-cover"
              unoptimized
            />
          </div>

          <div className="px-3 py-2.5">
            <p className="text-xs font-medium text-foreground truncate">{asset.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{asset.category}</p>
          </div>

          {/* Hover actions */}
          <div className="absolute inset-0 bg-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
            <button
              onClick={() => copyUrl(asset.public_url)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white text-foreground hover:bg-white/90 transition-colors"
            >
              {copied === asset.public_url ? "Kopyalandı!" : "URL Kopyala"}
            </button>
            <button
              onClick={() => handleDelete(asset.id, asset.file_path)}
              disabled={deleting === asset.id}
              className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

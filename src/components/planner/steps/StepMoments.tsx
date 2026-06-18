"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type PlannerData } from "../PlannerStore";
import {
  getMomentsForEventType,
  getSongsForMoment,
  MOMENT_MOODS,
  type MomentSelection,
  type MomentSong,
} from "../momentData";

type Props = {
  data: PlannerData;
  update: (partial: Partial<PlannerData>) => void;
  onNext: () => void;
};

const LANG_OPTIONS = [
  { id: "local" as const, label: "Yerli" },
  { id: "international" as const, label: "Yabancı" },
  { id: "mixed" as const, label: "Karışık" },
];

const ENERGY_OPTIONS = [
  { id: "slow" as const, label: "Slow" },
  { id: "medium" as const, label: "Orta Tempo" },
  { id: "energetic" as const, label: "Hareketli" },
];

function SongCard({
  song,
  selected,
  onSelect,
}: {
  song: MomentSong;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
        selected
          ? "border-foreground bg-foreground/5"
          : "border-border hover:border-foreground/30"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
          selected ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"
        }`}
      >
        ♪
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
      </div>
      {selected && (
        <span className="text-xs font-bold text-foreground flex-shrink-0">✓</span>
      )}
    </button>
  );
}

function MomentCard({
  moment,
  selection,
  onUpdate,
  hasSongs,
}: {
  moment: ReturnType<typeof getMomentsForEventType>[0];
  selection: MomentSelection;
  onUpdate: (sel: Partial<MomentSelection>) => void;
  hasSongs: boolean;
}) {
  const [showCustom, setShowCustom] = useState(false);

  const langForFilter =
    selection.musicPref === "local"
      ? "tr"
      : selection.musicPref === "international"
      ? "en"
      : "mixed";

  const suggestedSongs = hasSongs
    ? getSongsForMoment(moment.id, {
        language: langForFilter,
        energy: selection.energy || undefined,
        moods: selection.moods,
      })
    : [];

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      {/* Header — always visible */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none">{moment.emoji}</span>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{moment.label}</h3>
              {moment.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{moment.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Important? toggle */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onUpdate({ important: true })}
            className={`flex-1 py-2 rounded-full text-xs font-medium border transition-all ${
              selection.important
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            Evet, önemli
          </button>
          <button
            onClick={() => onUpdate({ important: false })}
            className={`flex-1 py-2 rounded-full text-xs font-medium border transition-all ${
              !selection.important
                ? "bg-secondary text-foreground border-secondary"
                : "border-border text-muted-foreground hover:border-foreground/40"
            }`}
          >
            Geç →
          </button>
        </div>
      </div>

      {/* Expanded content when important */}
      <AnimatePresence>
        {selection.important && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-4 space-y-5">

              {/* Mood */}
              <div>
                <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-2.5">
                  Bu an nasıl hissettirsin?
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {MOMENT_MOODS.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => {
                        const next = selection.moods.includes(mood)
                          ? selection.moods.filter((m) => m !== mood)
                          : [...selection.moods, mood];
                        onUpdate({ moods: next });
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                        selection.moods.includes(mood)
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-foreground hover:border-foreground/40"
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              {/* Music preference */}
              <div>
                <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-2.5">
                  Müzik tercihi
                </p>
                <div className="flex gap-2">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onUpdate({ musicPref: opt.id })}
                      className={`flex-1 py-2 rounded-full text-xs font-medium border transition-all ${
                        selection.musicPref === opt.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy */}
              <div>
                <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-2.5">
                  Enerji seviyesi
                </p>
                <div className="flex gap-2">
                  {ENERGY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => onUpdate({ energy: opt.id })}
                      className={`flex-1 py-2 rounded-full text-xs font-medium border transition-all ${
                        selection.energy === opt.id
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggested songs — only for moments with song database */}
              {hasSongs && suggestedSongs.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground tracking-wide uppercase font-medium mb-2.5">
                    Önerilen Şarkılar
                  </p>
                  <div className="space-y-2">
                    {suggestedSongs.map((song) => (
                      <SongCard
                        key={song.id}
                        song={song}
                        selected={selection.selectedSongId === song.id}
                        onSelect={() =>
                          onUpdate({
                            selectedSongId:
                              selection.selectedSongId === song.id
                                ? undefined
                                : song.id,
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom song */}
              {hasSongs && (
                <div>
                  <button
                    onClick={() => setShowCustom((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <span>{showCustom ? "▲" : "▼"}</span>
                    Kendi şarkımı ekle
                  </button>

                  <AnimatePresence>
                    {showCustom && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-2">
                          <input
                            type="text"
                            placeholder="Şarkı adı"
                            value={selection.customSong?.name ?? ""}
                            onChange={(e) =>
                              onUpdate({
                                customSong: {
                                  ...selection.customSong,
                                  name: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                          />
                          <input
                            type="url"
                            placeholder="Spotify URL"
                            value={selection.customSong?.spotifyUrl ?? ""}
                            onChange={(e) =>
                              onUpdate({
                                customSong: {
                                  ...selection.customSong,
                                  spotifyUrl: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                          />
                          <input
                            type="url"
                            placeholder="YouTube URL"
                            value={selection.customSong?.youtubeUrl ?? ""}
                            onChange={(e) =>
                              onUpdate({
                                customSong: {
                                  ...selection.customSong,
                                  youtubeUrl: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const defaultSelection = (): MomentSelection => ({
  important: false,
  moods: [],
  musicPref: "",
  energy: "",
  selectedSongId: undefined,
  customSong: undefined,
});

export default function StepMoments({ data, update, onNext }: Props) {
  const moments = getMomentsForEventType(data.eventType);

  const [selections, setSelections] = useState<Record<string, MomentSelection>>(
    () => {
      const init: Record<string, MomentSelection> = {};
      moments.forEach((m) => {
        init[m.id] = data.momentSelections?.[m.id] ?? defaultSelection();
      });
      return init;
    }
  );

  const updateMoment = (momentId: string, partial: Partial<MomentSelection>) => {
    const next = { ...selections, [momentId]: { ...selections[momentId], ...partial } };
    setSelections(next);
    update({ momentSelections: next });
  };

  if (moments.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Bu etkinlik türü için önemli anlar henüz tanımlanmadı.
        </p>
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Devam
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground leading-relaxed -mt-2">
        Her an için müzik yönlendirmesi almak ister misin? Önemli olmayan anları atlayabilirsin.
      </p>

      <div className="space-y-3">
        {moments.map((moment) => (
          <MomentCard
            key={moment.id}
            moment={moment}
            selection={selections[moment.id] ?? defaultSelection()}
            onUpdate={(partial) => updateMoment(moment.id, partial)}
            hasSongs={moment.hasSongDatabase}
          />
        ))}
      </div>

      <div className="pt-2">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Devam
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

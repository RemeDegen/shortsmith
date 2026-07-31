import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, font, size, safeArea } from '../theme/tokens';
import type { Word } from '../types';

const MAX_WORDS = 4; // upper bound on words shown at once

export type Range = { start_ms: number; end_ms: number };

/**
 * Splits words into readable groups.
 *
 * A fixed 4-word window ignores sentence boundaries and produces piles like
 * "...you say. You probably didn't. Most" — two half sentences jammed together.
 * Breaking on terminal punctuation fixes it.
 */
const groupWords = (words: Word[]): Word[][] => {
  const groups: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    if (/[.!?:]$/.test(w.text) || cur.length >= MAX_WORDS) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  return groups;
};

/**
 * Karaoke captions — the spoken word fills with the accent colour.
 * Non-negotiable for short-form: most viewers watch with sound off.
 *
 * `hiddenRanges` blanks the captions for given time ranges. Useful when a scene
 * already shows the same text at display size and a caption would just compete.
 */
export const Captions: React.FC<{ words: Word[]; hiddenRanges?: Range[] }> = ({
  words,
  hiddenRanges = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ms = (frame / fps) * 1000;

  // Hooks must run in the same order every render — early return comes AFTER.
  const groups = React.useMemo(() => groupWords(words), [words]);

  if (hiddenRanges.some((r) => ms >= r.start_ms && ms < r.end_ms)) return null;

  // Hold the last group through pauses between sentences. Otherwise the screen
  // empties after every full stop and the eye loses its anchor.
  let gi = -1;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i][0].start_ms <= ms) gi = i;
  }
  if (gi === -1) return null;

  const group = groups[gi];
  const activeIndex = group.findIndex((w) => ms >= w.start_ms && ms < w.end_ms);

  return (
    <div
      style={{
        position: 'absolute',
        left: safeArea.left,
        right: safeArea.right,
        bottom: safeArea.bottom - 130,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '8px 14px',
      }}
    >
      {group.map((w, i) => {
        const isActive = i === activeIndex;
        return (
          <span
            key={`${w.text}-${i}`}
            style={{
              fontFamily: font.family,
              fontSize: size.caption,
              fontWeight: font.weightBold,
              letterSpacing: '-0.01em',
              color: isActive ? colors.accent : colors.fg,
              opacity: isActive ? 1 : 0.55,
              textShadow: '0 2px 12px rgba(0,0,0,0.75)',
              transform: isActive ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

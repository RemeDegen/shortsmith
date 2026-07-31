import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, font, size } from '../theme/tokens';

export type StampWordProps = {
  word: string;
  /** when true the background/text colours invert — a pattern interrupt */
  invert?: boolean;
};

/**
 * A single word, hard cut in. Scene bridge and attention reset —
 * the moment that re-hooks a viewer who was drifting.
 */
export const StampWord: React.FC<StampWordProps> = ({ word, invert = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pop = spring({
    frame,
    fps,
    config: { damping: 11, mass: 0.5, stiffness: 180 },
    durationInFrames: 14,
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: invert ? colors.bgInverted : colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontFamily: font.family,
          fontSize: size.hook * 1.5,
          fontWeight: font.weightBold,
          letterSpacing: '-0.03em',
          color: invert ? colors.accent : colors.accent,
          transform: `scale(${0.7 + pop * 0.3})`,
          opacity: Math.min(1, pop * 1.6),
        }}
      >
        {word}
      </span>
    </div>
  );
};

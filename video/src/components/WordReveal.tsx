import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, font, size, motion, safeArea, safeWidth } from '../theme/tokens';

const normalize = (w: string) =>
  w.toLocaleLowerCase('tr').replace(/[.,!?:;—–-]/g, '');

export type WordRevealProps = {
  text: string;
  /** Words rendered in the accent colour */
  emphasize?: string[];
  fontSize?: number;
  align?: 'left' | 'center';
  /** Delay between words, in frames */
  stagger?: number;
};

/**
 * Text that lands word by word. The workhorse for hook and takeaway scenes.
 * Each word rises on its own spring.
 */
export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  emphasize = [],
  fontSize = size.headline,
  align = 'left',
  stagger = motion.wordStagger,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accented = new Set(emphasize.map(normalize));

  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div
      style={{
        position: 'absolute',
        left: safeArea.left,
        top: safeArea.top,
        width: safeWidth,
        height: 1920 - safeArea.top - safeArea.bottom,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        gap: `${fontSize * 0.22}px ${fontSize * 0.28}px`,
      }}
    >
      {words.map((word, i) => {
        const enter = spring({
          frame: frame - i * stagger,
          fps,
          config: { damping: 14, mass: 0.6 },
          durationInFrames: motion.enter,
        });
        const isAccent = accented.has(normalize(word));

        return (
          <span
            key={`${word}-${i}`}
            style={{
              fontFamily: font.family,
              fontSize,
              fontWeight: font.weightBold,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              color: isAccent ? colors.accent : colors.fg,
              opacity: enter,
              transform: `translateY(${(1 - enter) * 34}px) scale(${0.94 + enter * 0.06})`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, font, size, safeArea, safeWidth } from '../theme/tokens';

export type GatherBlockProps = {
  /** Lines that appear one at a time */
  lines: string[];
  /** Tags shown inside the box once the lines have gathered */
  tags: string[];
  /** When the box starts drifting up and away (0-1, relative to the scene) */
  exitAt?: number;
  stagger?: number;
};

/**
 * The load-bearing motion:
 * lines appear one by one -> gather into a single block -> drift up and vanish.
 * That last move is the visual form of "all of it leaves at once";
 * the idea reads even with the sound off.
 */
export const GatherBlock: React.FC<GatherBlockProps> = ({
  lines,
  tags,
  exitAt = 0.78,
  stagger = 22,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const gatherStart = lines.length * stagger + 16;
  const exitStart = Math.round(durationInFrames * exitAt);

  const gather = spring({
    frame: frame - gatherStart,
    fps,
    config: { damping: 15, mass: 0.7 },
    durationInFrames: 18,
  });

  // Exit: drift upward and fade
  const exit = interpolate(frame, [exitStart, exitStart + 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const blockOpacity = (1 - exit) * (0.25 + gather * 0.75);
  const blockLift = exit * -520;

  return (
    <div
      style={{
        position: 'absolute',
        left: safeArea.left,
        top: safeArea.top,
        width: safeWidth,
        height: 1920 - safeArea.top - safeArea.bottom,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          transform: `translateY(${blockLift}px) scale(${1 - exit * 0.14})`,
          opacity: blockOpacity,
        }}
      >
        <div
          style={{
            border: `3px solid ${colors.accent}`,
            borderRadius: 28,
            padding: `${44 + (1 - gather) * 10}px 40px`,
            background: colors.accentSoft,
            // The border appears at the moment of gathering
            borderColor: `rgba(255,107,53,${gather})`,
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
          }}
        >
          {lines.map((line, i) => {
            const enter = spring({
              frame: frame - i * stagger,
              fps,
              config: { damping: 14, mass: 0.6 },
              durationInFrames: 13,
            });
            return (
              <span
                key={line}
                style={{
                  fontFamily: font.family,
                  fontSize: size.body,
                  fontWeight: font.weightBold,
                  color: colors.fg,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  opacity: enter,
                  transform: `translateY(${(1 - enter) * 26}px)`,
                }}
              >
                {line}
              </span>
            );
          })}

          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              marginTop: 12,
              opacity: gather,
              transform: `translateY(${(1 - gather) * 18}px)`,
            }}
          >
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: font.family,
                  fontSize: 34,
                  fontWeight: font.weightBold,
                  color: colors.accent,
                  letterSpacing: '0.04em',
                  border: `2px solid ${colors.accent}`,
                  borderRadius: 999,
                  padding: '10px 22px',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, font, size, safeArea, safeWidth } from '../theme/tokens';

export type ChipListProps = {
  label: string;
  items: string[];
  /** Closing line that appears after the items dim */
  footer?: string;
  /** Delay between items, in frames */
  stagger?: number;
};

/**
 * A label, items appearing in sequence, then a closing stamp.
 * The items dim as the footer lands — colour carries the "this doesn't matter" beat.
 */
export const ChipList: React.FC<ChipListProps> = ({
  label,
  items,
  footer,
  stagger = 14,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const footerStart = Math.max(
    items.length * stagger + 10,
    durationInFrames - 34
  );
  const footerEnter = spring({
    frame: frame - footerStart,
    fps,
    config: { damping: 13, mass: 0.6 },
    durationInFrames: 12,
  });

  // Items dim as the footer arrives
  const fade = interpolate(
    frame,
    [footerStart - 4, footerStart + 10],
    [1, 0.32],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

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
        gap: 30,
      }}
    >
      <span
        style={{
          fontFamily: font.family,
          fontSize: size.hook,
          fontWeight: font.weightBold,
          letterSpacing: '-0.03em',
          color: colors.muted,
          opacity: spring({ frame, fps, durationInFrames: 10, config: { damping: 14 } }),
          marginBottom: 18,
        }}
      >
        {label}
      </span>

      {items.map((item, i) => {
        const enter = spring({
          frame: frame - (i + 1) * stagger,
          fps,
          config: { damping: 14, mass: 0.6 },
          durationInFrames: 12,
        });
        return (
          <div
            key={item}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              opacity: enter * fade,
              transform: `translateX(${(1 - enter) * -30}px)`,
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                background: colors.muted,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: font.family,
                fontSize: size.chip,
                fontWeight: font.weightRegular,
                color: colors.fg,
                letterSpacing: '-0.01em',
              }}
            >
              {item}
            </span>
          </div>
        );
      })}

      {footer ? (
        <span
          style={{
            marginTop: 46,
            fontFamily: font.family,
            fontSize: size.body,
            fontWeight: font.weightBold,
            color: colors.accent,
            letterSpacing: '-0.02em',
            opacity: footerEnter,
            transform: `translateY(${(1 - footerEnter) * 24}px)`,
          }}
        >
          {footer}
        </span>
      ) : null}
    </div>
  );
};

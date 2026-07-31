import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, font, size, safeArea, safeWidth } from '../theme/tokens';

export type EndCardProps = {
  credit: string;
  handle?: string;
};

/**
 * Closing card — source credit. Optional: some channels put attribution in the
 * description instead, which costs no screen time.
 */
export const EndCard: React.FC<EndCardProps> = ({ credit, handle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.7 },
    durationInFrames: 14,
  });

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
        gap: 24,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 22}px)`,
      }}
    >
      <span
        style={{
          width: 96,
          height: 5,
          borderRadius: 3,
          background: colors.accent,
          marginBottom: 14,
        }}
      />
      <span
        style={{
          fontFamily: font.family,
          fontSize: size.credit,
          fontWeight: font.weightRegular,
          color: colors.muted,
          letterSpacing: '0.02em',
        }}
      >
        {credit}
      </span>
      {handle ? (
        <span
          style={{
            fontFamily: font.family,
            fontSize: size.headline,
            fontWeight: font.weightBold,
            color: colors.fg,
            letterSpacing: '-0.02em',
          }}
        >
          {handle}
        </span>
      ) : null}
    </div>
  );
};

import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors } from '../theme/tokens';

/**
 * The texture layer behind a scene.
 *
 * The plate is a STILL image generated locally with FLUX — it does not move.
 * Every bit of motion lives here, in code: Ken Burns, two-layer parallax,
 * grain and a vignette.
 *
 * That split is deliberate. Platforms penalise "unrelated AI clips stitched
 * together"; when the motion is your own code and the plate is only texture,
 * you are not producing that pattern. See docs/platform-policies.md.
 *
 * With no `src` a code-generated gradient stands in, so you can A/B whether the
 * plate is earning its place at all.
 */

const GRAIN = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">
     <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/></filter>
     <rect width="220" height="220" filter="url(#n)" opacity="0.5"/>
   </svg>`,
)}")`;

export type BackdropProps = {
  /** Path under video/public/. Omit to use the generated gradient instead. */
  src?: string;
  /** Ken Burns direction. Alternate between scenes; always the same reads as a template. */
  direction?: 'in' | 'out';
  /**
   * Overall visibility. A first guess of 15-25% turned out to be invisible in
   * practice — the generated plates are very dark. Measured working band: 0.35-0.50.
   */
  intensity?: number;
};

export const Backdrop: React.FC<BackdropProps> = ({
  src,
  direction = 'in',
  intensity = 0.45,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, Math.max(1, durationInFrames)], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Ken Burns: scale must stay above 1 or the edges expose the background.
  const scale = direction === 'in' ? 1.02 + p * 0.08 : 1.10 - p * 0.08;

  // Shifting the grain every frame breaks the "frozen" feel of a still image.
  const g = (frame * 7) % 220;

  const layer: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      {src ? (
        <>
          {/* back layer — slower, softer, wider */}
          <Img
            src={staticFile(src)}
            style={{
              ...layer,
              transform: `scale(${scale * 1.15}) translateX(${-p * 30}px)`,
              // Blur kept low on purpose: the plate has to stay RECOGNISABLE.
              // At 18px a server rack turned into an orange smear (measured).
              filter: 'blur(8px) saturate(0.8)',
              opacity: intensity * 1.1,
            }}
          />
          {/* front layer — faster, sharper: this is where the parallax comes from */}
          <Img
            src={staticFile(src)}
            style={{
              ...layer,
              transform: `scale(${scale}) translateX(${-p * 90}px)`,
              filter: 'blur(2px)',
              opacity: intensity * 0.75,
              mixBlendMode: 'screen',
            }}
          />
        </>
      ) : (
        /* Control group with no plate: same motion over a generated gradient */
        <AbsoluteFill
          style={{
            transform: `scale(${scale * 1.2}) translateX(${-p * 60}px)`,
            opacity: intensity * 1.4,
            background: `radial-gradient(ellipse 70% 50% at 30% 35%, ${colors.accent} 0%, transparent 60%),
                         radial-gradient(ellipse 60% 45% at 75% 70%, #2A3A5A 0%, transparent 65%)`,
            filter: 'blur(40px)',
          }}
        />
      )}

      {/* grain */}
      <AbsoluteFill
        style={{
          backgroundImage: GRAIN,
          backgroundPosition: `${g}px ${g * 1.3}px`,
          opacity: 0.05,
          mixBlendMode: 'overlay',
        }}
      />

      {/* vignette — what guarantees the typography stays readable */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 22%, rgba(10,12,15,0.88) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

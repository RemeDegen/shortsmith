import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, font, safeArea, safeWidth } from '../theme/tokens';

const W = 860;   // safeWidth
const H = 1360;  // 1920 - safeArea.top - safeArea.bottom

export type BoundaryDiagramProps = {
  /** Where the box sits */
  placement: 'outside' | 'inside';
  /** Draw a link between the two regions */
  link?: boolean;
  /** Break the link 70% of the way through the scene */
  linkBreaks?: boolean;
  outerLabel?: string;
  innerLabel?: string;
  boxLabel?: string;
};

/**
 * The SAME box shown in two different places.
 *
 *   placement="outside" → the box lives in someone else's region
 *   placement="inside"  → the box lives inside your boundary, no link needed
 *
 * Built for arguments about ownership, dependency and control, where the whole
 * point is the difference between two otherwise identical frames.
 *
 * Rendered as SVG so the strokes stay crisp at any scale.
 */
export const BoundaryDiagram: React.FC<BoundaryDiagramProps> = ({
  placement,
  link = false,
  linkBreaks = false,
  outerLabel = 'THEIR INFRASTRUCTURE',
  innerLabel = 'YOUR INFRASTRUCTURE',
  boxLabel = 'MODEL',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const p = frame / Math.max(1, durationInFrames);

  const isOutside = placement === 'outside';

  const outer = { x: 40, y: 20, w: W - 80, h: 430 };
  const inner = { x: 40, y: 760, w: W - 80, h: 470 };

  const box = { w: 340, h: 170 };
  const host = isOutside ? outer : inner;
  const boxX = host.x + (host.w - box.w) / 2;
  const boxY = host.y + (host.h - box.h) / 2;

  const enter = spring({ frame, fps, config: { damping: 15, mass: 0.7 }, durationInFrames: 16 });
  const boxPop = spring({ frame: frame - 8, fps, config: { damping: 12, mass: 0.6 }, durationInFrames: 16 });

  const broken = linkBreaks && p > 0.7;
  const dashShift = -(frame * 2) % 28;
  const linkOpacity = broken
    ? interpolate(p, [0.7, 0.78], [0.9, 0.12], { extrapolateRight: 'clamp' })
    : 0.9 * enter;

  const label = (text: string, x: number, y: number, color: string, opacity = 1) => (
    <text
      x={x} y={y} fill={color} opacity={opacity}
      fontFamily={font.family} fontSize={34} fontWeight={font.weightBold}
      letterSpacing="0.14em"
    >
      {text}
    </text>
  );

  return (
    <div style={{ position: 'absolute', left: safeArea.left, top: safeArea.top, width: safeWidth, height: H }}>
      <svg width={safeWidth} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Local scrim. Once the plate blur was lowered (for recognisability) the
            diagram's thin strokes started competing with the background. Rather
            than blurring the plate again, only the diagram area is darkened. */}
        <defs>
          <radialGradient id="scrim" cx="50%" cy="50%" r="62%">
            <stop offset="0%" stopColor={colors.bg} stopOpacity={0.78} />
            <stop offset="100%" stopColor={colors.bg} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect x={-60} y={-40} width={W + 120} height={H + 80} fill="url(#scrim)" />

        {/* Their region — dashed: a border you did not draw, and can lose */}
        <rect
          x={outer.x} y={outer.y} width={outer.w} height={outer.h} rx={28}
          fill="none" stroke={colors.muted} strokeWidth={3}
          strokeDasharray="14 12" opacity={0.55 * enter}
        />
        {label(outerLabel, outer.x + 26, outer.y + 52, colors.muted, 0.75 * enter)}

        {/* Your region — solid: permanent, under your control */}
        <rect
          x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={28}
          fill="none"
          // Must stay visible even when empty: showing that the box ISN'T here
          // is the whole point of the frame. A thin muted stroke disappeared
          // against a busy plate.
          stroke={isOutside ? colors.fg : colors.accent}
          strokeWidth={isOutside ? 4 : 5}
          opacity={isOutside ? 0.45 * enter : enter}
        />
        {label(innerLabel, inner.x + 26, inner.y + 52,
               isOutside ? colors.fg : colors.accent, (isOutside ? 0.6 : 1) * enter)}

        {/* The link only means anything while the box is outside */}
        {link && (
          <line
            x1={W / 2} y1={outer.y + outer.h}
            x2={W / 2} y2={inner.y}
            stroke={colors.muted} strokeWidth={3}
            strokeDasharray="10 18" strokeDashoffset={dashShift}
            opacity={linkOpacity}
          />
        )}

        <g opacity={boxPop} transform={`translate(${boxX} ${boxY}) scale(${0.92 + boxPop * 0.08})`}>
          <rect
            width={box.w} height={box.h} rx={20}
            fill={isOutside ? 'transparent' : colors.accentSoft}
            stroke={colors.accent} strokeWidth={5}
          />
          <text
            x={box.w / 2} y={box.h / 2 + 16} textAnchor="middle" fill={colors.fg}
            fontFamily={font.family} fontSize={52} fontWeight={font.weightBold}
            letterSpacing="0.06em"
          >
            {boxLabel}
          </text>
        </g>

        {/* The cut, at the moment the link breaks */}
        {broken && (
          <g opacity={interpolate(p, [0.7, 0.8], [0, 1], { extrapolateRight: 'clamp' })}>
            <line x1={W / 2 - 34} y1={(outer.y + outer.h + inner.y) / 2 - 34}
                  x2={W / 2 + 34} y2={(outer.y + outer.h + inner.y) / 2 + 34}
                  stroke={colors.accent} strokeWidth={7} strokeLinecap="round" />
            <line x1={W / 2 + 34} y1={(outer.y + outer.h + inner.y) / 2 - 34}
                  x2={W / 2 - 34} y2={(outer.y + outer.h + inner.y) / 2 + 34}
                  stroke={colors.accent} strokeWidth={7} strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};

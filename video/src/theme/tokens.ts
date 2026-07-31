/**
 * The channel's visual identity. Single source of truth — every component reads from here.
 * Changing this file changes every video.
 */

export const canvas = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * Safe area — the intersection of TikTok's action bar, the Reels caption zone and
 * the Shorts title area. Critical text must NEVER leave this rectangle.
 */
export const safeArea = {
  left: 80,
  right: 140, // narrower on the right: TikTok's action bar is 100-140px
  top: 260,
  bottom: 300,
} as const;

export const safeWidth = canvas.width - safeArea.left - safeArea.right;

export const colors = {
  bg: '#0A0C0F',
  bgInverted: '#F2F4F7',
  fg: '#EDEFF2',
  fgInverted: '#0A0C0F',
  muted: '#6B7280',
  accent: '#FF6B35',
  accentSoft: 'rgba(255, 107, 53, 0.14)',
} as const;

export const font = {
  family: '-apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif',
  weightBold: 800,
  weightRegular: 500,
} as const;

/** Type scale — legibility limits for vertical video at phone viewing distance */
export const size = {
  hook: 82,
  headline: 68,
  body: 52,
  chip: 46,
  caption: 40,
  credit: 34,
} as const;

/** Motion durations (in frames, at 30fps) */
export const motion = {
  enter: 12, // ~400ms enter animation
  exit: 10,
  wordStagger: 3, // default delay between words
  transition: 9, // ~300ms scene transition
} as const;

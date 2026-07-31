export type Word = {
  text: string;
  start_ms: number;
  end_ms: number;
};

export type SceneComponent =
  | 'WordReveal'
  | 'ChipList'
  | 'StampWord'
  | 'GatherBlock'
  | 'BoundaryDiagram'
  | 'EndCard';

/**
 * The plate behind a scene. The still image is generated locally with FLUX;
 * all of the motion is added in code. That split is deliberate —
 * see docs/visual-method.md.
 */
export type Backdrop = {
  /** Path under video/public/, e.g. "plates/my-short-hook.png" */
  src: string;
  /** Ken Burns direction. Alternate between scenes; always the same reads as a template. */
  direction?: 'in' | 'out';
  /** Visibility. Plates are already dark; 0.35-0.5 is the working band. */
  intensity?: number;
};

export type Scene = {
  id: string;
  role: string;
  component: SceneComponent;
  start_ms: number;
  end_ms: number;
  narration: string;
  backdrop?: Backdrop;
  /** false hides captions for this scene — useful when the text is already large on screen */
  captions?: boolean;
  props: Record<string, unknown>;
};

export type Plan = {
  slug: string;
  lang: string;
  source_credit: string;
  fps: number;
  audio: string;
  duration_ms: number;
  words: Word[];
  scenes: Scene[];
};

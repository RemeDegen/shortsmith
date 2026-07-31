import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { colors } from './theme/tokens';
import type { Plan, Scene } from './types';
import { WordReveal, type WordRevealProps } from './components/WordReveal';
import { ChipList, type ChipListProps } from './components/ChipList';
import { StampWord, type StampWordProps } from './components/StampWord';
import { GatherBlock, type GatherBlockProps } from './components/GatherBlock';
import { BoundaryDiagram, type BoundaryDiagramProps } from './components/BoundaryDiagram';
import { Backdrop } from './components/Backdrop';
import { EndCard, type EndCardProps } from './components/EndCard';
import { Captions } from './components/Captions';

const renderScene = (scene: Scene) => {
  switch (scene.component) {
    case 'WordReveal':
      return <WordReveal {...(scene.props as unknown as WordRevealProps)} />;
    case 'ChipList':
      return <ChipList {...(scene.props as unknown as ChipListProps)} />;
    case 'StampWord':
      return <StampWord {...(scene.props as unknown as StampWordProps)} />;
    case 'GatherBlock':
      return <GatherBlock {...(scene.props as unknown as GatherBlockProps)} />;
    case 'BoundaryDiagram':
      return <BoundaryDiagram {...(scene.props as unknown as BoundaryDiagramProps)} />;
    case 'EndCard':
      return <EndCard {...(scene.props as unknown as EndCardProps)} />;
    default:
      return null;
  }
};

/**
 * Turns a scene plan into a video.
 *
 * Nothing here is specific to any one script — change the plan, change the
 * video. Scene timing comes from real word timestamps, so the render always
 * matches the narration exactly.
 */
export const Short: React.FC<{ plan: Plan }> = ({ plan }) => {
  const { fps } = plan;
  const toFrames = (ms: number) => Math.round((ms / 1000) * fps);

  return (
    <AbsoluteFill style={{ background: colors.bg }}>
      <Audio src={staticFile(plan.audio)} />

      {plan.scenes.map((scene) => {
        const from = toFrames(scene.start_ms);
        const duration = Math.max(1, toFrames(scene.end_ms) - from);
        return (
          <Sequence key={scene.id} from={from} durationInFrames={duration} name={scene.id}>
            {scene.backdrop && (
              <Backdrop
                src={scene.backdrop.src}
                direction={scene.backdrop.direction}
                intensity={scene.backdrop.intensity}
              />
            )}
            {renderScene(scene)}
          </Sequence>
        );
      })}

      <Captions
        words={plan.words}
        hiddenRanges={plan.scenes
          .filter((s) => s.captions === false)
          .map((s) => ({ start_ms: s.start_ms, end_ms: s.end_ms }))}
      />
    </AbsoluteFill>
  );
};

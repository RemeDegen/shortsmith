import React from 'react';
import { Composition } from 'remotion';
import { Short } from './Short';
import { canvas } from './theme/tokens';
import plan from './plan.json';
import type { Plan } from './types';

const typedPlan = plan as Plan;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Short"
      component={Short}
      durationInFrames={Math.ceil((typedPlan.duration_ms / 1000) * canvas.fps)}
      fps={canvas.fps}
      width={canvas.width}
      height={canvas.height}
      defaultProps={{ plan: typedPlan }}
    />
  );
};

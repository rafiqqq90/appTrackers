import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useThemeColors } from '../theme/useTheme';

interface ProgressRingProps {
  /** Progress ratio between 0 and 1 */
  progress: number;
  size?: number;
}

/**
 * Things 3 style dual-ring pie progress indicator:
 * An outer hairline ring + an inner sweeping pie wedge that fills cleanly as tasks complete.
 */
export function ProgressRing({ progress, size = 34 }: ProgressRingProps) {
  const { isDark } = useThemeColors();
  const clamped = Math.max(0, Math.min(1, progress));
  const center = size / 2;
  const outerRadius = center - 2;
  const pieRadius = (outerRadius - 2.5) / 2;
  const circumference = 2 * Math.PI * pieRadius;
  const strokeDashoffset = circumference * (1 - clamped);

  const ringStroke = isDark ? '#2E2E36' : '#D4D4D8';
  const fillStroke = '#10B981';

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={ringStroke}
          strokeWidth={1.5}
        />
        {clamped > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={pieRadius}
            fill="none"
            stroke={fillStroke}
            strokeWidth={pieRadius * 2}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            rotation={-90}
            originX={center}
            originY={center}
          />
        ) : null}
      </Svg>
    </View>
  );
}

/** Provides the decorative line icons used by the interface. */

import { type ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const VIEW_BOX = '0 0 24 24';

const STROKE_WIDTH = 1.8;

export interface IconProps {
  readonly color: string;

  readonly size: number;
}

interface IconFrameProps extends IconProps {
  readonly children: ReactNode;
}

function IconFrame({ color, size, children }: IconFrameProps) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg
        width={size}
        height={size}
        viewBox={VIEW_BOX}
        fill="none"
        stroke={color}
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </Svg>
    </View>
  );
}

const COG_TOOTH_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export function SettingsIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      {COG_TOOTH_ANGLES.map((angle) => (
        <Line key={angle} x1={12} y1={2.4} x2={12} y2={5.4} transform={`rotate(${angle} 12 12)`} />
      ))}
      <Circle cx={12} cy={12} r={6.4} />
      <Circle cx={12} cy={12} r={2.5} />
    </IconFrame>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Rect x={3.2} y={5} width={17.6} height={15.8} rx={3} />
      <Line x1={3.2} y1={9.6} x2={20.8} y2={9.6} />
      <Line x1={8} y1={2.8} x2={8} y2={6} />
      <Line x1={16} y1={2.8} x2={16} y2={6} />
      <Circle cx={12} cy={14.8} r={1.2} fill={props.color} stroke="none" />
    </IconFrame>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Line x1={12} y1={11.2} x2={12} y2={16.6} />
      <Circle cx={12} cy={7.7} r={1.2} fill={props.color} stroke="none" />
    </IconFrame>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Line x1={12} y1={5} x2={12} y2={19} />
      <Line x1={5} y1={12} x2={19} y2={12} />
    </IconFrame>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Line x1={6} y1={6} x2={18} y2={18} />
      <Line x1={18} y1={6} x2={6} y2={18} />
    </IconFrame>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4.5 12.5 L9.5 17.5 L19.5 6.5" />
    </IconFrame>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M6.5 9 L12 14.5 L17.5 9" />
    </IconFrame>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <Path d="M4.5 7 H19.5 M9 7 V4.5 H15 V7 M7 7 L8 20 H16 L17 7 M10 10.5 V16.5 M14 10.5 V16.5" />
    </IconFrame>
  );
}

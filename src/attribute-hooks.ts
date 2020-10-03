import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { useTheme, resolveLengthUnit } from './theme';

export const useLengthAttribute = (margin: string): [number, number, number, number] => {
  const theme = useTheme();
  const windowDimensions = useWindowDimensions();
  return useMemo(() => {
    const parsedMargin = margin.replace(/\s\s+/g, ' ').split(' ');
    const pixelValues = parsedMargin.map((str: string) =>
      resolveLengthUnit(str, theme, windowDimensions)
    );
    return [0, 1, 2, 3].map((i) =>
      pixelValues[i] !== undefined
        ? pixelValues[i]
        : pixelValues[i - 2] !== undefined
        ? pixelValues[i - 2]
        : pixelValues[0] || 0
    ) as [number, number, number, number];
  }, [margin, theme, windowDimensions]);
};

export const useColorAttribute = (color: string): string => {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore cannot add colors to ThemeInterface because we don't want to restrict it
  const colors = theme.colors as Record<string, string>;
  return color in colors
    ? colors[color]
    : color && color.substring(1) in colors
    ? colors[color.substring(1)]
    : color;
};

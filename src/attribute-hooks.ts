import { useMemo } from 'react';

import { useTheme } from './theme';
import { useWindowDimensions } from 'window-dimensions';

export const useLengthAttribute = (margin: string): [number, number, number, number] => {
  const theme = useTheme();
  const windowDimensions = useWindowDimensions();
  return useMemo(() => {
    const parsedMargin = margin.replace(/\s\s+/g, ' ').split(' ');
    const pixelValues = parsedMargin.map((str: string) => {
      if (!str || typeof str === 'number') return str;
      if (typeof str !== 'string') throw new Error(`expected ${str} to be a string`);
      const value = Number.parseFloat(str);
      if (value === 0) return 0;
      const unit = str.trim().replace(String(value), '');
      if (!unit) throw new Error(`length string '${str}' contains no unit`);
      switch (unit) {
        case 'rem':
          return value * theme.rem;
        case 'px':
          return value;
        case 'vw':
          if (!windowDimensions) throw new Error('pass windowDimensions as the 3rd argument');
          return (value * windowDimensions.width) / 100;
        case 'vh':
          if (!windowDimensions) throw new Error('pass windowDimensions as the 3rd argument');
          return (value * windowDimensions.height) / 100;
        default:
          throw new Error(`cannot parse length string '${str}', unknown unit '${unit}'`);
      }
    });
    return [0, 1, 2, 3].map((i) =>
      pixelValues[i] !== undefined
        ? pixelValues[i]
        : pixelValues[i - 2] !== undefined
        ? pixelValues[i - 2]
        : pixelValues[0] || 0
    ) as [number, number, number, number];
  }, [margin, theme.rem, windowDimensions]);
};

export const useColorAttribute = (color: string): string => {
  const theme = useTheme();
  return color in theme.colors
    ? theme.colors[color]
    : color && color.substring(1) in theme.colors
    ? theme.colors[color.substring(1)]
    : color;
};

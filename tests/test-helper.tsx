import React from 'react';
import TestRenderer from 'react-test-renderer';
import { ThemeProvider } from '../src';

import type { ReactNode } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';
import type { Theme } from '../src';

declare module '../src' {
  export interface Theme {
    rem: number;
    colors: {
      accent: string;
      background: string;
      text: string;
    };
    elevation: (
      value: number
    ) => {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowRadius: number;
      shadowOpacity: number;
      elevation: number;
      zIndex: number;
    };
    borderRadius: [string, string, string];
  }
}

export const theme: Theme = {
  rem: 8,
  colors: {
    accent: '#11C5D9',
    background: '#141417',
    text: '#D2D2D6',
  },
  elevation: (value: number) => ({
    shadowColor: 'black',
    shadowOffset: { width: 0, height: value },
    shadowRadius: value * 2.5,
    shadowOpacity: 0.3,
    elevation: value,
    zIndex: value,
  }),
  borderRadius: ['0.5rem', '1rem', '2rem'],
  // media: { desktop: '(min-width: 1281px)' },
};

export const render = (children: ReactNode): ReactTestRenderer =>
  TestRenderer.create(<ThemeProvider theme={theme}>{children}</ThemeProvider>);

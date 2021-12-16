import React from 'react';
import { create, act } from 'react-test-renderer';
import { ThemeProvider } from '../src';

import type { ReactNode } from 'react';
import type { Theme } from '../src';

declare module '../src' {
  export interface Theme {
    rem: number;
    colors: {
      accent: string;
      background: string;
      text: string;
    };
    elevation: (value: number) => {
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
};

export const render = (children: ReactNode): void => {
  act(() => {
    create(<ThemeProvider theme={theme}>{children}</ThemeProvider>);
  });
};

export const sleep = (duration: number): void => {
  act(() => {
    jest.advanceTimersByTime(duration);
  });
};

/**
 * Helps prevent error logs blowing up as a result of expecting an error to be thrown,
 * when using a library (such as enzyme)
 *
 * @param func Function that you would normally pass to `expect(func).toThrow()`
 */
export const expectToThrow = (func: () => unknown, error?: JestToErrorArg): void => {
  // Even though the error is caught, it still gets printed to the console
  // so we mock that out to avoid the wall of red text.
  const spy = jest.spyOn(console, 'error');
  spy.mockImplementation(() => {});

  expect(func).toThrow(error);

  spy.mockRestore();
};

type JestToErrorArg = Parameters<jest.Matchers<unknown, () => unknown>['toThrow']>[0];

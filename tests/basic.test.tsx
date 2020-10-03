import React from 'react';
import { View, ScrollView, useWindowDimensions } from 'react-native';

import styled from '../src';
import { render, theme } from './test-helper';

describe.only('basic styles', () => {
  beforeEach(() => {
    ((View as unknown) as jest.Mock).mockClear();
    ((ScrollView as unknown) as jest.Mock).mockClear();
    (useWindowDimensions as jest.Mock).mockClear();
  });

  it('genereates a style prop', () => {
    const StyledComponent = styled.View`
      color: red;
    `;
    render(<StyledComponent />);
    expect(View).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          color: 'red',
        },
      }),
      {}
    );
  });

  it('resolves theme variables', () => {
    const StyledComponent = styled.View`
      color: $text;
      height: 3rem;
      elevation: 2;
    `;
    render(<StyledComponent />);
    expect(View).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          color: theme.colors.text,
          height: 3 * theme.rem,
          ...theme.elevation(2),
        },
      }),
      {}
    );
  });

  it('can interpolate props', () => {
    const StyledComponent = styled.View<{ active?: boolean }>`
      color: ${(p) => (p.active ? '$accent' : '$text')};
    `;
    render(<StyledComponent />);
    expect(View).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          color: theme.colors.text,
        },
      }),
      {}
    );
    render(<StyledComponent active />);
    expect(View).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          color: theme.colors.accent,
        },
      }),
      {}
    );
  });

  it('does support nested style props', () => {
    const StyledComponent = styled.ScrollView`
      background-color: $background;
      contentContainer {
        width: 500px;
      }
    `;
    render(<StyledComponent />);
    expect(ScrollView).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          backgroundColor: theme.colors.background,
        },
        contentContainerStyle: {
          width: 500,
        },
      }),
      {}
    );
  });

  it('does support viewport units', () => {
    const StyledComponent = styled.View`
      width: 87vw;
      height: 23vh;
    `;
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 1, height: 1 });
    render(<StyledComponent />);
    expect(View).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          width: 0.87,
          height: 0.23,
        },
      }),
      {}
    );
  });
});

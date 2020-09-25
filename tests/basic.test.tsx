import React from 'react';
import { View, ScrollView, Text } from 'react-native';

import styled from '../src';
import { render, theme } from './test-helper';

describe.only('can genereate basic styles', () => {
  beforeEach(() => {
    ((View as unknown) as jest.Mock).mockClear();
  });

  it('genereates a style prop', () => {
    const StyledComponent = styled.View`
      color: red;
    `;
    render(<StyledComponent />, theme);
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
    render(<StyledComponent />, theme);
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
    render(<StyledComponent />, theme);
    expect(View).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          color: theme.colors.text,
        },
      }),
      {}
    );
    render(<StyledComponent active />, theme);
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
    render(<StyledComponent />, theme);
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
});

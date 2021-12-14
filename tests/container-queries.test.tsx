import React from 'react';
import { ScrollView, Text } from 'react-native';

import styled from '../src';
import { render, sleep, theme } from './test-helper';

describe('media queries', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    (ScrollView as unknown as jest.Mock).mockClear();
    (Text as unknown as jest.Mock).mockClear();
  });

  const StyledContainer = styled.View<{ width: number }>`
    container: layout;
    width: ${(p) => p.width}px;
  `;

  it('supports basic container queries', () => {
    const StyledComponent = styled.Text`
      font-size: 2rem;
      @container (max-width: 800px) {
        font-size: 1.5rem;
      }
    `;

    render(
      <StyledContainer width={1000}>
        <StyledComponent />
      </StyledContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );

    render(
      <StyledContainer width={400}>
        <StyledComponent />
      </StyledContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem } }),
      {}
    );
  });
});

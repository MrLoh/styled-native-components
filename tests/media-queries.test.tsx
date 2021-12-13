import React from 'react';
import { ScrollView, Text } from 'react-native';

import styled, { useWindowDimensions } from '../src';
import { createNestedStyleObject } from '../src/make-styles';
import { render, theme } from './test-helper';

jest.mock('../src/window-dimensions.ts');

describe.only('media queries', () => {
  beforeEach(() => {
    (ScrollView as unknown as jest.Mock).mockClear();
    (Text as unknown as jest.Mock).mockClear();
    (useWindowDimensions as jest.Mock).mockClear();
  });

  it('can parse nested css', () => {
    const nestedStyleObject = createNestedStyleObject(`
      width: 200px;
      @media (min-width: 200px) {
        width: 180px;
      }
    `);
    expect(Object.keys(nestedStyleObject.style)).toContain('main');
    expect(nestedStyleObject.style.main).toEqual({ width: 200 });
    expect(Object.keys(nestedStyleObject.style)).toContain('@media (min-width: 200px)');
    expect(nestedStyleObject.style['@media (min-width: 200px)']).toEqual({ width: 180 });
  });

  it('can parse deeply nested css', () => {
    const nestedStyleObject = createNestedStyleObject(`
      width: 200px;
      @media (min-width: 200px) {
        width: 180px;
      }
      contentContainer {
        width: 180px;
        @media (min-width: 180px) {
          width: 160px;
        }
      }
    `);
    expect(Object.keys(nestedStyleObject)).toContain('style');
    expect(Object.keys(nestedStyleObject.style)).toContain('main');
    expect(nestedStyleObject.style.main).toEqual({ width: 200 });
    expect(Object.keys(nestedStyleObject.style)).toContain('@media (min-width: 200px)');
    expect(nestedStyleObject.style['@media (min-width: 200px)']).toEqual({ width: 180 });
    expect(Object.keys(nestedStyleObject)).toContain('contentContainerStyle');
    expect(Object.keys(nestedStyleObject.contentContainerStyle)).toContain('main');
    expect(nestedStyleObject.contentContainerStyle.main).toEqual({ width: 180 });
    expect(Object.keys(nestedStyleObject.contentContainerStyle)).toContain(
      '@media (min-width: 180px)'
    );
    expect(nestedStyleObject.contentContainerStyle['@media (min-width: 180px)']).toEqual({
      width: 160,
    });
  });

  it('does support basic media queries', () => {
    const StyledComponent = styled.Text`
      font-size: 2rem;
      @media (max-width: 900px) {
        font-size: 1.5rem;
      }
    `;
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 1000, height: 1000 });
    render(<StyledComponent />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 300, height: 600 });
    render(<StyledComponent />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem } }),
      {}
    );
  });

  it('does support rem unit in media queries', () => {
    const StyledComponent = styled.Text`
      font-size: 2rem;
      @media (max-height: 100rem) {
        font-size: 1.5rem;
      }
    `;
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 1000, height: 1000 });
    render(<StyledComponent />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 300, height: 600 });
    render(<StyledComponent />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem } }),
      {}
    );
  });

  it('does support and connected media queries', () => {
    const StyledComponent = styled.Text`
      @media (max-width: 500px) {
        font-size: 1rem;
      }
      @media (min-width: 501px) and (max-width: 900px) {
        font-size: 1.5rem;
      }
      @media (min-width: 901px) {
        font-size: 2rem;
      }
    `;
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 300, height: 600 });
    render(<StyledComponent />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1 * theme.rem } }),
      {}
    );
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 600, height: 1000 });
    render(<StyledComponent />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem } }),
      {}
    );
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 1200, height: 600 });
    render(<StyledComponent />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );
  });
});

import { createNestedStyleObject } from '../src/make-styles';
import React from 'react';
import { Text } from 'react-native';

import styled, { useWindowDimensions } from '../src';
import { expectToThrow, render, sleep, theme } from './test-helper';

jest.mock('../src/window-dimensions.ts');
describe('container queries', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  beforeEach(() => {
    (Text as unknown as jest.Mock).mockClear();
    (useWindowDimensions as jest.Mock).mockClear();
  });

  const StyledContainer = styled.View`
    container: layout;
    width: 100px;
  `;

  const StyledFunctionContainer = styled.View<{ width: number; height?: number }>`
    container: layout;
    width: ${(p) => p.width}px;
    height: ${(p) => p.height || 20}px;
  `;

  it('can parse nested css', () => {
    const nestedStyleObject = createNestedStyleObject(`
      height: 200px;
      @container (max-height: 200px) {
        height: 180px;
      }
    `);
    expect(Object.keys(nestedStyleObject.style)).toContain('main');
    expect(nestedStyleObject.style.main).toEqual({ height: 200 });
    expect(Object.keys(nestedStyleObject.style)).toContain('@container (max-height: 200px)');
    expect(nestedStyleObject.style['@container (max-height: 200px)']).toEqual({ height: 180 });
  });

  it('can parse deeply nested css', () => {
    const nestedStyleObject = createNestedStyleObject(`
      width: 200px;
      @container (min-width: 200px) {
        width: 180px;
      }
      contentContainer {
        width: 180px;
        @container (min-height: 180px) {
          width: 160px;
        }
      }
    `);
    expect(Object.keys(nestedStyleObject)).toContain('style');
    expect(Object.keys(nestedStyleObject.style)).toContain('main');
    expect(nestedStyleObject.style.main).toEqual({ width: 200 });
    expect(Object.keys(nestedStyleObject.style)).toContain('@container (min-width: 200px)');
    expect(nestedStyleObject.style['@container (min-width: 200px)']).toEqual({ width: 180 });
    expect(Object.keys(nestedStyleObject)).toContain('contentContainerStyle');
    expect(Object.keys(nestedStyleObject.contentContainerStyle)).toContain('main');
    expect(nestedStyleObject.contentContainerStyle.main).toEqual({ width: 180 });
    expect(Object.keys(nestedStyleObject.contentContainerStyle)).toContain(
      '@container (min-height: 180px)'
    );
    expect(nestedStyleObject.contentContainerStyle['@container (min-height: 180px)']).toEqual({
      width: 160,
    });
  });

  it('supports basic container queries', () => {
    const StyledComponent = styled.Text`
      font-size: 2rem;
      @container (max-width: 800px) {
        font-size: 1.5rem;
      }
    `;

    render(
      <StyledFunctionContainer width={1000}>
        <StyledComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );

    render(
      <StyledFunctionContainer width={400}>
        <StyledComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem } }),
      {}
    );
  });

  it('does not render the query without a defined container', () => {
    const StyledNotContainer = styled.View<{ width: number }>`
      width: ${(p) => p.width}px;
    `;

    const StyledComponent = styled.Text`
      font-size: 2rem;
      @container (max-width: 800px) {
        font-size: 1.5rem;
      }
    `;

    render(
      <StyledNotContainer width={1000}>
        <StyledComponent />
      </StyledNotContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );

    render(
      <StyledNotContainer width={500}>
        <StyledComponent />
      </StyledNotContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );
  });

  it('does render with function parameters in the contained element', () => {
    const StyledComponent = styled.Text<{ width: number }>`
      width: ${(p) => p.width}px;
      font-size: 2rem;
      @container (min-height: 800px) {
        font-size: 1.5rem;
      }
    `;

    render(
      <StyledFunctionContainer width={1000} height={500}>
        <StyledComponent width={100} />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem, width: 100 } }),
      {}
    );

    render(
      <StyledFunctionContainer width={1000} height={1000}>
        <StyledComponent width={100} />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem, width: 100 } }),
      {}
    );
  });

  it('supports container and media queries', () => {
    const StyledMediaComponent = styled.Text`
      font-size: 2rem;
      @media (max-width: 800px) {
        font-size: 1.5rem;
      }
      color: red;
      @container (max-width: 800px) {
        color: green;
      }
    `;

    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1000, height: 1000 });
    render(
      <StyledFunctionContainer width={1000}>
        <StyledMediaComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem, color: 'red' } }),
      {}
    );

    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1000, height: 1000 });
    render(
      <StyledFunctionContainer width={500}>
        <StyledMediaComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem, color: 'green' } }),
      {}
    );

    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 500, height: 1000 });
    render(
      <StyledFunctionContainer width={1000}>
        <StyledMediaComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem, color: 'red' } }),
      {}
    );

    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 500, height: 1000 });
    render(
      <StyledFunctionContainer width={500}>
        <StyledMediaComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem, color: 'green' } }),
      {}
    );
  });

  it('supports rem unit in container queries', () => {
    const StyledComponent = styled.Text`
      font-size: 2rem;
      @container (max-width: 100rem) {
        font-size: 1.5rem;
      }
    `;

    render(
      <StyledFunctionContainer width={1000}>
        <StyledComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );

    render(
      <StyledContainer>
        <StyledComponent />
      </StyledContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem } }),
      {}
    );
  });

  it('supports connected container queries', () => {
    const StyledComponent = styled.Text`
      @container (max-width: 500px) {
        font-size: 1rem;
      }
      @container (min-width: 501px) and (max-width: 900px) {
        font-size: 1.5rem;
      }
      @container (min-width: 901px) {
        font-size: 2rem;
      }
    `;

    render(
      <StyledFunctionContainer width={1200}>
        <StyledComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 2 * theme.rem } }),
      {}
    );

    render(
      <StyledFunctionContainer width={600}>
        <StyledComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1.5 * theme.rem } }),
      {}
    );

    render(
      <StyledFunctionContainer width={300}>
        <StyledComponent />
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { fontSize: 1 * theme.rem } }),
      {}
    );
  });

  it('supports nested container queries and containers', () => {
    const StyledComponent = styled.Text<{ width: number }>`
      width: ${(p) => p.width}px;
      font-size: 2rem;
      container: inline-size;
      @container (max-width: 800px) {
        font-size: 1.5rem;
      }
    `;
    const StyledInnerComponent = styled.Text`
      width: 50px;
      color: red;
      @container (max-width: 800px) {
        color: blue;
      }
    `;

    //testing the innerComponent values would mean accessing the children for styledComponent
    render(
      <StyledFunctionContainer width={1000}>
        <StyledComponent width={1000}>
          <StyledInnerComponent />
        </StyledComponent>
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenCalledWith(
      expect.objectContaining({
        style: { container: 'inline-size', fontSize: 2 * theme.rem, width: 50 },
      }),
      {}
    );

    render(
      <StyledFunctionContainer width={1000}>
        <StyledComponent width={100}>
          <StyledInnerComponent />
        </StyledComponent>
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenCalledWith(
      expect.objectContaining({
        style: { container: 'inline-size', fontSize: 2 * theme.rem, width: 100 },
      }),
      {}
    );

    render(
      <StyledFunctionContainer width={100}>
        <StyledComponent width={1000}>
          <StyledInnerComponent />
        </StyledComponent>
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenCalledWith(
      expect.objectContaining({
        style: { container: 'inline-size', fontSize: 1.5 * theme.rem, width: 1000 },
      }),
      {}
    );

    render(
      <StyledFunctionContainer width={100}>
        <StyledComponent width={100}>
          <StyledInnerComponent />
        </StyledComponent>
      </StyledFunctionContainer>
    );
    sleep(1000);
    expect(Text).toHaveBeenCalledWith(
      expect.objectContaining({
        style: { container: 'inline-size', fontSize: 1.5 * theme.rem, width: 100 },
      }),
      {}
    );
  });

  //test passes, but does not clean up other errors
  it('does not support named containers', () => {
    const StyledContainerWithName = styled.View`
      container-name: sidebar;
    `;
    expectToThrow(() => {
      render(<StyledContainerWithName />);
    }, 'Container-name is not currently supported by styled-native-components');

    const StyledContainerWithNameAndProps = styled.View<{ active: boolean }>`
      container-name: sidebar;
      font-size: ${(p) => (p.active ? '2rem' : '1.5rem')};
    `;
    expectToThrow(() => {
      render(<StyledContainerWithNameAndProps active />);
    }, 'Container-name is not currently supported by styled-native-components');
  });
});

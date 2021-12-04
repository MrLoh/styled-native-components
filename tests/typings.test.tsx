import * as React from 'react';
import { expectType, expectError as expectTypeError } from 'tsd';
import { Text, TextInput } from 'react-native';

import type { ViewProps } from 'react-native';

import styled from '../src';

describe('typings', () => {
  const Simple = ({ required, optional }: { required: string; optional?: string }) => {
    return <Text>{required + optional}</Text>;
  };
  const WithRef = React.forwardRef<TextInput, { required: string; optional?: string }>(
    ({ required, optional }, ref) => {
      return <TextInput ref={ref} placeholder={required + optional} />;
    }
  );

  it('passes through component types', () => {
    const StyledComponent = styled.View`
      background-color: white;
    `;
    expectType<React.ComponentType<ViewProps>>(StyledComponent);
  });

  it('supports components with generics', () => {
    const StyledFlatList = styled.FlatList`
      background-color: white;
    `;
    expect(
      <StyledFlatList
        data={['a', 'b', 'c']}
        renderItem={({ item }: { item: string }) => <Text>{item}</Text>}
        keyExtractor={(item: string) => item}
      />
    ).toBeTruthy();
  });

  it('can add required props', () => {
    const Styled = styled(Simple)<{ elevation: number }>`
      elevation: ${(p) => p.elevation};
    `;
    // @ts-expect-error
    expectTypeError(<Styled elevation={1} />);
    // @ts-expect-error
    expectTypeError(<Styled required="ho" />);
    expect(<Styled elevation={1} required="foo" />).toBeTruthy();
    expect(<Styled elevation={1} required="foo" optional="bar" />).toBeTruthy();
  });

  it('works for attrs', () => {
    // satisfies required prop of the wrapped component and declares elevation dependency
    const StyledAttrs = styled(Simple).attrs<{ elevation: number }, { required: string }>({
      required: 'hi',
    })`
      elevation: ${(p) => p.elevation};
    `;
    // @ts-expect-error
    expectTypeError(<StyledAttrs />);
    // @ts-expect-error
    expectTypeError(<StyledAttrs elevation={1} required="foo" />);
    expect(<StyledAttrs elevation={1} />).toBeTruthy();
    expect(<StyledAttrs elevation={1} optional="bar" />).toBeTruthy();
  });

  it('works for refs', () => {
    const StyledWithRef = styled(WithRef)<{ elevation: number }>`
      elevation: ${(p) => p.elevation};
    `;
    const inputRef = React.createRef<TextInput>();
    const textRef = React.createRef<Text>();
    const undefinedRef = React.createRef();
    // @ts-expect-error missing elevation prop
    expectTypeError(<StyledWithRef required="foo" />);
    // @ts-expect-error missing label prop
    expectTypeError(<StyledWithRef elevation={1} />);
    // @ts-expect-error wrong type for ref prop
    expectTypeError(<StyledWithRef elevation={1} required="foo" ref={textRef} />);
    // @ts-expect-error wrong type for ref prop
    expectTypeError(<StyledWithRef elevation={1} required="foo" ref={undefinedRef} />);
    expect(<StyledWithRef elevation={1} required="foo" />).toBeTruthy();
    expect(
      <StyledWithRef elevation={1} required="foo" optional="bar" ref={inputRef} />
    ).toBeTruthy();
  });
});

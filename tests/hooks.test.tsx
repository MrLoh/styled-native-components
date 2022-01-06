/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import React from 'react';
import { View, Text } from 'react-native';

import {
  useStyle,
  useTheme,
  useColorAttribute,
  useLengthAttribute,
  useWindowDimensions,
} from '../src';
import { render, theme } from './test-helper';

jest.mock('../src/window-dimensions.ts');

describe('hooks', () => {
  beforeEach(() => {
    (View as unknown as jest.Mock).mockClear();
    (Text as unknown as jest.Mock).mockClear();
    (useWindowDimensions as jest.Mock).mockClear();
  });

  it('has functional theme hook', () => {
    const Component = jest.fn(() => null) as React.ComponentType<{ styledTheme: unknown }>;
    const ComponentWithHook = () => {
      const styledTheme = useTheme();
      return <Component styledTheme={styledTheme}></Component>;
    };
    render(<ComponentWithHook />);
    expect(Component).toHaveBeenCalledWith(expect.objectContaining({ styledTheme: theme }), {});
  });

  it('has functional style hook', () => {
    const StyledComponent = () => {
      const style = useStyle(`
      color: $text;
			height: 3rem;
			width: 100vw
		`);
      return <View style={style}></View>;
    };
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 1, height: 1 });
    render(<StyledComponent />);
    expect(View).toHaveBeenCalledWith(
      expect.objectContaining({
        style: {
          color: theme.colors.text,
          height: 3 * theme.rem,
          width: 1,
        },
      }),
      {}
    );
  });

  it('has hook to resolve color variable', () => {
    const StyledComponent = ({ color }: { color: string }) => {
      return <Text style={{ color: useColorAttribute(color) }}></Text>;
    };
    render(<StyledComponent color="$text" />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { color: theme.colors.text } }),
      {}
    );
    render(<StyledComponent color="#123" />);
    expect(Text).toHaveBeenLastCalledWith(
      expect.objectContaining({ style: { color: '#123' } }),
      {}
    );
  });

  it('has hook to resolve length variables', () => {
    const StyledComponent = ({ margin }: { margin: string }) => {
      const [marginTop, marginRight, marginBottom, marginLeft] = useLengthAttribute(margin);
      return <View style={{ marginTop, marginRight, marginBottom, marginLeft }}></View>;
    };
    render(<StyledComponent margin="1rem" />);
    expect(View).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: {
          marginTop: theme.rem,
          marginRight: theme.rem,
          marginBottom: theme.rem,
          marginLeft: theme.rem,
        },
      }),
      {}
    );
    render(<StyledComponent margin="1rem 20px" />);
    expect(View).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: {
          marginTop: theme.rem,
          marginRight: 20,
          marginBottom: theme.rem,
          marginLeft: 20,
        },
      }),
      {}
    );
    (useWindowDimensions as jest.Mock).mockReturnValueOnce({ width: 100, height: 200 });
    render(<StyledComponent margin="10% 15vw 50vh" />);
    expect(View).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: {
          marginTop: '10%',
          marginRight: 15,
          marginBottom: 100,
          marginLeft: 15,
        },
      }),
      {}
    );
    render(<StyledComponent margin="1px 2px 3px 4px" />);
    expect(View).toHaveBeenLastCalledWith(
      expect.objectContaining({
        style: {
          marginTop: 1,
          marginRight: 2,
          marginBottom: 3,
          marginLeft: 4,
        },
      }),
      {}
    );
  });
});

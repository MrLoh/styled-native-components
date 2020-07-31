# styled-native-components

A [Styled Components](https://www.styled-components.com) alternative for React Native (Web), that supports color variables, rem, vh, vw, nested style definitions for `contentContainerStyle`, and web centric CSS concepts ported to React Native Web.

## Disclaimer

This library is mainly for internal use until release of `v1.0.0`, there might be breaking changes at any time. If you don't need backwards compatibility with Styled-Components, I'd recommend using [Cssta](https://jacobp100.github.io/cssta) instead.

## Documentation

#### Basics

The basic API is equivalent with Styled Components, but supports some CSS features like `rem` and viewport (`vw`, `vh`) units.

```js
import styled from 'styled-native-components';

const SimpleComponent = styled.Component`
  padding: 1rem 0;
  width: 80vw;
  elevation: 2;
`;

const CustomComponent = styled(Component)`
  padding: 1rem 0;
`;

const PropsBasedComponent = styled(Component)`
  padding: 1rem 0;
  background-color: ${(p) => (p.active ? '$accent' : '$background')};
`;

const ComponentWithAttributes = styled.selectionColor.attrs((p) => ({
  selectionColor: p.theme.colors.accent,
}))`
  color: $text;
`;

const NestedStyleComponent = styled.ScrollView`
  background-color: $background;
  contentContainer {
    padding: 1rem 2rem;
  }
`;
```

#### Theming

As seen above the library enables usage of `$` prefixed color variables in your CSS.

The color variables are provided as a color object through the theme context. Additionally a `rem` variable is supported (When running on web, the rem size will be handled like usual based on the root font size). You can also specify an elevation function that transforms an elevation value to shadow styles.

```js
import { ThemeProvider } from 'styled-native-components';

const App = () => {
  const theme = {
    rem: 8,
    colors: {
      accent: '#11C5D9',
      background: '#141417',
      text: '#D2D2D6',
    },
    elevation: (value) => ({
      shadowColor: 'black',
      shadowOffset: { width: 0, height: value },
      shadowRadius: value * 2.5,
      shadowOpacity: 0.3,
      elevation: value,
      zIndex: value,
    }),
  };
  return (
    <ThemeProvider theme={theme}>
      <AppComponent />
    </ThemeProvider>
  );
};
```

You may also overwrite the theme context to use an existing styled components theme context:

```js
import { setThemeContext } from 'styled-native-components';
import { ThemeContext } from 'styled-components';

setThemeContext(ThemeContext);
```

#### Hooks

There are some hooks available:

```js
import {
  useStyle,
  useTheme,
  useWindowDimensions,
  useLengthAttribute,
  useColorAttribute,
} from 'styled-native-components';

const Component = ({ children, margin = '2rem 20px 1vh' }) => {
  const style = useStyle(/*css*/ `
    color: $accent;
  `);
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const pixelMargins = useLengthAttribute(margin); // [2*theme.rem, 20, windowWidth/100, 20 ]
  const selectionColor = useColorAttribute('$selection');
  return (
    <Text
      selectionColor={selectionColor}
      style={[style, { marginRight: theme.rem }]}
      numberOfLines={windowWidth < 400 ? 2 : 1}
    >
      {children}
    </Text>
  );
};
```

And you can use the ThemeContext directly:

```js
import { ThemeContext } from 'styled-native-components';

class Component extends React.Component {
  static contextType = ThemeContext;

  render = () => {
    return <Text selectionColor={this.context.colors.accent}>{this.props.children}</Text>;
  };
}
```

#### Typescript

The library is fully typed. You can set the Theme Context by redeclaring the `DefaultTheme` interface of this library the same way you would do for the original styled components library. Your default theme should implement the following interfact:

```ts
interface ThemeInterface {
  rem: number;
  colors: { [key: string]: string };
  elevation: (value: number) => Style;
}
```

All you do is to put something like this where you define your theme.

```tsx
import { ThemeProvider } from 'styled-native-components';
import type { DefaultTheme } from 'styled-native-components';

declare module 'styled-native-components' {
  export interface DefaultTheme {
    rem: number;
    colors: {
      accent: string;
      background: string;
      text: string;
    };
    elevation: (value: number) => Style;
    darkMode?: boolean;
  }
}

const App = () => {
  const darkMode = useDarMode();
  const theme: DefaultTheme = {
    rem: 8,
    colors: {
      accent: 'seagreen',
      background: darkMode ? '#222' : 'white',
      text: darkMode ? 'white' : 'black',
    },
    elevation: (value) => ({
      shadowColor: 'black',
      shadowOffset: { width: 0, height: value },
      shadowRadius: value * 2.5,
      shadowOpacity: darkMode ? 0.8 : 0.3,
      elevation: value,
      zIndex: value,
    }),
    darkMode,
  };
  return (
    <ThemeProvider theme={theme}>
      <AppComponent />
    </ThemeProvider>
  );
};
```

When you then declare components, you can define the props that may be passed to them explicitly:

```tsx
const Wrapper = styled.View<{ margin: string }>`
  margin: ${(p) => p.margin};
  padding: 2rem;
  elevation: 2;
  background-color: $background;
`;

const MyComponent = ({
  margin = '1rem',
  children,
}: {
  margin?: string;
  children: React.ReactNode;
}) => {
  return <Wrapper margin={margin}>{children}</Wrapper>;
};
```

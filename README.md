# styled-native-components

A [Styled Components](https://www.styled-components.com) alternative for React Native (Web), that supports color variables, rem, vh, vw, media queries, nested style definitions for `contentContainerStyle`, and web centric CSS concepts ported to React Native Web.

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

const StyledComponentWithMediaQuery = styled.Text`
  font-size: 16px;
  @media (max-width: 500px) {
    font-size: 14px;
  }
`;
```

#### Theming

As seen above the library enables usage of `$` prefixed color variables in your CSS.

The color variables are provided as a color object through the theme context. Additionally a `rem` variable is supported (When running on web, the rem size will be handled like usual based on the root font size). You can also specify an elevation function that transforms an elevation value to shadow styles.

The `ThemeProvider` will automatically inject some global CSS to set the root font size for `rem` units, a background color and default fonts. You can override those values with the `rootFont` and `rootBackgroundColor` props. You can also inject additional global CSS with the `rootCss` property. By default CSS will be injected to disable outlines on input fields, to disable this pass `disableOutlines={false}`.

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
  useLengthAttribute,
  useColorAttribute,
} from 'styled-native-components';

const Component = ({ children, margin = '2rem 20px 1vh' }) => {
  const style = useStyle(/*css*/ `
    color: $accent;
  `);
  const theme = useTheme();
  const pixelMargins = useLengthAttribute(margin); // [2*theme.rem, 20, windowWidth/100, 20 ]
  const selectionColor = useColorAttribute('$selection');
  return (
    <Text selectionColor={selectionColor} style={[style, { marginRight: theme.rem }]}>
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

The library is fully typed. You can set the Theme Context by redeclaring the `Theme` interface of this library the same way you would do for the original styled components library. Your default theme should implement the following interfact:

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
import type { Theme } from 'styled-native-components';

declare module 'styled-native-components' {
  export interface Theme {
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
  const theme: Theme = {
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

When you then declare styled components, you can define additional props that may be passed to the styled component so that they become available in the template literal expressions. The props of the component that is being styled and the theme will automatically be available in template literal expressions. The `children` and `style` props are not available in styled expressions for internal performance reasons.

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

When using `.attrs<A, P>(attrObjectOrMaker)` you need to both declare the (return) value of the `attrObjectOrMaker` (first generic `A`) and the custom props (second generic `P`) required by template literal expressions. Typescript cannot infer only one of them and the extra props for template literal expressions cannot be infered.

```tsx
// component with a required appearace prop
const ComponentBeingStyled: React.ComponentType<{ appearance: 'dark' | 'light'; style: ViewStyle }>;

const StyledWithAttrs = styled(ComponentBeingStyled).attrs<
  { appearance: 'dark' | 'light' },
  { margin: string }
>((p) => {
  appearance: p.theme.darkMode ? 'dark' : 'light';
})`
  margin: ${(p) => p.margin};
  padding: 2rem;
  elevation: 2;
  background-color: $background;
`;

const MyComponent = ({ margin = '1rem' }: { margin?: string }) => {
  // appearance is not required anymore because it is provided by attrs
  return <StyledWithAttrs margin={margin} />;
};
```

In case that the component that is being styled has some required parameters, and you declare those as required on the `A` generic, then they will not be required on the generated styled component. Indeed they will even be excluded from the props of the generated styled component so that you may not accidentally try to provide them as props when instantiating it.

# styled-native-components

A [Styled Components](https://www.styled-components.com) alternative for React Native (Web), that supports variables, nested style definitions for `contentContainerStyle`, and web centric CSS concepts ported to React Native Web.

## Disclaimer

This library does not provide a compiled output, as there are strange issues with mixed named and default exports. So make sure to compile this library with webpack, when using it in a web project.

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

As seen above the library enables usage of `$` prefixed variables in your CSS.

You have to distinguish between two types of variables: (1) static variables that can be resolved at compile time, (2) dynamic variables that may change during runtime for example when switching to dark mode.

Static variables must be set first thing in you code, by calling the `setStaticVariables` function. The value of a static variable must be a valid CSS string.

```js
import { setStaticVariables } from 'styled-native-components';

setStaticVariables({
  borderRadius: '1rem',
});
```

Dynamic variables are provided through a theme context. Allowed dynamic variables are `colors` and the `rem` size (When running on web, the rem size will be handled like usual on the web). You can also specify an elevation function that transforms an elevation value to shadow styles. The theme context will also contain the static variables under `theme.variables` for use with `attrs` or `useTheme`.

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

There are also some hooks available:

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

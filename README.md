# styled-native-components

A React Native [Styled Components](https://www.styled-components.com) alternative, that supports resolving theme variables in strings and nested style definitions for `contentContainerStyle` etc.

This does currently not provide a compiled output, as there are strange issues with mixed named and default exports. So make sure to compile this library with webpack, when using it in a web project.

## Documentation

You should provide a theme that at least contains colors and a rem size. The color names can be referenced in your styles as well as the rem size and viewport units. When using [React Native Web](https://www.github.com/necolas/react-native-web) the rem unit will be resolved from you html font size and not parsed.

```js
import { ThemeProvider } from 'styled-native-components';

const App = () => {
  const theme = {
    colors: {
      accent: '#11C5D9',
      background: '#141417',
      text: '#D2D2D6',
    },
    rem: 8,
  };
  return (
    <ThemeProvider theme={theme}>
      <AppComponent />
    </ThemeProvider>
  );
};
```

The basic API is equivalent with Styled Components:

```js
import styled from 'styled-native-components';

const SimpleComponent = styled.Component`
  padding: 1rem 0;
  width: 80vw;
`;

const CustomComponent = styled(Component)`
  padding: 1rem 0;
`;

const PropsBasedComponent = styled(Component)`
  padding: 1rem 0;
  background-color: ${(p) => (p.active ? 'accent' : 'background')};
`;

const ComponentWithAttributes = styled.selectionColor.attrs((p) => ({
  selectionColor: p.theme.colors.accent,
}))`
  color: text;
`;

const NestedStyleComponent = styled.ScrollView`
  background-color: background;
  contentContainer {
    padding: 1rem 2rem;
  }
`;
```

You can specify custom functions in your theme to overwrite/create CSS properties:

```js
const theme = {
  customCss: {
    elevation: (value) => ({
      shadowColor: 'black',
      shadowOffset: { width: 0, height: parseFloat(value) },
      shadowRadius: parseFloat(value) * 2,
      shadowOpacity: 0.3,
      elevation: parseFloat(value),
      zIndex: parseFloat(value),
    }),
    rounding: (value) => ({
      borderRadius: [0, 2, 4, 8, 16, 32][parseInt(value, 10)],
    }),
  },
};

const ElevatedComponent = styled.View`
  elevation: 2;
  rounding: 3;
`;
```

There are also some hooks available:

```js
import {
  useStyle,
  useTheme,
  useWindowDimensions,
  useParseLengthAttribute,
} from 'styled-native-components';

const Component = ({ children, margin = '2rem 20px 1vh' }) => {
  const style = useStyle(/*css*/ `
    color: accent;
  `);
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const pixelMargins = useParseLengthAttribute(margin); // [2*theme.rem, 20, windowWidth/100, 20 ]
  return (
    <Text
      selectionColor={theme.colors.accent}
      style={style}
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

You can also overwrite the theme context to use an existing one:

```js
import { setThemeContext } from 'styled-native-components';
import { ThemeContext } from 'styled-components';

setThemeContext(ThemeContext);
```

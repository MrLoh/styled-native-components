// @flow
import { useMemo, useContext, forwardRef, memo, createElement, createContext } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  FlatList,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import transform from 'css-to-react-native';

const colorAttributes = new Set([
  'backgroundColor',
  'color',
  'borderRightColor',
  'borderBottomColor',
  'borderColor',
  'borderEndColor',
  'borderLeftColor',
  'backgroundColor',
  'borderStartColor',
  'borderTopColor',
  'shadowColor',
]);
const lengthAttributes = new Set([
  'width',
  'height',
  'borderBottomEndRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderBottomStartRadius',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRadius',
  'borderRightWidth',
  'borderTopEndRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderTopStartRadius',
  'borderTopWidth',
  'borderWidth',
  'flexBasis',
  'bottom',
  'end',
  'left',
  'right',
  'start',
  'top',
  'margin',
  'marginBottom',
  'marginEnd',
  'marginHorizontal',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'padding',
  'paddingBottom',
  'paddingEnd',
  'paddingHorizontal',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingTop',
  'paddingVertical',
  'shadowOffset',
  'shadowRadius',
  'lineHeight',
  'fontSize',
  'letterSpacing',
]);

const vw = Dimensions.get('window').width / 100;
const vh = Dimensions.get('window').height / 100;

export let ThemeContext = createContext({});

// resolve css template literal content into a single string, allow for props functions
const cssCommentRegexp = new RegExp('\\/\\*.+?\\*\\/', 'gs');
const resolveTemplateLiteral = (strings, expressions, props): string =>
  strings
    .map((str, i) => {
      // resolve expressions
      let exp = expressions.length > i ? expressions[i] : '';
      if (typeof exp === 'function') exp = exp(props);
      return str + exp;
    })
    .join('')
    // remove comments
    .replace(cssCommentRegexp, '');

// create a RN style object from a single css declaration
const styleObjectCache = new Map([]);
const createStyleObject = (cssDeclaration: string): Object => {
  if (!cssDeclaration) return {};
  let styleObject = styleObjectCache.get(cssDeclaration);
  if (!styleObject) {
    styleObject = transform(
      cssDeclaration
        .split(';')
        .map((rule) =>
          rule
            .split(':')
            .map((value) => value.trim())
            .filter((value) => value)
        )
        .filter((rule) => rule.length > 0)
    );
    styleObjectCache.set(cssDeclaration, styleObject);
  }
  return styleObject;
};

// create an object of RN style objects from a single css declaration
const nestedStyleObjectsCache = new Map([]);
const nestedDeclarationRegExp = new RegExp('\\w+\\s*\\{(.+?)\\}', 'gs');
const createNestedStyleObject = (nestedCssDeclaration: string): { [key: string]: Object } => {
  let nestedStyleObjects = nestedStyleObjectsCache.get(nestedCssDeclaration);
  if (!nestedStyleObjects) {
    let mainStyleDeclaration = nestedCssDeclaration;
    nestedStyleObjects = {};
    let matches;
    while ((matches = nestedDeclarationRegExp.exec(nestedCssDeclaration))) {
      const [string, content] = matches;
      const declaration = content.trim();
      const name = string.split('{')[0].trim();
      nestedStyleObjects[`${name}Style`] = createStyleObject(declaration);
      mainStyleDeclaration = mainStyleDeclaration.replace(string, '');
    }
    nestedStyleObjects.style = createStyleObject(mainStyleDeclaration.trim());
    nestedStyleObjectsCache.set(nestedCssDeclaration, nestedStyleObjects);
  }
  return nestedStyleObjects;
};

// resolve any occurences of theme variables in the values of a style object
const plattformIsWeb = Platform.OS === 'web';
const resolveThemeVariables = (styleObject, theme) => {
  for (const key in styleObject) {
    // resolve all color names to theme variables if possible
    if (colorAttributes.has(key) && styleObject[key] in theme.colors) {
      styleObject[key] = theme.colors[styleObject[key]];
    }
    // resolve all rem and viewport units if not on web where they are supported
    if (plattformIsWeb && lengthAttributes.has(key) && typeof styleObject[key] === 'string') {
      if (styleObject[key].includes('rem')) {
        styleObject[key] = Number.parseFloat(styleObject[key]) * theme.rem;
      } else if (styleObject[key].includes('vw')) {
        styleObject[key] = Number.parseFloat(styleObject[key]) * vw;
      } else if (styleObject[key].includes('vh')) {
        styleObject[key] = Number.parseFloat(styleObject[key]) * vh;
      }
    }
  }
  return styleObject;
};

// generate styleSheet from nested style Object
const createStyleSheet = (styles: { [key: string]: Object }, theme) => {
  for (const key in styles) styles[key] = resolveThemeVariables(styles[key], theme);
  return StyleSheet.create(styles);
};

export const ThemeProvider = ({ theme, children }) => {
  return createElement(ThemeContext.Provider, { value: theme }, children);
};

export const useTheme = () => useContext(ThemeContext);

export const useStyle = (cssDeclaration: string) => {
  const theme = useContext(ThemeContext);
  return useMemo(() => {
    const styleObject = createStyleObject(cssDeclaration.trim());
    return createStyleSheet({ generated: styleObject }, theme).generated;
  }, [cssDeclaration, theme]);
};

const makeTemplateFunction = (Component, transformProps) => (strings, ...expressions) => {
  const displayName = `Styled(${Component.displayName || Component.name})`;
  let StyledComponentForwardRef;
  if (!expressions.some((exp) => typeof exp === 'function')) {
    // if no props are used in the styles, then we can statically generate the cssString
    const cssString = resolveTemplateLiteral(strings, expressions);
    const styles = createNestedStyleObject(cssString);
    StyledComponentForwardRef = ({ style, ...props }, ref) => {
      const theme = useContext(ThemeContext);
      const styleProps = useMemo(() => {
        return createStyleSheet(styles, theme);
      }, [theme]);
      if (style) styleProps.style = [styleProps.style, style];
      return createElement(Component, { ...transformProps(props), ...styleProps, ref });
    };
  } else {
    // if the cssString depends on props, we can at least ignore changes to children
    StyledComponentForwardRef = ({ children, style, ...props }, ref) => {
      props = transformProps(props);
      const theme = useContext(ThemeContext);
      const cssString = useMemo(() => {
        return resolveTemplateLiteral(strings, expressions, { ...props, theme });
      }, [props, theme]);
      const styleProps = useMemo(() => {
        const styles = createNestedStyleObject(cssString);
        return createStyleSheet(styles, theme);
      }, [cssString, theme]);
      if (style) styleProps.style = [styleProps.style, style];
      return createElement(Component, { ...props, ...styleProps, ref }, children);
    };
  }
  StyledComponentForwardRef.displayName = displayName;
  return memo(forwardRef(StyledComponentForwardRef));
};
const styled = (Component) => {
  const templateFunction = makeTemplateFunction(Component, (props) => props);
  templateFunction.attrs = (attrs) => {
    const isFunc = typeof attrs === 'function';
    const transformProps = (props) => ({ ...props, ...(isFunc ? attrs(props) : attrs) });
    return makeTemplateFunction(Component, transformProps);
  };
  return templateFunction;
};

export const setThemeContext = (ExternalThemeContext) => {
  ThemeContext = ExternalThemeContext;
};

styled.View = styled(View);
styled.Text = styled(Text);
styled.Image = styled(Image);
styled.ScrollView = styled(ScrollView);
styled.FlatList = styled(FlatList);
styled.SectionList = styled(SectionList);
styled.TouchableOpacity = styled(TouchableOpacity);
styled.TextInput = styled(TextInput);
styled.SafeAreaView = styled(SafeAreaView);

export default styled;

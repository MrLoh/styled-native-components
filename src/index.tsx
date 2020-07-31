import React, { useMemo, forwardRef, memo } from 'react';
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
} from 'react-native';
import { getPropertyName, getStylesForProperty } from 'css-to-react-native';

import {
  resolveColorVariablePlaceholder,
  resolveThemeVariables,
  ThemeProvider,
  useTheme,
  withTheme,
  ThemeContext,
  setThemeContext,
} from './theme';
import { useWindowDimensions } from './window-dimensions';
import {
  makePropsFilter,
  viewProps,
  textProps,
  imageProps,
  listProps,
  pressableProps,
  inputProps,
  domProps,
} from './prop-sets';

import type { ForwardRefRenderFunction, ReactNode, ComponentType, RefAttributes } from 'react';
import type { StyleProp } from 'react-native';
import type { Style } from 'css-to-react-native';
import type { DefaultTheme, ThemeInterface } from './theme';
import type { PropsFilterFunction } from './prop-sets';

// resolve css template literal content into a single string, allow for props functions
const cssCommentRegexp = new RegExp('\\/\\*[^]+?\\*\\/', 'g');
const resolveTemplateLiteral: {
  (strings: TemplateStringsArray, expressions: string[]): string;
  <P>(
    strings: TemplateStringsArray,
    expressions: (string | number | ((props: P) => string | number))[],
    props: P
  ): string;
} = (
  strings: TemplateStringsArray,
  expressions: (string | number | ((props: any) => string | number))[],
  props?: any
) =>
  strings
    .map((str, i) => {
      // resolve expressions
      const exp = expressions.length > i ? expressions[i] : '';
      if (typeof exp === 'string' || typeof exp === 'number') {
        return str + exp;
      } else {
        return str + exp(props);
      }
    })
    .join('')
    // remove comments
    .replace(cssCommentRegexp, '');

// create a RN style object from a single css declaration
const variableRegexp = new RegExp('\\$[\\w|-]+', 'g');
const styleObjectCache = new Map<string, Style>([]);
const createStyleObject = (cssDeclaration?: string): Style => {
  if (!cssDeclaration) return {};
  let styleObject = styleObjectCache.get(cssDeclaration);
  if (!styleObject) {
    styleObject = Object.assign(
      {},
      ...cssDeclaration
        .split(';')
        .map((rule) =>
          rule
            .split(':')
            .map((value) => value && value.trim())
            .filter((value) => value)
        )
        .filter((rule) => rule.length === 2)
        .map(([name, value]) => {
          const resolvedValue = value.replace(variableRegexp, (variable: string): string =>
            resolveColorVariablePlaceholder(variable)
          );
          try {
            return getStylesForProperty(getPropertyName(name), resolvedValue);
          } catch (e) {
            throw new Error(`could not parse '${name}: ${value}'\n${e.message}`);
          }
        })
    ) as Style;
    styleObjectCache.set(cssDeclaration, styleObject);
  }
  return styleObject;
};

// create an object of RN style objects from a single css declaration
const nestedStyleObjectsCache = new Map<string, { [key: string]: Style }>([]);
const nestedDeclarationRegExp = new RegExp('\\w+\\s*\\{([^]+?)\\}', 'g');
const createNestedStyleObject = (nestedCssDeclaration: string): { [key: string]: Style } => {
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

// generate styleSheet from nested style Object
const useStyleSheet = (styles: { [key: string]: Style }, theme: DefaultTheme) => {
  const windowDimensions = useWindowDimensions();
  return useMemo(() => {
    // we need to make sure to do a deep clone here, so that theme and viewport units can be resolved from original strings
    const stylesCopy = { ...styles };
    for (const key in stylesCopy) {
      stylesCopy[key] = resolveThemeVariables({ ...stylesCopy[key] }, theme, windowDimensions);
    }
    return StyleSheet.create(stylesCopy);
  }, [styles, theme, windowDimensions]);
};

type TemplateStringExpression<P> = string | number | ((props: P) => string | number);
type PropsWithoutStyleAndChildren<P> = Pick<P, Exclude<keyof P, 'children' | 'style'>>;

const makeTemplateFunction = <
  I extends { style?: StyleProp<any>; children?: ReactNode } & A & RefAttributes<R>,
  R,
  A = {},
  P = {}
>(
  Component: ComponentType<I>,
  transformProps: (
    p: PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme }
  ) => PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme } & A,
  filterComponentProps: PropsFilterFunction
) => (
  strings: TemplateStringsArray,
  ...expressions: TemplateStringExpression<
    PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme } & A
  >[]
): ComponentType<P & I & A> => {
  const displayName = `Styled(${Component.displayName || Component.name})`;
  let styledForwardRefRenderFunction: ForwardRefRenderFunction<R, P & I>;
  if (expressions.every((exp) => typeof exp === 'string')) {
    // if no props are used in the styles, then we can statically generate the cssString
    const cssString = resolveTemplateLiteral(strings, expressions as string[]);
    const styles = createNestedStyleObject(cssString);
    styledForwardRefRenderFunction = ({ children, style, ...props }: P & I, ref) => {
      const theme = useTheme();
      let styleProps: { [key: string]: Style | Style[] } = useStyleSheet(styles, theme);
      styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;
      return (
        <Component
          {...filterComponentProps(transformProps({ ...props, theme }))}
          {...styleProps}
          ref={ref}
        >
          {children}
        </Component>
      );
    };
  } else {
    // if the cssString depends on props, we can at least ignore changes to children
    styledForwardRefRenderFunction = ({ children, style, ...props }: P & I, ref) => {
      const theme = useTheme();
      const transformedProps = transformProps({ ...props, theme });
      const cssString = useMemo(() => {
        return resolveTemplateLiteral(strings, expressions, {
          ...transformedProps,
          theme,
        });
      }, [props, theme]);
      const styles = useMemo(() => createNestedStyleObject(cssString), [cssString]);
      let styleProps: { [key: string]: Style | Style[] } = useStyleSheet(styles, theme);
      styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;
      return (
        <Component {...filterComponentProps(transformedProps)} {...styleProps} ref={ref}>
          {children}
        </Component>
      );
    };
  }
  styledForwardRefRenderFunction.displayName = displayName;
  // all the exotic component wrappers mess up the type somehow, better to keep it simple
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  return memo(forwardRef(styledForwardRefRenderFunction));
};

interface StyledInterface<I, A> {
  <P>(
    strings: TemplateStringsArray,
    ...expressions: TemplateStringExpression<
      PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme }
    >[]
  ): ComponentType<P & I & A>;
  attrs: <P>(
    attrMaker: A | ((props: PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme }) => A)
  ) => (
    strings: TemplateStringsArray,
    ...expressions: TemplateStringExpression<
      PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme } & A
    >[]
  ) => ComponentType<P & I & A>;
}

const styled = <
  I extends { style?: StyleProp<any>; children?: ReactNode } & A & RefAttributes<R>,
  R,
  A extends object = {}
>(
  Component: ComponentType<I>,
  filterComponentProps: PropsFilterFunction = (p) => p
) => {
  const templateFunction = makeTemplateFunction<I, R>(
    Component,
    (props) => props,
    filterComponentProps
  ) as StyledInterface<I, A>;
  templateFunction.attrs = <P,>(
    attrMaker: A | ((props: PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme }) => A)
  ) => {
    const transformProps = (
      props: PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme }
    ): PropsWithoutStyleAndChildren<P & I> & { theme: DefaultTheme } & A => ({
      ...props,
      ...(typeof attrMaker === 'object' ? attrMaker : attrMaker(props)),
    });
    return makeTemplateFunction<I, R, A, P>(Component, transformProps, filterComponentProps);
  };
  return templateFunction;
};

styled.View = styled(View, makePropsFilter(viewProps, domProps));
styled.Text = styled(Text, makePropsFilter(textProps, domProps));
styled.Image = styled(Image, makePropsFilter(imageProps, domProps));
styled.ScrollView = styled(ScrollView, makePropsFilter(listProps, domProps));
styled.FlatList = styled(FlatList, makePropsFilter(listProps, domProps));
styled.SectionList = styled(SectionList, makePropsFilter(listProps, domProps));
styled.TouchableOpacity = styled(TouchableOpacity, makePropsFilter(pressableProps, domProps));
styled.TextInput = styled(TextInput, makePropsFilter(inputProps, viewProps, textProps, domProps));
styled.SafeAreaView = styled(SafeAreaView, makePropsFilter(viewProps, domProps));

export default styled;

export type { DefaultTheme, ThemeInterface };

export const filterProps = makePropsFilter(
  viewProps,
  textProps,
  imageProps,
  listProps,
  pressableProps,
  inputProps,
  domProps
);

export const useStyle = (cssDeclaration: string): Style => {
  const theme = useTheme();
  const styles = useMemo(() => ({ generated: createStyleObject(cssDeclaration.trim()) }), []);
  return useStyleSheet(styles, theme).generated;
};

export const useLengthAttribute = (margin: string): [number, number, number, number] => {
  const theme = useTheme();
  const windowDimensions = useWindowDimensions();
  return useMemo(() => {
    const parsedMargin = margin.replace(/\s\s+/g, ' ').split(' ');
    const pixelValues = parsedMargin.map((str: string) => {
      if (!str || typeof str === 'number') return str;
      if (typeof str !== 'string') throw new Error(`expected ${str} to be a string`);
      const value = Number.parseFloat(str);
      if (value === 0) return 0;
      const unit = str.trim().replace(String(value), '');
      if (!unit) throw new Error(`length string '${str}' contains no unit`);
      switch (unit) {
        case 'rem':
          return value * theme.rem;
        case 'px':
          return value;
        case 'vw':
          if (!windowDimensions) throw new Error('pass windowDimensions as the 3rd argument');
          return (value * windowDimensions.width) / 100;
        case 'vh':
          if (!windowDimensions) throw new Error('pass windowDimensions as the 3rd argument');
          return (value * windowDimensions.height) / 100;
        default:
          throw new Error(`cannot parse length string '${str}', unknown unit '${unit}'`);
      }
    });
    return [0, 1, 2, 3].map((i) =>
      pixelValues[i] !== undefined
        ? pixelValues[i]
        : pixelValues[i - 2] !== undefined
        ? pixelValues[i - 2]
        : pixelValues[0] || 0
    ) as [number, number, number, number];
  }, [margin, theme.rem, windowDimensions]);
};

export const useColorAttribute = (color: string): string => {
  const theme = useTheme();
  return color in theme.colors
    ? theme.colors[color]
    : color && color.substring(1) in theme.colors
    ? theme.colors[color.substring(1)]
    : color;
};

export { ThemeProvider, useWindowDimensions, useTheme, withTheme, ThemeContext, setThemeContext };

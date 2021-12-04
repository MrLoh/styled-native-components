import React, { useMemo, forwardRef, memo } from 'react';
import { StyleSheet } from 'react-native';
import { getPropertyName, getStylesForProperty } from 'css-to-react-native';

import { useWindowDimensions } from './window-dimensions';
import {
  resolveColorVariablePlaceholder,
  resolveThemeVariables,
  resolveLengthUnit,
  useTheme,
} from './theme';

import type { ForwardRefRenderFunction, ReactNode, ComponentType } from 'react';
import type { StyleProp, ScaledSize } from 'react-native';
import type { Style } from 'css-to-react-native';
import type { Theme } from './theme';

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

type NestedStyles = { [nestedStyle: string]: { main: Style; [mediaRule: string]: Style } };
const nestedStyleObjectsCache = new Map<string, NestedStyles>([]);
// create an object of RN style objects for each media query from a single css declaration
export const createNestedStyleObject = (cssDeclaration: string): NestedStyles => {
  let nestedStyleObject = nestedStyleObjectsCache.get(cssDeclaration);
  if (!nestedStyleObject) {
    nestedStyleObject = { style: { main: {} } };
    let match: RegExpExecArray | null;
    let start = 0;
    let name: string;
    let nOpen = 0;
    let mainDeclaration = '';
    const braceRegExp = new RegExp('\\s*.+\\s*\\{|\\}', 'g');
    while ((match = braceRegExp.exec(cssDeclaration))) {
      if (nOpen === 0) {
        mainDeclaration += cssDeclaration.substring(start, match.index);
        start = match.index + match[0].length;
        name = cssDeclaration.substring(match.index, match.index + match[0].length - 1).trim();
      }
      nOpen = nOpen + (match[0] === '}' ? -1 : +1);
      if (nOpen === 0) {
        const declaration = cssDeclaration.substring(start, match.index).trim();
        start = match.index + 1;
        if (name!.substring(0, 6) === '@media') {
          nestedStyleObject.style[name!.substring(6).trim()] = createStyleObject(declaration);
        } else {
          nestedStyleObject[name! + 'Style'] = createNestedStyleObject(declaration).style;
        }
      }
    }
    mainDeclaration += cssDeclaration.substring(start, cssDeclaration.length);
    nestedStyleObject.style.main = createStyleObject(mainDeclaration.trim());
    nestedStyleObjectsCache.set(cssDeclaration, nestedStyleObject);
  }
  return nestedStyleObject;
};

const matchMediaRule = (mediaRule: string, theme: Theme, windowDimensions: ScaledSize): boolean => {
  let matched = true;
  for (const condition of mediaRule.split('and')) {
    const [name, strVal] = condition.replace(/\(|\)/g, '').trim().split(':');
    const value = resolveLengthUnit(strVal, theme, windowDimensions);
    if (typeof value !== 'number') throw new Error(`invalid unit on @media ${mediaRule}`);
    const { width, height } = windowDimensions;
    switch (name) {
      case 'min-width':
        matched = matched && width >= value;
        break;
      case 'max-width':
        matched = matched && width <= value;
        break;
      case 'min-height':
        matched = matched && height >= value;
        break;
      case 'max-height':
        matched = matched && height <= value;
        break;
    }
    // console.log('matching', condition, value, windowDimensions, matched);
  }
  return matched;
};

// generate styleSheet from nested style Object with media queries
const useStyleSheet = (
  styles: NestedStyles,
  theme: Theme,
  windowDimensions: ScaledSize
): { [key: string]: Style } => {
  return useMemo(() => {
    const finalStyles: { [key: string]: Style } = {};
    // we need to make sure to do a deep clone here, so that theme and viewport units can be resolved from original strings
    const stylesCopy = { ...styles };
    for (const key in stylesCopy) {
      const { main, ...mediaStylesCopy } = stylesCopy[key];
      // this will contain the main style and all applicable media query styles
      const mediaStylesArray = [resolveThemeVariables({ ...main }, theme, windowDimensions)];
      for (const mediaRule in mediaStylesCopy) {
        if (matchMediaRule(mediaRule, theme, windowDimensions)) {
          mediaStylesArray.push(
            resolveThemeVariables({ ...mediaStylesCopy[mediaRule] }, theme, windowDimensions)
          );
        }
      }
      finalStyles[key] = Object.assign({}, ...mediaStylesArray);
    }
    return StyleSheet.create(finalStyles);
  }, [styles, theme, windowDimensions]);
};

export type OptionalKeys<T> = Exclude<
  { [K in keyof T]: T extends Record<K, T[K]> ? never : K }[keyof T],
  undefined
>;
export type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;
type TemplateStringExpression<P> = string | number | ((props: P) => string | number);
export type TemplateFunction<I, P, A = {}> = (
  strings: TemplateStringsArray,
  ...expressions: TemplateStringExpression<
    Omit<P & I, RequiredKeys<A> | 'children' | 'style'> & { theme: Theme } & A
  >[]
) => ComponentType<Omit<P & I, RequiredKeys<A>>>;
export type AttrProps<P, I, A> = Omit<P & I, RequiredKeys<A> | 'children' | 'style'> & {
  theme: Theme;
};

export const makeTemplateFunction = <
  I extends { style?: StyleProp<any>; children?: ReactNode },
  P = {},
  A extends { children?: never; style?: never } = {}
>(
  Component: ComponentType<I>,
  transformProps: (p: AttrProps<P, I, A>) => AttrProps<P, I, A> & A,
  filterComponentProps: (props: any) => I
): TemplateFunction<I, P, A> => (
  strings: TemplateStringsArray,
  ...expressions: TemplateStringExpression<AttrProps<P, I, A> & A>[]
): ComponentType<Omit<P & I, RequiredKeys<A>>> => {
  const displayName = `Styled(${Component.displayName || Component.name})`;
  let StyledForwardRefRenderFunction: ForwardRefRenderFunction<any, Omit<P & I, RequiredKeys<A>>>;
  if (expressions.every((exp) => typeof exp === 'string')) {
    // if no props are used in the styles, then we can statically generate the cssString
    const cssString = resolveTemplateLiteral(strings, expressions as string[]);
    const styles = createNestedStyleObject(cssString);
    StyledForwardRefRenderFunction = (
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore ts doesn't understand that A is not allowed to declare children and style
      { children, style, ...props }: Omit<P & I, RequiredKeys<A>>,
      ref
    ) => {
      const theme = useTheme();
      const dimensions = useWindowDimensions();
      let styleProps: { [key: string]: Style | Style[] } = useStyleSheet(styles, theme, dimensions);
      styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;
      const transformedProps = transformProps({ ...props, theme } as AttrProps<P, I, A>);
      return (
        <Component {...filterComponentProps(transformedProps)} {...styleProps} ref={ref}>
          {children}
        </Component>
      );
    };
  } else {
    // if the cssString depends on props, we can at least ignore changes to children
    StyledForwardRefRenderFunction = (
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore ts doesn't understand that A is not allowed to declare children and style
      { children, style, ...props }: Omit<P & I, RequiredKeys<A>>,
      ref
    ) => {
      const theme = useTheme();
      const dimensions = useWindowDimensions();
      const transformedProps = transformProps({ ...props, theme } as AttrProps<P, I, A>);
      const cssString = useMemo(() => {
        return resolveTemplateLiteral(strings, expressions, transformedProps);
      }, [transformedProps]);
      const styles = useMemo(() => createNestedStyleObject(cssString), [cssString]);
      let styleProps: { [key: string]: Style | Style[] } = useStyleSheet(styles, theme, dimensions);
      styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;
      return (
        <Component {...filterComponentProps(transformedProps)} {...styleProps} ref={ref}>
          {children}
        </Component>
      );
    };
  }
  StyledForwardRefRenderFunction.displayName = displayName;
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore ts gets confused in HOC wrappers but the declared return type has the proper refs
  return memo(forwardRef(StyledForwardRefRenderFunction));
};

export const useStyle = (cssDeclaration: string): Style => {
  const theme = useTheme();
  const dimensions = useWindowDimensions();
  const styles = useMemo(() => createNestedStyleObject(cssDeclaration.trim()), []);
  return useStyleSheet(styles, theme, dimensions).style;
};

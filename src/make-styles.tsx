import React, { useMemo, forwardRef, memo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { getPropertyName, getStylesForProperty } from 'css-to-react-native';

import { resolveColorVariablePlaceholder, resolveThemeVariables, useTheme } from './theme';

import type { ForwardRefRenderFunction, ReactNode, ComponentType } from 'react';
import type { StyleProp } from 'react-native';
import type { Style } from 'css-to-react-native';
import type { DefaultTheme } from './theme';

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

export type OptionalKeys<T> = { [K in keyof T]?: undefined extends T[K] ? K : never }[keyof T];
export type RequiredKeys<T> = Exclude<keyof T, OptionalKeys<T>>;
type TemplateStringExpression<P> = string | number | ((props: P) => string | number);
export type TemplateFunction<I, P, A = {}> = (
  strings: TemplateStringsArray,
  ...expressions: TemplateStringExpression<
    Omit<P & I, RequiredKeys<A> | 'children' | 'style'> & { theme: DefaultTheme } & A
  >[]
) => ComponentType<Omit<P & I, RequiredKeys<A>>>;
export type AttrProps<P, I, A> = Omit<P & I, RequiredKeys<A> | 'children' | 'style'> & {
  theme: DefaultTheme;
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
  let styledForwardRefRenderFunction: ForwardRefRenderFunction<any, Omit<P & I, RequiredKeys<A>>>;
  if (expressions.every((exp) => typeof exp === 'string')) {
    // if no props are used in the styles, then we can statically generate the cssString
    const cssString = resolveTemplateLiteral(strings, expressions as string[]);
    const styles = createNestedStyleObject(cssString);
    styledForwardRefRenderFunction = (
      // @ts-ignore ts doesn't understand that A is not allwoed to declar children and style
      { children, style, ...props }: Omit<P & I, RequiredKeys<A>>,
      ref
    ) => {
      const theme = useTheme();
      let styleProps: { [key: string]: Style | Style[] } = useStyleSheet(styles, theme);
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
    styledForwardRefRenderFunction = (
      // @ts-ignore ts doesn't understand that A is not allwoed to declar children and style
      { children, style, ...props }: Omit<P & I, RequiredKeys<A>>,
      ref
    ) => {
      const theme = useTheme();
      const transformedProps = transformProps({ ...props, theme } as AttrProps<P, I, A>);
      const cssString = useMemo(() => {
        return resolveTemplateLiteral(strings, expressions, transformedProps);
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
  // @ts-ignore ts gets confused in HOC wrappers but the declared return type has the proper refs
  return memo(forwardRef(styledForwardRefRenderFunction));
};

export const useStyle = (cssDeclaration: string): Style => {
  const theme = useTheme();
  const styles = useMemo(() => ({ generated: createStyleObject(cssDeclaration.trim()) }), []);
  return useStyleSheet(styles, theme).generated;
};

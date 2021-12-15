import React, { useMemo, forwardRef, memo, createContext, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { getPropertyName, getStylesForProperty } from 'css-to-react-native';

import { useWindowDimensions } from './window-dimensions';
import type { GenericSize } from './container-dimensions';
import { useComponentDimensions } from './container-dimensions';
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

//Setting up Container Query Context
export let ContainerSizeContext = createContext(undefined) as React.Context<
  GenericSize | undefined
>;

export const setContainerContext = (
  ExternalContainerContext: React.Context<GenericSize | undefined>
) => {
  ContainerSizeContext = ExternalContainerContext;
};

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
            throw new Error(`could not parse '${name}: ${value}'\n${(e as Error).message}`);
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
        if (name!.startsWith('@media')) {
          nestedStyleObject.style[name!] = createStyleObject(declaration);
        } else if (name!.startsWith('@container')) {
          nestedStyleObject.style[name!] = createStyleObject(declaration);
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

const matchQueryRule = (
  queryType: string,
  rule: string,
  theme: Theme,
  windowDimensions: ScaledSize,
  containerDimensions?: GenericSize
): boolean => {
  if (queryType === '@container' && !containerDimensions) return false;
  let matched = true;
  for (const condition of rule.split('and')) {
    const [name, strVal] = condition.replace(/\(|\)/g, '').trim().split(':');
    const value = resolveLengthUnit(strVal, theme, windowDimensions);
    if (typeof value !== 'number') throw new Error(`invalid unit on @media/@container ${rule}`);
    const { width, height } = queryType === '@container' ? containerDimensions! : windowDimensions;
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
  }
  return matched;
};

// generate styleSheet from nested style Object with media queries
const useStyleSheet = (
  styles: NestedStyles,
  theme: Theme,
  windowDimensions: ScaledSize,
  containerDimensions?: GenericSize
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
        if (
          matchQueryRule(
            mediaRule.substring(0, mediaRule.indexOf(' ')),
            mediaRule.substring(mediaRule.indexOf(' ')),
            theme,
            windowDimensions,
            containerDimensions
          )
        ) {
          mediaStylesArray.push(
            resolveThemeVariables({ ...mediaStylesCopy[mediaRule] }, theme, windowDimensions)
          );
        }
      }
      finalStyles[key] = Object.assign({}, ...mediaStylesArray);
    }
    return StyleSheet.create(finalStyles);
  }, [styles, theme, windowDimensions, containerDimensions]);
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

export const makeTemplateFunction =
  <
    I extends { style?: StyleProp<any>; children?: ReactNode },
    P = {},
    A extends { children?: never; style?: never } = {}
  >(
    Component: ComponentType<I>,
    transformProps: (p: AttrProps<P, I, A>) => AttrProps<P, I, A> & A,
    filterComponentProps: (props: any) => I
  ): TemplateFunction<I, P, A> =>
  (
    strings: TemplateStringsArray,
    ...expressions: TemplateStringExpression<AttrProps<P, I, A> & A>[]
  ): ComponentType<Omit<P & I, RequiredKeys<A>>> => {
    const displayName = 'Styled(' + Component.displayName || Component.name + ')';
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
        const [componentDimensions, layoutEvent] = useComponentDimensions();

        //if no container is provided, @container query should not be applied
        const containerDimensions = useContext(ContainerSizeContext);
        const isContainer = Object.values(styles).some(
          (s) => s.main.contain || s.main.containerType || s.main.container
        );
        if (Object.values(styles).some((s) => s.main.containerName)) {
          throw new Error('Container-name is not currently supported by styled-native-components');
        }
        let styleProps: { [key: string]: Style | Style[] } = useStyleSheet(
          styles,
          theme,
          dimensions,
          containerDimensions
        );
        styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;
        const transformedProps = transformProps({ ...props, theme } as AttrProps<P, I, A>);

        if (isContainer) {
          return (
            <ContainerSizeContext.Provider value={componentDimensions}>
              <Component
                {...filterComponentProps(transformedProps)}
                {...styleProps}
                ref={ref}
                onLayout={layoutEvent}
              >
                {children}
              </Component>
            </ContainerSizeContext.Provider>
          );
        } else {
          return (
            <Component {...filterComponentProps(transformedProps)} {...styleProps} ref={ref}>
              {children}
            </Component>
          );
        }
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
        const [componentDimensions, layoutEvent] = useComponentDimensions();

        const transformedProps = transformProps({ ...props, theme } as AttrProps<P, I, A>);
        const cssString = useMemo(() => {
          return resolveTemplateLiteral(strings, expressions, transformedProps);
        }, [transformedProps]);
        const styles = useMemo(() => createNestedStyleObject(cssString), [cssString]);

        //if no container is provided, @container query should not be applied
        const containerDimensions = useContext(ContainerSizeContext);
        const isContainer = Object.values(styles).some(
          (s) => s.main.contain || s.main.containerType || s.main.container
        );

        if (Object.values(styles).some((s) => s.main.containerName)) {
          throw new Error('Container-name is not currently supported by styled-native-components');
        }

        let styleProps: { [key: string]: Style | Style[] } = useStyleSheet(
          styles,
          theme,
          dimensions,
          containerDimensions ? containerDimensions : undefined
        );
        styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;

        if (isContainer) {
          return (
            <ContainerSizeContext.Provider value={componentDimensions}>
              <Component
                {...filterComponentProps(transformedProps)}
                {...styleProps}
                ref={ref}
                onLayout={layoutEvent}
              >
                {children}
              </Component>
            </ContainerSizeContext.Provider>
          );
        } else {
          return (
            <Component {...filterComponentProps(transformedProps)} {...styleProps} ref={ref}>
              {children}
            </Component>
          );
        }
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
  const styles = useMemo(() => createNestedStyleObject(cssDeclaration.trim()), [cssDeclaration]);
  return useStyleSheet(styles, theme, dimensions).style;
};

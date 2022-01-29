import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';

import type { ReactNode, ComponentType } from 'react';
import type { ScaledSize } from 'react-native';
import type { Style } from 'css-to-react-native';

import { colorAttributes, lengthAttributes } from './attribute-sets';

export interface ThemeInterface {
  rem: number;
  elevation: (value: number) => Style;
}

/**
 * This interface can be augmented by users to add types to `styled-native-components`' default
 * theme without needing to reexport `ThemedStyledComponentsModule`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Theme extends ThemeInterface {}

export let ThemeContext = createContext(null) as React.Context<Theme | null>;

export const setThemeContext = (ExternalThemeContext: React.Context<Theme | null>) => {
  ThemeContext = ExternalThemeContext;
};

export const useTheme = (): Theme => {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('missing theme context, wrap your app in a ThemeProvider');
  return theme;
};

export const withTheme = <P extends { children?: ReactNode }>(
  Component: ComponentType<P & { theme: Theme }>
): ComponentType<P> => {
  const ComponentWithTheme = (props: P) => {
    const theme = useTheme();
    return (
      <Component {...props} theme={theme}>
        {props.children || null}
      </Component>
    );
  };
  ComponentWithTheme.displayName = `WithTheme(${Component.displayName || Component.name})`;
  return ComponentWithTheme;
};

export const ThemeProvider = ({
  theme,
  children,
  rootCss,
  rootFont = '-apple-system, Roboto, sans-serif',
  rootBackgroundColor = 'white',
  disableOutlines = true,
}: {
  theme: Theme;
  children: ReactNode;
  rootCss?: string;
  rootFont?: string;
  rootBackgroundColor?: string;
  disableOutlines?: boolean;
}) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore cannot add colors to ThemeInterface because we don't want to restrict it
  const colors = theme.colors as Record<string, string>;
  const backgroundColor =
    rootBackgroundColor.substring(0, 1) === '$'
      ? colors[rootBackgroundColor.substring(1)]
      : rootBackgroundColor;
  return (
    <ThemeContext.Provider value={theme}>
      <>
        {Platform.OS === 'web' ? (
          <style
            // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
            dangerouslySetInnerHTML={{
              __html: `
                html, body, #root {
                  font-family: ${rootFont};
                  min-height: 100%;
                  background: ${backgroundColor};
                  font-size: ${theme.rem}px;
                }
                #root { display: flex; }
                ${disableOutlines ? 'textarea, select, input { outline: none; }' : ''}
                ${rootCss || ''}
              `,
            }}
            key="global_style"
          />
        ) : null}
        {children}
      </>
    </ThemeContext.Provider>
  );
};

// css-to-react-native only supports proper css color values, so we resolve color variables to transparent hex values when compiling the template strings and then transform them back and dynamically resolve them from the theme when rendering
let currentColorId = 1;
const themeColors = {
  hexForVarName: new Map<string, string>([]),
  nameForHex: new Map<string, string>([]),
};
export const resolveColorVariablePlaceholder = (variableName: string): string => {
  if (!themeColors.hexForVarName.has(variableName)) {
    const hexPlaceholder = `#${(currentColorId++).toString(16).padStart(6, '0').toUpperCase()}00`;
    themeColors.hexForVarName.set(variableName, hexPlaceholder);
    themeColors.nameForHex.set(hexPlaceholder, variableName.substring(1));
  }
  return themeColors.hexForVarName.get(variableName)!;
};

// resolve any occurrences of theme variables in the values of a style object
const platformIsWeb = Platform.OS === 'web';

export const resolveLengthUnit = (
  str: string | number | undefined,
  theme: Theme,
  windowDimensions: ScaledSize
): number | string | undefined => {
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
    case '%':
      return str;
    case 'vw':
      return (value * windowDimensions.width) / 100;
    case 'vh':
      return (value * windowDimensions.height) / 100;
    default:
      throw new Error(`cannot parse length string '${str}', unknown unit '${unit}'`);
  }
};

export const resolveThemeVariables = (
  styleObject: { [key: string]: any },
  theme: Theme,
  windowDimensions: ScaledSize
) => {
  for (const key in styleObject) {
    if (key === 'elevation' && theme.elevation) {
      const shadowStyleObject = theme.elevation(styleObject[key] as number);
      for (const shadowKey in shadowStyleObject) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore typescript doesn't understand that we are assigning the same keys here
        styleObject[shadowKey] = shadowStyleObject[shadowKey];
      }
    }
    if (key === 'cursor' && !platformIsWeb) delete styleObject.cursor;
    // resolve all color names to theme variables if possible
    if (colorAttributes.has(key)) {
      const colorName = themeColors.nameForHex.get(styleObject[key]);
      if (colorName) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore cannot add colors to ThemeInterface because we don't want to restrict it
        const colors = theme.colors as Record<string, string>;
        if (colorName in colors) {
          styleObject[key] = colors[colorName];
        } else {
          throw new Error(`the color variable '$${colorName}' has not been defined in the theme.`);
        }
      }
    }
    // resolve all rem and viewport units unless on web where they are supported natively
    if (!platformIsWeb && lengthAttributes.has(key) && typeof styleObject[key] === 'string') {
      styleObject[key] = resolveLengthUnit(styleObject[key], theme, windowDimensions);
    }
  }
  return styleObject;
};

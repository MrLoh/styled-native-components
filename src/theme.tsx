import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';

import type { ReactNode, ComponentType } from 'react';
import type { ScaledSize } from 'react-native';
import type { Style } from 'css-to-react-native';

import { colorAttributes, lengthAttributes } from './attribute-sets';

export interface ThemeInterface {
  rem: number;
  colors: { [key: string]: string };
  elevation: (value: number) => Style;
}

/**
 * This interface can be augmented by users to add types to `styled-components`' default theme
 * without needing to reexport `ThemedStyledComponentsModule`.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DefaultTheme extends ThemeInterface {}

export let ThemeContext = createContext(null) as React.Context<DefaultTheme | null>;

export const setThemeContext = (ExternalThemeContext: React.Context<DefaultTheme | null>) => {
  ThemeContext = ExternalThemeContext;
};

export const useTheme = (): DefaultTheme => {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('missing theme context, wrap your app in a ThemeProvider');
  return theme;
};

export const withTheme = <P extends { children?: ReactNode }>(
  Component: ComponentType<P & { theme: DefaultTheme }>
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
}: {
  theme: DefaultTheme;
  children: ReactNode;
}) => {
  return (
    <ThemeContext.Provider value={theme}>
      <>
        {Platform.OS === 'web' ? (
          <style
            // eslint-disable-next-line react-perf/jsx-no-new-object-as-prop
            dangerouslySetInnerHTML={{
              __html: `
              html, body, #root {
                font-family: -apple-system, Roboto, sans-serif;
                min-height: 100%;
                background: ${theme.colors.background || 'white'};
                font-size: ${theme.rem}px;
              }
              #root { display: flex; }
              textarea, select, input { outline: none; }
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

// resolve any occurences of theme variables in the values of a style object
const plattformIsWeb = Platform.OS === 'web';
export const resolveThemeVariables = (
  styleObject: { [key: string]: any },
  theme: DefaultTheme,
  windowDimensions: ScaledSize
) => {
  for (const key in styleObject) {
    if (key === 'elevation' && theme.elevation) {
      const shadowStyleObject = theme.elevation(styleObject[key] as number);
      for (const shadowKey in shadowStyleObject) {
        styleObject[shadowKey] = shadowStyleObject[shadowKey];
      }
    }
    if (key === 'cursor' && !plattformIsWeb) delete styleObject.cursor;
    // resolve all color names to theme variables if possible
    if (colorAttributes.has(key)) {
      const colorName = themeColors.nameForHex.get(styleObject[key]);
      if (colorName) {
        if (colorName in theme.colors) {
          styleObject[key] = theme.colors[colorName];
        } else {
          throw new Error(`the color variable '$${colorName}' has not been defined in the theme.`);
        }
      }
    }
    // resolve all rem and viewport units unless on web where they are supported natively
    if (!plattformIsWeb && lengthAttributes.has(key) && typeof styleObject[key] === 'string') {
      if (!plattformIsWeb) {
        if (styleObject[key].includes('rem')) {
          styleObject[key] = Number.parseFloat(styleObject[key]) * theme.rem;
        } else if (styleObject[key].includes('vw')) {
          styleObject[key] = (Number.parseFloat(styleObject[key]) * windowDimensions.width) / 100;
        } else if (styleObject[key].includes('vh')) {
          styleObject[key] = (Number.parseFloat(styleObject[key]) * windowDimensions.height) / 100;
        }
      }
    }
  }
  return styleObject;
};

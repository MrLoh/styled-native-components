import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import type { ColorSchemeName } from 'react-native';

import debounce from './debounce';

const COLOR_SCHEME_DEBOUNCE = 250;

const colorSchemeListeners = new Map();

let initialColorScheme = Appearance.getColorScheme();
Appearance.addChangeListener(
  debounce(({ colorScheme }) => {
    initialColorScheme = colorScheme;
    colorSchemeListeners.forEach((listener) => listener(colorScheme));
  }, COLOR_SCHEME_DEBOUNCE)
);

let colorSchemeListenerId = 0;
// the standard use color scheme hook from react native rerenders when the app goes into the background
// https://github.com/expo/expo/issues/10815
export const useColorScheme = (): ColorSchemeName => {
  const [colorScheme, setColorScheme] = useState(initialColorScheme);
  useEffect(() => {
    const listenerId = colorSchemeListenerId++;
    colorSchemeListeners.set(listenerId, setColorScheme);
    return () => {
      colorSchemeListeners.delete(listenerId);
    };
  }, []);
  return colorScheme;
};

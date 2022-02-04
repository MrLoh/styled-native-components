import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

import type { ScaledSize } from 'react-native';

import debounce from './debounce';

const WINDOW_DIMENSIONS_DEBOUNCE = 500;
const windowDimensionListeners = new Map();

let initialWindowDimensions = Dimensions.get('window');
Dimensions.addEventListener(
  'change',
  debounce(({ window }) => {
    initialWindowDimensions = window;
    windowDimensionListeners.forEach((listener) => listener(window));
  }, WINDOW_DIMENSIONS_DEBOUNCE)
);

let windowDimensionListenerId = 0;
// the standard use window dimensions hook from react native causes performance problems
// https://github.com/MrLoh/styled-native-components/issues/12
export const useWindowDimensions = (): ScaledSize => {
  const [dimensions, setDimensions] = useState(initialWindowDimensions);
  useEffect(() => {
    const listenerId = windowDimensionListenerId++;
    windowDimensionListeners.set(listenerId, setDimensions);
    return () => {
      windowDimensionListeners.delete(listenerId);
    };
  }, []);
  return dimensions;
};

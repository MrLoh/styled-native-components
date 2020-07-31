import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

import type { ScaledSize } from 'react-native';

const WINDOW_DIMENSIONS_DEBOUNCE = 500;
const windowDimensionListeners = new Map();
let initialWindowDimensions = Dimensions.get('window');
let timeoutId: NodeJS.Timeout | undefined;
Dimensions.addEventListener('change', ({ window }) => {
  timeoutId && clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    initialWindowDimensions = window;
    windowDimensionListeners.forEach((listener) => listener(window));
  }, WINDOW_DIMENSIONS_DEBOUNCE);
});

let windowDimensionListenerId = 0;
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

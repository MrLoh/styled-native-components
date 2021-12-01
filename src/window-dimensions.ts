import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';

import type { ScaledSize } from 'react-native';
import { ComponentSizeChanges } from 'make-styles';

const WINDOW_DIMENSIONS_DEBOUNCE = 500;
const windowDimensionListeners = new Map();
let initialWindowDimensions = Dimensions.get('window');

const debounce = (fn: (...args: any[]) => void, duration = 100) => {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: Parameters<typeof fn>) => { 
    const invoke = () => {
      timeout = undefined;
      return fn(...args); 
    }
    timeout && clearTimeout(timeout);
    timeout = setTimeout(invoke, duration); 
  }
}

const handleWindowDimensionsChange = ({window}: Parameters<Parameters<typeof Dimensions.addEventListener>[1]>[0]) => {
  initialWindowDimensions = window;
  windowDimensionListeners.forEach((listener) => listener(window));

}

Dimensions.addEventListener('change', debounce(handleWindowDimensionsChange, WINDOW_DIMENSIONS_DEBOUNCE));

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

export const useContainerDimensions = (): ComponentSizeChanges => {
  const [size, setSize] = useState({ height: 0, width: 0 });
  const onLayout = useMemo(
    () =>
      debounce((event) => {
        const { height = 0, width = 0 } = event.nativeEvent?.layout;
        setSize({ height, width });
      }, WINDOW_DIMENSIONS_DEBOUNCE),
    [],
  );
  return [size, onLayout];
};

import { useMemo, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

export type GenericSize = { height: number; width: number };
export type ComponentSizeChanges = [GenericSize, (event: LayoutChangeEvent) => void];

const WINDOW_DIMENSIONS_DEBOUNCE = 500;

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

export const useComponentDimensions = (): ComponentSizeChanges => {
  const [size, setSize] = useState({ height: -1, width: -1 });
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
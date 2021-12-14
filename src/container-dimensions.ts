import { useMemo, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

import debounce from './debounce';

export type GenericSize = { height: number; width: number };
export type ComponentSizeChanges = [GenericSize, (event: LayoutChangeEvent) => void];

const EXPORT_DIMENSIONS_DEBOUNCE = 500;

export const useComponentDimensions = (): ComponentSizeChanges => {
  const [size, setSize] = useState({ height: -1, width: -1 });
  const onLayout = useMemo(
    () =>
      debounce((event) => {
        const { height = 0, width = 0 } = event.nativeEvent?.layout;
        setSize({ height, width });
      }, EXPORT_DIMENSIONS_DEBOUNCE),
    []
  );
  return [size, onLayout];
};

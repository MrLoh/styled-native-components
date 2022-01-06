import { useEffect } from 'react';

// Components
type Style = Object;

export const View = jest.fn(({ onLayout, style, children }) => {
  // needed to make container dimensions work
  useEffect(() => {
    onLayout?.({ nativeEvent: { layout: { width: style.width, height: style.height } } });
  }, []);
  return children || 'View';
});
export const Text = jest.fn(() => 'Text');
export const Image = jest.fn(() => 'Image');
export const TextInput = jest.fn(() => 'TextInput');
export const ScrollView = jest.fn(() => 'ScrollView');
export const FlatList = jest.fn(() => 'FlatList');
export const SectionList = jest.fn(() => 'SectionList');
export const TouchableOpacity = jest.fn(() => 'TouchableOpacity');
export const SafeAreaView = jest.fn(() => 'SafeAreaView');

// Other
export const StyleSheet = {
  create: jest.fn((s) => s),
  flatten: (styles: Style[]) => Object.assign({}, ...styles),
};
export const Platform = { OS: 'test' };
export const Dimensions = {
  get: jest.fn(() => ({ width: 100, height: 100, scale: 1, fontScale: 1 })),
  addEventListener: jest.fn(() => {}),
};

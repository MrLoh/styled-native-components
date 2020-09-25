// Components
export const View = jest.fn(() => 'View');
export const Text = jest.fn(() => 'Text');
export const Image = jest.fn(() => 'Image');
export const TextInput = jest.fn(() => 'TextInput');
export const ScrollView = jest.fn(() => 'ScrollView');
export const FlatList = jest.fn(() => 'FlatList');
export const SectionList = jest.fn(() => 'SectionList');
export const TouchableOpacity = jest.fn(() => 'TouchableOpacity');
export const SafeAreaView = jest.fn(() => 'SafeAreaView');

// Other
export const useWindowDimensions = () => ({ width: 100, height: 100 });
export const StyleSheet = { create: jest.fn((s) => s) };
export const Platform = { OS: 'test' };

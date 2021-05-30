import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  FlatList,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
  FlatListProps,
  SectionListProps,
} from 'react-native';

import { useWindowDimensions } from './window-dimensions';
import { ThemeProvider, useTheme, withTheme, ThemeContext, setThemeContext } from './theme';
import { makeTemplateFunction, useStyle } from './make-styles';
import { useLengthAttribute, useColorAttribute } from './attribute-hooks';
import {
  makePropsFilter,
  viewProps,
  textProps,
  imageProps,
  listProps,
  pressableProps,
  inputProps,
  domProps,
} from './prop-sets';

import type { ComponentType } from 'react';
import type { Theme, ThemeInterface } from './theme';
import type { TemplateFunction, AttrProps } from './make-styles';

interface StyledInterface<I> {
  <P>(...args: Parameters<TemplateFunction<I, P>>): ReturnType<TemplateFunction<I, P>>;
  attrs: <P, A>(attrMaker: A | ((props: AttrProps<P, I, A>) => A)) => TemplateFunction<I, P, A>;
}

const styled = <I>(Component: ComponentType<I>, filterComponentProps = (p: any): I => p) => {
  const templateFunction = makeTemplateFunction<I>(
    Component,
    (props) => props,
    filterComponentProps
  ) as StyledInterface<I>;
  // it is impossible to infer the return value of attrMaker, it has to be typed explicitly
  templateFunction.attrs = <P, A>(attrMaker: A | ((props: AttrProps<P, I, A>) => A)) => {
    const transformProps = (props: AttrProps<P, I, A>): AttrProps<P, I, A> & A => ({
      ...props,
      ...(attrMaker instanceof Function ? attrMaker(props) : attrMaker),
    });
    return makeTemplateFunction<I, P, A>(Component, transformProps, filterComponentProps);
  };
  return templateFunction;
};

styled.View = styled(View, makePropsFilter(viewProps, domProps));
styled.Text = styled(Text, makePropsFilter(textProps, domProps));
styled.Image = styled(Image, makePropsFilter(imageProps, domProps));
styled.ScrollView = styled(ScrollView, makePropsFilter(listProps, domProps));
styled.FlatList = styled<FlatListProps<any>>(FlatList, makePropsFilter(listProps, domProps));
styled.SectionList = styled<SectionListProps<any>>(
  SectionList,
  makePropsFilter(listProps, domProps)
);
styled.TouchableOpacity = styled(TouchableOpacity, makePropsFilter(pressableProps, domProps));
styled.TextInput = styled(TextInput, makePropsFilter(inputProps, viewProps, textProps, domProps));
styled.SafeAreaView = styled(SafeAreaView, makePropsFilter(viewProps, domProps));

export default styled;

export const filterProps = makePropsFilter(
  viewProps,
  textProps,
  imageProps,
  listProps,
  pressableProps,
  inputProps,
  domProps
);

export {
  ThemeProvider,
  useTheme,
  useStyle,
  withTheme,
  ThemeContext,
  setThemeContext,
  useLengthAttribute,
  useColorAttribute,
  useWindowDimensions,
};

export type { Theme, ThemeInterface };
export type { Style } from 'css-to-react-native';

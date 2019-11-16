// @flow
import {
  useMemo,
  useContext,
  useState,
  useEffect,
  forwardRef,
  memo,
  createElement,
  createContext,
} from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  FlatList,
  SectionList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { getPropertyName, getStylesForProperty } from 'css-to-react-native';

const colorAttributes = new Set([
  'backgroundColor',
  'color',
  'borderRightColor',
  'borderBottomColor',
  'borderColor',
  'borderEndColor',
  'borderLeftColor',
  'backgroundColor',
  'borderStartColor',
  'borderTopColor',
  'shadowColor',
]);
const lengthAttributes = new Set([
  'width',
  'height',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderRadius',
  'borderRightWidth',
  'borderTopWidth',
  'borderWidth',
  'flexBasis',
  'bottom',
  'end',
  'left',
  'right',
  'start',
  'top',
  'margin',
  'marginBottom',
  'marginEnd',
  'marginHorizontal',
  'marginLeft',
  'marginRight',
  'marginStart',
  'marginTop',
  'marginVertical',
  'maxHeight',
  'maxWidth',
  'minHeight',
  'minWidth',
  'padding',
  'paddingBottom',
  'paddingEnd',
  'paddingHorizontal',
  'paddingLeft',
  'paddingRight',
  'paddingStart',
  'paddingTop',
  'paddingVertical',
  'shadowOffset',
  'shadowRadius',
  'lineHeight',
  'fontSize',
  'letterSpacing',
]);

const WINDOW_DIMENSIONS_DEBOUNCE = 500;
const windowDimensionListeners = new Map();
let initialWindowDimensions = Dimensions.get('window');
let timeoutId = null;
Dimensions.addEventListener('change', ({ window }) => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    initialWindowDimensions = window;
    windowDimensionListeners.forEach((listener) => listener(window));
  }, WINDOW_DIMENSIONS_DEBOUNCE);
});

let windowDimensionListenerId = 0;
export const useWindowDimensions = () /*: { width: number, height: number }*/ => {
  const [dimensions, setDimensions] = useState(initialWindowDimensions);
  useEffect(() => {
    const listenerId = windowDimensionListenerId++;
    windowDimensionListeners.set(listenerId, setDimensions);
    return () => windowDimensionListeners.delete(listenerId);
  }, []);
  return dimensions;
};

export let ThemeContext = createContext({});

// resolve css template literal content into a single string, allow for props functions
const cssCommentRegexp = new RegExp('\\/\\*[^]+?\\*\\/', 'g');
const resolveTemplateLiteral = (strings, expressions, props) /*: string*/ =>
  strings
    .map((str, i) => {
      // resolve expressions
      let exp = expressions.length > i ? expressions[i] : '';
      if (typeof exp === 'function') exp = exp(props);
      return str + exp;
    })
    .join('')
    // remove comments
    .replace(cssCommentRegexp, '');

// create a RN style object from a single css declaration
const styleObjectCache = new Map([]);
const createStyleObject = (cssDeclaration /*: string*/) /*: Object*/ => {
  if (!cssDeclaration) return {};
  let styleObject = styleObjectCache.get(cssDeclaration);
  if (!styleObject) {
    styleObject = Object.assign(
      {},
      ...cssDeclaration
        .split(';')
        .map((rule) =>
          rule
            .split(':')
            .map((value) => value && value.trim())
            .filter((value) => value)
        )
        .filter((rule) => rule.length === 2)
        .map(([name, value]) => getStylesForProperty(getPropertyName(name), value))
    );
    styleObjectCache.set(cssDeclaration, styleObject);
  }
  return styleObject;
};

// create an object of RN style objects from a single css declaration
const nestedStyleObjectsCache = new Map([]);
const nestedDeclarationRegExp = new RegExp('\\w+\\s*\\{([^]+?)\\}', 'g');
const createNestedStyleObject = (
  nestedCssDeclaration /*: string*/
) /*: { [key: string]: Object }*/ => {
  let nestedStyleObjects = nestedStyleObjectsCache.get(nestedCssDeclaration);
  if (!nestedStyleObjects) {
    let mainStyleDeclaration = nestedCssDeclaration;
    nestedStyleObjects = {};
    let matches;
    while ((matches = nestedDeclarationRegExp.exec(nestedCssDeclaration))) {
      const [string, content] = matches;
      const declaration = content.trim();
      const name = string.split('{')[0].trim();
      nestedStyleObjects[`${name}Style`] = createStyleObject(declaration);
      mainStyleDeclaration = mainStyleDeclaration.replace(string, '');
    }
    nestedStyleObjects.style = createStyleObject(mainStyleDeclaration.trim());
    nestedStyleObjectsCache.set(nestedCssDeclaration, nestedStyleObjects);
  }
  return nestedStyleObjects;
};

// resolve any occurences of theme variables in the values of a style object
const plattformIsWeb = Platform.OS === 'web';
const resolveThemeVariables = (styleObject, theme, windowDimensions) => {
  for (const key in styleObject) {
    if (theme.customCss && key in theme.customCss) {
      const customStyleObject = theme.customCss[key](styleObject[key]);
      delete styleObject[key];
      for (const k in customStyleObject) {
        styleObject[k] = customStyleObject[k];
      }
    }
    // resolve all color names to theme variables if possible
    if (colorAttributes.has(key) && styleObject[key] in theme.colors) {
      styleObject[key] = theme.colors[styleObject[key]];
    }
    // resolve all rem and viewport units if not on web where they are supported
    if (!plattformIsWeb && lengthAttributes.has(key) && typeof styleObject[key] === 'string') {
      if (styleObject[key].includes('rem')) {
        styleObject[key] = Number.parseFloat(styleObject[key]) * theme.rem;
      } else if (styleObject[key].includes('vw')) {
        styleObject[key] = (Number.parseFloat(styleObject[key]) * windowDimensions.width) / 100;
      } else if (styleObject[key].includes('vh')) {
        styleObject[key] = (Number.parseFloat(styleObject[key]) * windowDimensions.height) / 100;
      }
    }
  }
  return styleObject;
};

// generate styleSheet from nested style Object
const useStyleSheet = (styles /*: { [key: string]: Object }*/, theme) => {
  const windowDimensions = useWindowDimensions();
  return useMemo(() => {
    // we need to make sure to do a deep clone here, so that theme and viewport units can be resolved from original strings
    const stylesCopy = { ...styles };
    for (const key in stylesCopy) {
      stylesCopy[key] = resolveThemeVariables({ ...stylesCopy[key] }, theme, windowDimensions);
    }
    return StyleSheet.create(stylesCopy);
  }, [styles, theme, windowDimensions]);
};

export const ThemeProvider = ({ theme, children }) => {
  return createElement(ThemeContext.Provider, { value: theme }, children);
};

export const useTheme = () => useContext(ThemeContext);

export const parseLengthUnit = (str /*: string*/, theme, windowDimensions) /*: number */ => {
  if (!str || typeof str === 'number') return str;
  const value = Number.parseFloat(str);
  if (value === 0) return 0;
  const unit = str.trim().replace(value, '');
  if (!unit) throw new Error(`length string '${str}' contains no unit`);
  switch (unit) {
    case 'rem':
      return value * theme.rem;
    case 'px':
      return value;
    case 'vw':
      if (!windowDimensions) throw new Error('pass windowDimensions as the 3rd argument');
      return (value * windowDimensions.width) / 100;
    case 'vh':
      if (!windowDimensions) throw new Error('pass windowDimensions as the 3rd argument');
      return (value * windowDimensions.height) / 100;
    default:
      throw new Error(`cannot parse length string '${str}', unknown unit '${unit}'`);
  }
};

export const useParseLengthAttribute = (margin /*: string*/) /*number[]*/ => {
  const theme = useTheme();
  const windowDimensions = useWindowDimensions();
  return useMemo(() => {
    const parsedMargin = margin.replace(/\s\s+/g, ' ').split(' ');
    const pixelValues = parsedMargin.map((str) => parseLengthUnit(str, theme, windowDimensions));
    return [0, 1, 2, 3].map((i) =>
      pixelValues[i] !== undefined
        ? pixelValues[i]
        : pixelValues[i - 2] !== undefined
        ? pixelValues[i - 2]
        : pixelValues[0] || 0
    );
  }, [margin, theme.rem, windowDimensions]);
};

export const withTheme = (Component) => {
  const ComponentWithTheme = ({ children, ...props }) => {
    const theme = useTheme();
    return createElement(Component, { ...props, theme }, children);
  };
  ComponentWithTheme.displayName = `WithTheme(${Component.displayName || Component.name})`;
  return ComponentWithTheme;
};

export const useStyle = (cssDeclaration /*: string*/) => {
  const theme = useContext(ThemeContext);
  const styles = useMemo(() => ({ generated: createStyleObject(cssDeclaration.trim()) }), []);
  return useStyleSheet(styles, theme).generated;
};

const makeTemplateFunction = (Component, transformProps, filterComponentProps) => (
  strings,
  ...expressions
) => {
  const displayName = `Styled(${Component.displayName || Component.name})`;
  let StyledComponentForwardRef;
  if (!expressions.some((exp) => typeof exp === 'function')) {
    // if no props are used in the styles, then we can statically generate the cssString
    const cssString = resolveTemplateLiteral(strings, expressions);
    const styles = createNestedStyleObject(cssString);
    StyledComponentForwardRef = ({ style, children, ...props }, ref) => {
      const theme = useContext(ThemeContext);
      let styleProps = useStyleSheet(styles, theme);
      styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;
      return createElement(
        Component,
        {
          ...filterComponentProps(transformProps({ ...props, theme })),
          ...styleProps,
          ref,
        },
        children
      );
    };
  } else {
    // if the cssString depends on props, we can at least ignore changes to children
    StyledComponentForwardRef = ({ children, style, ...props }, ref) => {
      const theme = useContext(ThemeContext);
      props = transformProps({ ...props, theme });
      const cssString = useMemo(() => {
        return resolveTemplateLiteral(strings, expressions, { ...props, theme });
      }, [props, theme]);
      const styles = useMemo(() => createNestedStyleObject(cssString), [cssString]);
      let styleProps = useStyleSheet(styles, theme);
      styleProps = style ? { ...styleProps, style: [styleProps.style, style] } : styleProps;
      return createElement(
        Component,
        { ...filterComponentProps(props), ...styleProps, ref },
        children
      );
    };
  }
  StyledComponentForwardRef.displayName = displayName;
  return memo(forwardRef(StyledComponentForwardRef));
};
const styled = (Component, filterComponentProps = (p) => p) => {
  const templateFunction = makeTemplateFunction(Component, (props) => props, filterComponentProps);
  templateFunction.attrs = (attrs) => {
    const isFunc = typeof attrs === 'function';
    const transformProps = (props) => ({ ...props, ...(isFunc ? attrs(props) : attrs) });
    return makeTemplateFunction(Component, transformProps, filterComponentProps);
  };
  return templateFunction;
};

export const setThemeContext = (ExternalThemeContext) => {
  ThemeContext = ExternalThemeContext;
};

const viewProps = new Set([
  'onStartShouldSetResponder',
  'accessibilityLabel',
  'accessibilityHint',
  'hitSlop',
  'nativeID',
  'onAccessibilityTap',
  'onLayout',
  'onMagicTap',
  'onMoveShouldSetResponder',
  'onMoveShouldSetResponderCapture',
  'onResponderGrant',
  'onResponderMove',
  'onResponderReject',
  'onResponderRelease',
  'onResponderTerminate',
  'onResponderTerminationRequest',
  'accessible',
  'onStartShouldSetResponderCapture',
  'pointerEvents',
  'removeClippedSubviews',
  'testID',
  'accessibilityComponentType',
  'accessibilityLiveRegion',
  'collapsable',
  'importantForAccessibility',
  'needsOffscreenAlphaCompositing',
  'renderToHardwareTextureAndroid',
  'accessibilityRole',
  'accessibilityStates',
  'accessibilityTraits',
  'accessibilityViewIsModal',
  'accessibilityElementsHidden',
  'accessibilityIgnoresInvertColors',
  'shouldRasterizeIOS',
]);

const domProps = new Set([
  'allowFullScreen',
  'autoComplete',
  'autoFocus',
  'challenge',
  'charSet',
  'checked',
  'className',
  'content',
  'contentEditable',
  'crossOrigin',
  'data',
  'disabled',
  'draggable',
  'href',
  'id',
  'scrolling',
  'spellCheck',
  'tabIndex',
  'target',
  'type',
  'wrap',
  'onCopy',
  'onCut',
  'onPaste',
  'onCompositionEnd',
  'onCompositionStart',
  'onCompositionUpdate',
  'onKeyDown',
  'onKeyPress',
  'onKeyUp',
  'onFocus',
  'onBlur',
  'onChange',
  'onInput',
  'onInvalid',
  'onSubmit',
  'onClick',
  'onContextMenu',
  'onDoubleClick',
  'onDrag',
  'onDragEnd',
  'onDragEnter',
  'onDragExit',
  'onDragLeave',
  'onDragOver',
  'onDragStart',
  'onDrop',
  'onMouseDown',
  'onMouseEnter',
  'onMouseLeave',
  'onMouseMove',
  'onMouseOut',
  'onMouseOver',
  'onMouseUp',
  'onPointerDown',
  'onPointerMove',
  'onPointerUp',
  'onPointerCancel',
  'onGotPointerCapture',
  'onLostPointerCapture',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerOver',
  'onPointerOut',
  'onSelect',
  'onTouchCancel',
  'onTouchEnd',
  'onTouchMove',
  'onTouchStart',
  'onScroll',
  'onWheel',
  'onAnimationStart',
  'onAnimationEnd',
  'onAnimationIteration',
  'onTransitionEnd',
  'onToggle',
]);

const textProps = new Set([
  'selectable',
  'accessibilityHint',
  'accessibilityLabel',
  'accessible',
  'ellipsizeMode',
  'nativeID',
  'numberOfLines',
  'onLayout',
  'onLongPress',
  'onPress',
  'pressRetentionOffset',
  'allowFontScaling',
  'style',
  'testID',
  'disabled',
  'selectionColor',
  'textBreakStrategy',
  'adjustsFontSizeToFit',
  'minimumFontScale',
  'suppressHighlighting',
]);

const imageProps = new Set([
  'blurRadius',
  'onLayout',
  'onLoad',
  'onLoadEnd',
  'onLoadStart',
  'resizeMode',
  'source',
  'loadingIndicatorSource',
  'onError',
  'testID',
  'resizeMethod',
  'accessibilityLabel',
  'accessible',
  'capInsets',
  'defaultSource',
  'onPartialLoad',
  'onProgress',
  'fadeDuration',
]);

const listProps = new Set([
  'renderItem',
  'data',
  'ItemSeparatorComponent',
  'ListEmptyComponent',
  'ListFooterComponent',
  'ListHeaderComponent',
  'columnWrapperStyle',
  'extraData',
  'getItemLayout',
  'horizontal',
  'initialNumToRender',
  'initialScrollIndex',
  'inverted',
  'keyExtractor',
  'numColumns',
  'onEndReached',
  'onEndReachedThreshold',
  'onRefresh',
  'onViewableItemsChanged',
  'progressViewOffset',
  'legacyImplementation',
  'refreshing',
  'removeClippedSubviews',
  'viewabilityConfig',
  'viewabilityConfigCallbackPairs',
  'renderSectionFooter',
  'renderSectionHeader',
  'SectionSeparatorComponent',
  'stickySectionHeadersEnabled',
  'updateCellsBatchingPeriod',
  'windowSize',
  'disableVirtualization',
  'getItem',
  'getItemCount',
  'debug',
  'CellRendererComponent',
  'onLayout',
  'onScrollToIndexFailed',
  'renderScrollComponent',
  'maxToRenderPerBatch',
  'alwaysBounceVertical',
  'contentContainerStyle',
  'keyboardDismissMode',
  'keyboardShouldPersistTaps',
  'onContentSizeChange',
  'onMomentumScrollBegin',
  'onMomentumScrollEnd',
  'onScroll',
  'onScrollBeginDrag',
  'onScrollEndDrag',
  'pagingEnabled',
  'refreshControl',
  'scrollEnabled',
  'showsHorizontalScrollIndicator',
  'showsVerticalScrollIndicator',
  'stickyHeaderIndices',
  'endFillColor',
  'overScrollMode',
  'scrollPerfTag',
  'alwaysBounceHorizontal',
  'automaticallyAdjustContentInsets',
  'bounces',
  'bouncesZoom',
  'canCancelContentTouches',
  'centerContent',
  'contentInset',
  'contentInsetAdjustmentBehavior',
  'contentOffset',
  'decelerationRate',
  'directionalLockEnabled',
  'indicatorStyle',
  'maximumZoomScale',
  'minimumZoomScale',
  'pinchGestureEnabled',
  'scrollEventThrottle',
  'scrollIndicatorInsets',
  'scrollsToTop',
  'snapToAlignment',
  'snapToInterval',
  'snapToOffsets',
  'snapToStart',
  'snapToEnd',
  'zoomScale',
  'nestedScrollEnabled',
]);

const touchableProps = new Set([
  'hitSlop',
  'accessibilityComponentType',
  'accessibilityHint',
  'accessibilityLabel',
  'accessibilityRole',
  'accessibilityStates',
  'accessibilityTraits',
  'accessible',
  'delayLongPress',
  'delayPressIn',
  'delayPressOut',
  'disabled',
  'onBlur',
  'onFocus',
  'onLayout',
  'onLongPress',
  'onPress',
  'onPressIn',
  'onPressOut',
  'pressRetentionOffset',
  'activeOpacity',
  'tvParallaxProperties',
  'hasTVPreferredFocus',
]);

const inputProps = new Set([
  'allowFontScaling',
  'autoCapitalize',
  'autoCorrect',
  'autoFocus',
  'blurOnSubmit',
  'caretHidden',
  'clearButtonMode',
  'clearTextOnFocus',
  'contextMenuHidden',
  'dataDetectorTypes',
  'defaultValue',
  'disableFullscreenUI',
  'editable',
  'enablesReturnKeyAutomatically',
  'inlineImageLeft',
  'inlineImagePadding',
  'keyboardAppearance',
  'keyboardType',
  'maxLength',
  'multiline',
  'numberOfLines',
  'onBlur',
  'onChange',
  'onChangeText',
  'onContentSizeChange',
  'onEndEditing',
  'onFocus',
  'onKeyPress',
  'onScroll',
  'onSelectionChange',
  'onSubmitEditing',
  'placeholder',
  'placeholderTextColor',
  'returnKeyLabel',
  'returnKeyType',
  'scrollEnabled',
  'secureTextEntry',
  'selection',
  'selectionColor',
  'selectionState',
  'selectTextOnFocus',
  'spellCheck',
  'textContentType',
  'style',
  'textBreakStrategy',
  'underlineColorAndroid',
  'value',
]);

const makePropsFilter = (...propsSets) => {
  const allPropsSet = new Set([]);
  for (const set of propsSets) set.forEach((el) => allPropsSet.add(el));

  return (props) => {
    const propsCopy = {};
    for (const key in props) if (allPropsSet.has(key)) propsCopy[key] = props[key];
    return propsCopy;
  };
};

export const filterProps = makePropsFilter(
  viewProps,
  textProps,
  imageProps,
  listProps,
  touchableProps,
  inputProps,
  domProps
);

styled.View = styled(View, makePropsFilter(viewProps, domProps));
styled.Text = styled(Text, makePropsFilter(textProps, domProps));
styled.Image = styled(Image, makePropsFilter(imageProps, domProps));
styled.ScrollView = styled(ScrollView, makePropsFilter(listProps, domProps));
styled.FlatList = styled(FlatList, makePropsFilter(listProps, domProps));
styled.SectionList = styled(SectionList, makePropsFilter(listProps, domProps));
styled.TouchableWithoutFeedback = styled(
  TouchableWithoutFeedback,
  makePropsFilter(touchableProps, domProps)
);
styled.TouchableOpacity = styled(TouchableOpacity, makePropsFilter(touchableProps, domProps));
styled.TextInput = styled(TextInput, makePropsFilter(inputProps, viewProps, textProps, domProps));
styled.SafeAreaView = styled(SafeAreaView, makePropsFilter(viewProps, domProps));

export default styled;

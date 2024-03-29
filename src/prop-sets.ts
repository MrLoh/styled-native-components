import type {
  ViewProps,
  TextProps,
  ImageProps,
  VirtualizedListProps,
  TextInputProps,
  PressableProps,
  AccessibilityProps,
  TouchableOpacityProps,
} from 'react-native';

type AccessibilityPropName = keyof AccessibilityProps;
const accessibilityPropNames = [
  'accessible',
  'accessibilityActions',
  'accessibilityLabel',
  'accessibilityRole',
  'accessibilityState',
  'accessibilityHint',
  'accessibilityValue',
  'onAccessibilityAction',
  'accessibilityComponentType',
  'accessibilityLiveRegion',
  'importantForAccessibility',
  'accessibilityElementsHidden',
  'accessibilityTraits',
  'accessibilityViewIsModal',
  'onAccessibilityEscape',
  'onAccessibilityTap',
  'onMagicTap',
  'accessibilityIgnoresInvertColors',
] as const;
// this ensures that we get typescript errors if a key from ViewProps is missing
const accessibilityPropNamesWithEnsuredCompleteKeys: readonly typeof accessibilityPropNames[number][] =
  accessibilityPropNames as readonly AccessibilityPropName[];

type ViewPropName = keyof ViewProps;
const viewPropNames = [
  'style',
  ...accessibilityPropNamesWithEnsuredCompleteKeys,
  'onStartShouldSetResponder',
  'hitSlop',
  'nativeID',
  'onLayout',
  'onMoveShouldSetResponder',
  'onMoveShouldSetResponderCapture',
  'onResponderGrant',
  'onResponderMove',
  'onResponderReject',
  'onResponderRelease',
  'onResponderTerminate',
  'onResponderTerminationRequest',
  'onStartShouldSetResponderCapture',
  'pointerEvents',
  'removeClippedSubviews',
  'testID',
  'collapsable',
  'needsOffscreenAlphaCompositing',
  'renderToHardwareTextureAndroid',
  'shouldRasterizeIOS',
  'focusable',
  'isTVSelectable',
  'hasTVPreferredFocus',
  'tvParallaxProperties',
  'tvParallaxShiftDistanceX',
  'tvParallaxShiftDistanceY',
  'tvParallaxTiltAngle',
  'tvParallaxMagnification',
  'onResponderEnd',
  'onResponderStart',
  'onTouchStart',
  'onTouchMove',
  'onTouchEnd',
  'onTouchCancel',
  'onTouchEndCapture',
  'children',
] as const;
// this ensures that we get typescript errors if a key from ViewProps is missing
const viewPropNamesWithEnsuredCompleteKeys: readonly typeof viewPropNames[number][] =
  viewPropNames as readonly ViewPropName[];
export const viewProps = new Set(viewPropNamesWithEnsuredCompleteKeys);

type TextPropName = keyof TextProps;
const textPropNames = [
  'style',
  ...accessibilityPropNamesWithEnsuredCompleteKeys,
  'selectable',
  'ellipsizeMode',
  'nativeID',
  'numberOfLines',
  'onLayout',
  'onLongPress',
  'onPress',
  'pressRetentionOffset',
  'allowFontScaling',
  'testID',
  'disabled',
  'selectionColor',
  'textBreakStrategy',
  'adjustsFontSizeToFit',
  'minimumFontScale',
  'suppressHighlighting',
  'pointerEvents',
  'lineBreakMode',
  'maxFontSizeMultiplier',
  'children',
  'onTextLayout',
  'onPressIn',
  'onPressOut',
  'dataDetectorType',
  'android_hyphenationFrequency',
] as const;
// this ensures that we get typescript errors if a key from ViewProps is missing
const textPropNamesWithEnsuredCompleteKeys: readonly typeof textPropNames[number][] =
  textPropNames as readonly TextPropName[];
export const textProps = new Set(textPropNamesWithEnsuredCompleteKeys);

// we don't want props that may conflict with styles
type ImagePropName = Exclude<
  keyof ImageProps,
  | 'borderRadius'
  | 'borderTopLeftRadius'
  | 'borderTopRightRadius'
  | 'borderBottomLeftRadius'
  | 'borderBottomRightRadius'
  | 'width'
  | 'height'
>;
const imagePropNames = [
  'style',
  ...accessibilityPropNamesWithEnsuredCompleteKeys,
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
  'capInsets',
  'defaultSource',
  'onPartialLoad',
  'onProgress',
  'fadeDuration',
  'pointerEvents',
  'progressiveRenderingEnabled',
  'nativeID',
] as const;
// this ensures that we get typescript errors if a key from ViewProps is missing
const imagePropNamesWithEnsuredCompleteKeys: readonly typeof imagePropNames[number][] =
  imagePropNames as readonly ImagePropName[];
export const imageProps = new Set(imagePropNamesWithEnsuredCompleteKeys);

type ListPropName = keyof VirtualizedListProps<any>;
const listPropNames = [
  ...viewPropNamesWithEnsuredCompleteKeys,
  'columnWrapperStyle',
  'contentContainerStyle',
  'indicatorStyle',
  ...accessibilityPropNamesWithEnsuredCompleteKeys,
  'renderItem',
  'data',
  'sections',
  'ItemSeparatorComponent',
  'ListEmptyComponent',
  'ListFooterComponent',
  'ListHeaderComponent',
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
  'onScrollToIndexFailed',
  'renderScrollComponent',
  'maxToRenderPerBatch',
  'alwaysBounceVertical',
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
  'listKey',
  'invertStickyHeaders',
  'disableIntervalMomentum',
  'disableScrollViewPanResponder',
  'onScrollAnimationEnd',
  'scrollToOverflowEnabled',
  'onScrollToTop',
  'fadingEdgeLength',
  'persistentScrollbar',
  'stickyHeaderHiddenOnScroll',
  'StickyHeaderComponent',
  'maintainVisibleContentPosition',
  'automaticallyAdjustsScrollIndicatorInsets',
] as const;
// this ensures that we get typescript errors if a key from ViewProps is missing
const listPropNamesWithEnsuredCompleteKeys: readonly typeof listPropNames[number][] =
  listPropNames as readonly ListPropName[];
export const listProps = new Set(listPropNamesWithEnsuredCompleteKeys);

type InputPropName = keyof TextInputProps;
const inputPropNames = [
  ...viewPropNamesWithEnsuredCompleteKeys,
  ...accessibilityPropNamesWithEnsuredCompleteKeys,
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
  'textBreakStrategy',
  'underlineColorAndroid',
  'value',
  'maxFontSizeMultiplier',
  'onTextInput',
  'inputAccessoryViewID',
  'passwordRules',
  'rejectResponderTermination',
  'autoCompleteType',
  'importantForAutofill',
  'textAlignVertical',
  'showSoftInputOnFocus',
  'onPressIn',
  'onPressOut',
  'textAlign',
  'autoComplete',
] as const;
// this ensures that we get typescript errors if a key from ViewProps is missing
const inputPropNamesWithEnsuredCompleteKeys: readonly typeof inputPropNames[number][] =
  inputPropNames as readonly InputPropName[];
export const inputProps = new Set(inputPropNamesWithEnsuredCompleteKeys);

type PressablePropName = keyof PressableProps | keyof TouchableOpacityProps;
const pressablePropNames = [
  ...viewPropNamesWithEnsuredCompleteKeys,
  ...accessibilityPropNamesWithEnsuredCompleteKeys,
  'delayLongPress',
  'delayPressIn',
  'delayPressOut',
  'disabled',
  'onBlur',
  'onFocus',
  'onLongPress',
  'onPress',
  'onPressIn',
  'onPressOut',
  'pressRetentionOffset',
  'activeOpacity',
  'children',
  'android_disableSound',
  'android_ripple',
  'testOnly_pressed',
  'touchSoundDisabled',
  'cancelable',
  'nextFocusDown',
  'nextFocusForward',
  'nextFocusLeft',
  'nextFocusRight',
  'nextFocusUp',
] as const;
// this ensures that we get typescript errors if a key from ViewProps is missing
const pressablePropNamesWithEnsuredCompleteKeys: readonly typeof pressablePropNames[number][] =
  pressablePropNames as readonly PressablePropName[];
export const pressableProps = new Set(pressablePropNamesWithEnsuredCompleteKeys);

export const domProps = new Set([
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

export const makePropsFilter = <I>(...propsSets: Set<string>[]): ((props: any) => I) => {
  const allPropsSet = new Set<string>([]);
  for (const set of propsSets) set.forEach((el) => allPropsSet.add(el));

  return (props: any) => {
    const propsCopy: any = {};
    for (const key in props) if (allPropsSet.has(key)) propsCopy[key] = props[key];
    return propsCopy as I;
  };
};

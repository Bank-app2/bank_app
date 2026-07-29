import Ionicons from '@expo/vector-icons/Ionicons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof Ionicons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Ionicons mappings here.
 * - see Ionicons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house': 'home-outline',
  'house.fill': 'home',
  'paperplane': 'paper-plane-outline',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code-working-outline',
  'chevron.right': 'chevron-forward',
  'mic': 'mic-outline',
  'tray': 'inbox-outline',
  'gearshape': 'settings-outline',
  'eye': 'eye-outline',
  'eye.slash': 'eye-off-outline',
  'doc.on.doc': 'copy-outline',
  'creditcard': 'card-outline',
  'arrow.up.circle': 'arrow-up-circle-outline',
  'arrow.down.circle': 'arrow-down-circle-outline',
  'doc.text': 'document-text-outline',
  'archivebox': 'archive-outline',
  'lock': 'lock-closed-outline',
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Ionicons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Ionicons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <Ionicons color={color} size={size} name={MAPPING[name]} style={style} />;
}


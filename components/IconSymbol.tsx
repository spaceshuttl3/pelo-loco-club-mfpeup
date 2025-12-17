
import {
  OpaqueColorValue,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { SymbolWeight } from "expo-symbols";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'person.fill': 'person',
  'calendar': 'event',
  'calendar.badge.plus': 'event-available',
  'bag.fill': 'shopping-bag',
  'gift.fill': 'card-giftcard',
  'list.bullet': 'list',
  'clock': 'access-time',
  'checkmark.circle.fill': 'check-circle',
  'plus.circle.fill': 'add-circle',
  'trash': 'delete',
  'cart': 'shopping-cart',
  'cart.fill': 'shopping-cart',
  'minus': 'remove',
  'plus': 'add',
  'photo': 'photo-camera',
  'pencil': 'edit',
  'ticket': 'confirmation-number',
  'shippingbox.fill': 'local-shipping',
  'cube.fill': 'inventory',
  'scissors': 'content-cut',
  'birthday.cake.fill': 'cake',
  'chart.bar.fill': 'bar-chart',
  'bell.fill': 'notifications',
  'rectangle.portrait.and.arrow.right': 'logout',
  'star.fill': 'star',
  'trophy.fill': 'emoji-events',
  'xmark': 'close',
  'magnifyingglass': 'search',
  'heart.fill': 'favorite',
  'heart': 'favorite-border',
  'info.circle': 'info',
  'exclamationmark.triangle': 'warning',
  'checkmark': 'check',
  'arrow.right': 'arrow-forward',
  'arrow.left': 'arrow-back',
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name];
  
  if (!iconName) {
    console.warn(`Icon "${name}" not found in mapping. Using default icon.`);
    return (
      <MaterialIcons
        color={color}
        size={size}
        name="help-outline"
        style={style as StyleProp<TextStyle>}
      />
    );
  }
  
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={iconName as any}
      style={style as StyleProp<TextStyle>}
    />
  );
}
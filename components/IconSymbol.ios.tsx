
import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle, View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Mapping for iOS SF Symbols - these are the actual SF Symbol names
const IOS_SYMBOL_MAPPING = {
  'house.fill': 'house.fill',
  'paperplane.fill': 'paperplane.fill',
  'chevron.left.forwardslash.chevron.right': 'chevron.left.forwardslash.chevron.right',
  'chevron.right': 'chevron.right',
  'chevron.left': 'chevron.left',
  'chevron.up': 'chevron.up',
  'chevron.down': 'chevron.down',
  'person.fill': 'person.fill',
  'person.3': 'person.3',
  'calendar': 'calendar',
  'calendar.badge.plus': 'calendar.badge.plus',
  'bag.fill': 'bag.fill',
  'bag': 'bag',
  'gift.fill': 'gift.fill',
  'list.bullet': 'list.bullet',
  'clock': 'clock',
  'checkmark.circle.fill': 'checkmark.circle.fill',
  'plus.circle.fill': 'plus.circle.fill',
  'trash': 'trash',
  'cart': 'cart',
  'cart.fill': 'cart.fill',
  'minus': 'minus',
  'plus': 'plus',
  'photo': 'photo',
  'camera.fill': 'camera.fill',
  'pencil': 'pencil',
  'ticket': 'ticket',
  'shippingbox.fill': 'shippingbox.fill',
  'cube.fill': 'cube.fill',
  'scissors': 'scissors',
  'birthday.cake.fill': 'birthday.cake.fill',
  'chart.bar.fill': 'chart.bar.fill',
  'bell.fill': 'bell.fill',
  'rectangle.portrait.and.arrow.right': 'rectangle.portrait.and.arrow.right',
  'star.fill': 'star.fill',
  'trophy.fill': 'trophy.fill',
  'xmark': 'xmark',
  'magnifyingglass': 'magnifyingglass',
  'heart.fill': 'heart.fill',
  'heart': 'heart',
  'info.circle': 'info.circle',
  'exclamationmark.triangle': 'exclamationmark.triangle',
  'checkmark': 'checkmark',
  'arrow.right': 'arrow.right',
  'arrow.left': 'arrow.left',
  'line.3.horizontal.decrease.circle': 'line.3.horizontal.decrease.circle',
  'phone.fill': 'phone.fill',
} as const;

// Fallback to Material Icons if SF Symbol is not available
const MATERIAL_FALLBACK = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'person.fill': 'person',
  'person.3': 'people',
  'calendar': 'event',
  'calendar.badge.plus': 'event-available',
  'bag.fill': 'shopping-bag',
  'bag': 'shopping-bag',
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
  'camera.fill': 'photo-camera',
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
  'line.3.horizontal.decrease.circle': 'filter-list',
  'phone.fill': 'phone',
} as const;

export type IconSymbolName = keyof typeof IOS_SYMBOL_MAPPING;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = "regular",
}: {
  name: IconSymbolName;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  const symbolName = IOS_SYMBOL_MAPPING[name];
  
  if (!symbolName) {
    console.warn(`Icon "${name}" not found in iOS mapping. Using Material Icons fallback.`);
    const fallbackIcon = MATERIAL_FALLBACK[name] || 'help-outline';
    return (
      <MaterialIcons
        color={color}
        size={size}
        name={fallbackIcon as any}
        style={style as any}
      />
    );
  }

  try {
    return (
      <SymbolView
        weight={weight}
        tintColor={color}
        resizeMode="scaleAspectFit"
        name={symbolName}
        style={[
          {
            width: size,
            height: size,
          },
          style,
        ]}
        fallback={
          <MaterialIcons
            color={color}
            size={size}
            name={(MATERIAL_FALLBACK[name] || 'help-outline') as any}
          />
        }
      />
    );
  } catch (error) {
    console.warn(`Error rendering SF Symbol "${name}":`, error);
    const fallbackIcon = MATERIAL_FALLBACK[name] || 'help-outline';
    return (
      <MaterialIcons
        color={color}
        size={size}
        name={fallbackIcon as any}
        style={style as any}
      />
    );
  }
}

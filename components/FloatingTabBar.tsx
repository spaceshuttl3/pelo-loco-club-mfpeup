
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 40,
  borderRadius = 30,
  bottomMargin = 20,
}: FloatingTabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const handleTabPress = (route: string) => {
    console.log('FloatingTabBar - Tab pressed:', route);
    try {
      router.push(route as any);
    } catch (error) {
      console.error('FloatingTabBar - Navigation error:', error);
    }
  };

  // Find the active tab index
  React.useEffect(() => {
    const index = tabs.findIndex((tab) => pathname.includes(tab.name));
    if (index !== -1) {
      activeIndex.value = withSpring(index);
    }
  }, [pathname, tabs]);

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = containerWidth / tabs.length;
    return {
      transform: [
        {
          translateX: interpolate(
            activeIndex.value,
            tabs.map((_, i) => i),
            tabs.map((_, i) => i * tabWidth)
          ),
        },
      ],
      width: tabWidth,
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom, bottomMargin),
          paddingBottom: insets.bottom > 0 ? 0 : 10,
        },
      ]}
      pointerEvents="box-none"
    >
      {Platform.OS === 'ios' ? (
        <GlassView
          glassEffectStyle="regular"
          tintColor="rgba(18, 18, 18, 0.5)"
          style={[
            styles.tabBar,
            {
              width: containerWidth,
              borderRadius,
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.15)',
              overflow: 'hidden',
              backgroundColor: 'transparent',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.indicator,
              indicatorStyle,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: borderRadius - 10,
              },
            ]}
            pointerEvents="none"
          />
          {tabs.map((tab, index) => {
            const isActive = pathname.includes(tab.name);
            return (
              <TouchableOpacity
                key={`${tab.name}-${index}`}
                style={styles.tab}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name={tab.icon as any}
                  size={26}
                  color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </GlassView>
      ) : (
        <View
          style={[
            styles.tabBar,
            {
              width: containerWidth,
              borderRadius,
              backgroundColor: 'rgba(18, 18, 18, 0.95)',
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.indicator,
              indicatorStyle,
              {
                backgroundColor: colors.primary,
                borderRadius: borderRadius - 10,
              },
            ]}
            pointerEvents="none"
          />
          {tabs.map((tab, index) => {
            const isActive = pathname.includes(tab.name);
            return (
              <TouchableOpacity
                key={`${tab.name}-${index}`}
                style={styles.tab}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name={tab.icon as any}
                  size={26}
                  color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)',
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 20,
  },
  indicator: {
    position: 'absolute',
    height: '80%',
    top: '10%',
    left: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    zIndex: 2,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
});

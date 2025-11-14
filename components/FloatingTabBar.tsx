
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
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 24,
  bottomMargin = 12,
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

  // Find the active tab index based on exact route matching
  React.useEffect(() => {
    console.log('FloatingTabBar - Current pathname:', pathname);
    
    // Find exact match first
    let index = tabs.findIndex((tab) => {
      // Normalize routes for comparison
      const normalizedRoute = tab.route.replace(/^\//, '');
      const normalizedPathname = pathname.replace(/^\//, '');
      
      // Check for exact match
      if (normalizedPathname === normalizedRoute) {
        return true;
      }
      
      // Check if pathname starts with the route (for nested routes)
      if (normalizedPathname.startsWith(normalizedRoute + '/')) {
        return true;
      }
      
      // Special case for index routes
      if (tab.route === '/(admin)' && normalizedPathname === '(admin)') {
        return true;
      }
      if (tab.route === '/(customer)' && normalizedPathname === '(customer)') {
        return true;
      }
      
      return false;
    });
    
    // If no exact match, try to match by tab name
    if (index === -1) {
      index = tabs.findIndex((tab) => pathname.includes(tab.name));
    }
    
    // Default to first tab if still no match
    if (index === -1) {
      index = 0;
    }
    
    console.log('FloatingTabBar - Active index:', index, 'for tab:', tabs[index]?.name);
    activeIndex.value = withSpring(index, {
      damping: 20,
      stiffness: 90,
    });
  }, [pathname, tabs]);

  const indicatorStyle = useAnimatedStyle(() => {
    const horizontalPadding = 6;
    const tabWidth = (containerWidth - horizontalPadding * 2) / tabs.length;
    
    return {
      transform: [
        {
          translateX: interpolate(
            activeIndex.value,
            tabs.map((_, i) => i),
            tabs.map((_, i) => horizontalPadding + i * tabWidth)
          ),
        },
      ],
      width: tabWidth,
    };
  });

  // Determine active tab for styling
  const getIsActive = (tab: TabBarItem) => {
    const normalizedRoute = tab.route.replace(/^\//, '');
    const normalizedPathname = pathname.replace(/^\//, '');
    
    // Check for exact match
    if (normalizedPathname === normalizedRoute) {
      return true;
    }
    
    // Check if pathname starts with the route
    if (normalizedPathname.startsWith(normalizedRoute + '/')) {
      return true;
    }
    
    // Special case for index routes
    if (tab.route === '/(admin)' && normalizedPathname === '(admin)') {
      return true;
    }
    if (tab.route === '/(customer)' && normalizedPathname === '(customer)') {
      return true;
    }
    
    // Fallback to name matching
    return pathname.includes(tab.name);
  };

  return (
    <View
      style={[
        styles.container,
        {
          bottom: Math.max(insets.bottom + 8, bottomMargin),
          paddingBottom: 0,
        },
      ]}
      pointerEvents="box-none"
    >
      {Platform.OS === 'ios' ? (
        <GlassView
          glassEffectStyle="regular"
          tintColor="rgba(10, 10, 10, 0.75)"
          isInteractive={true}
          style={[
            styles.tabBar,
            {
              width: containerWidth,
              borderRadius,
              borderWidth: 0.33,
              borderColor: 'rgba(255, 255, 255, 0.12)',
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
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: borderRadius - 6,
              },
            ]}
            pointerEvents="none"
          />
          {tabs.map((tab, index) => {
            const isActive = getIsActive(tab);
            return (
              <TouchableOpacity
                key={`tab-${tab.name}-${index}`}
                style={styles.tab}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name={tab.icon as any}
                  size={22}
                  color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)'}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                      fontWeight: isActive ? '600' : '500',
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
              backgroundColor: 'rgba(10, 10, 10, 0.92)',
              borderWidth: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.indicator,
              indicatorStyle,
              {
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: borderRadius - 6,
              },
            ]}
            pointerEvents="none"
          />
          {tabs.map((tab, index) => {
            const isActive = getIsActive(tab);
            return (
              <TouchableOpacity
                key={`tab-${tab.name}-${index}`}
                style={styles.tab}
                onPress={() => handleTabPress(tab.route)}
                activeOpacity={0.7}
              >
                <IconSymbol
                  name={tab.icon as any}
                  size={22}
                  color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)'}
                />
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)',
                      fontWeight: isActive ? '600' : '500',
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
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  indicator: {
    position: 'absolute',
    height: '100%',
    top: 0,
    left: 0,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 2,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
  },
});

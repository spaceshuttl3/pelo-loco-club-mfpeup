
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
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  borderRadius = 25,
  bottomMargin = 20,
}: FloatingTabBarProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = useSharedValue(0);

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
    <SafeAreaView
      edges={['bottom']}
      style={[
        styles.container,
        {
          bottom: bottomMargin,
        },
      ]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? 90 : 0}
        tint={theme.dark ? 'dark' : 'light'}
        style={[
          styles.tabBar,
          {
            width: containerWidth,
            borderRadius,
            backgroundColor: Platform.OS === 'ios' 
              ? 'rgba(26, 26, 26, 0.75)' 
              : 'rgba(26, 26, 26, 0.95)',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius - 5,
            },
          ]}
          pointerEvents="none"
        />
        {tabs.map((tab, index) => {
          const isActive = pathname.includes(tab.name);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={tab.icon as any}
                size={24}
                color={isActive ? colors.text : colors.textSecondary}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.text : colors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </SafeAreaView>
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
    overflow: 'hidden',
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
    height: '80%',
    top: '10%',
    left: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 2,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});

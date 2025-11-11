
import React from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function CustomerLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(customer)/',
      icon: 'house.fill',
      label: 'Home',
    },
    {
      name: 'bookings',
      route: '/(customer)/bookings',
      icon: 'calendar',
      label: 'Bookings',
    },
    {
      name: 'products',
      route: '/(customer)/products',
      icon: 'bag.fill',
      label: 'Shop',
    },
    {
      name: 'profile',
      route: '/(customer)/profile',
      icon: 'person.fill',
      label: 'Profile',
    },
  ];

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="house.fill" drawable="ic_home" />
          <Label>Home</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="bookings">
          <Icon sf="calendar" drawable="ic_calendar" />
          <Label>Bookings</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="products">
          <Icon sf="bag.fill" drawable="ic_bag" />
          <Label>Shop</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf="person.fill" drawable="ic_profile" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="products" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="book-appointment" options={{ presentation: 'modal', headerShown: true, title: 'Book Appointment' }} />
        <Stack.Screen name="spin-wheel" options={{ presentation: 'modal', headerShown: true, title: 'Spin The Wheel' }} />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}

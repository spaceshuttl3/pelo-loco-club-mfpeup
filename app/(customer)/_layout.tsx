
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

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

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="products" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="cart" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="book-appointment" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="spin-wheel" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}

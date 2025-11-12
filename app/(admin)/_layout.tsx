
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function AdminLayout() {
  const tabs: TabBarItem[] = [
    {
      name: 'index',
      route: '/(admin)/',
      icon: 'house.fill',
      label: 'Dashboard',
    },
    {
      name: 'appointments',
      route: '/(admin)/appointments',
      icon: 'calendar',
      label: 'Bookings',
    },
    {
      name: 'products',
      route: '/(admin)/products',
      icon: 'bag.fill',
      label: 'Products',
    },
    {
      name: 'coupons',
      route: '/(admin)/coupons',
      icon: 'ticket',
      label: 'Coupons',
    },
  ];

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="appointments" />
        <Stack.Screen name="products" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="birthdays" />
        <Stack.Screen name="coupons" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}

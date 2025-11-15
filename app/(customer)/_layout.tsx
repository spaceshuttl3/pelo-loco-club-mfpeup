
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import React from 'react';

const customerTabs: TabBarItem[] = [
  {
    name: 'index',
    route: '/(customer)',
    icon: 'house.fill',
    label: 'Home',
  },
  {
    name: 'book-appointment',
    route: '/(customer)/book-appointment',
    icon: 'calendar.badge.plus',
    label: 'Prenota',
  },
  {
    name: 'products',
    route: '/(customer)/products',
    icon: 'bag.fill',
    label: 'Prodotti',
  },
  {
    name: 'order-history',
    route: '/(customer)/order-history',
    icon: 'bag.badge.checkmark',
    label: 'Ordini',
  },
  {
    name: 'profile',
    route: '/(customer)/profile',
    icon: 'person.fill',
    label: 'Profilo',
  },
];

export default function CustomerLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="book-appointment" />
        <Stack.Screen name="bookings" />
        <Stack.Screen name="products" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="spin-wheel" />
        <Stack.Screen name="order-history" />
      </Stack>
      <FloatingTabBar tabs={customerTabs} />
    </>
  );
}

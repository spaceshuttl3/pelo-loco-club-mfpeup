
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '../../components/FloatingTabBar';
import React from 'react';

const adminTabs: TabBarItem[] = [
  {
    name: 'index',
    route: '/(admin)',
    icon: 'house.fill',
    label: 'Dashboard',
  },
  {
    name: 'appointments',
    route: '/(admin)/appointments',
    icon: 'calendar',
    label: 'Appuntamenti',
  },
  {
    name: 'orders',
    route: '/(admin)/orders',
    icon: 'bag.fill',
    label: 'Ordini',
  },
  {
    name: 'products',
    route: '/(admin)/products',
    icon: 'cube.fill',
    label: 'Prodotti',
  },
];

export default function AdminLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="appointments" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="products" />
        <Stack.Screen name="services" />
        <Stack.Screen name="birthdays" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="fidelity-config" />
        <Stack.Screen name="fidelity-users" />
        <Stack.Screen name="rewards-config" />
      </Stack>
      <FloatingTabBar tabs={adminTabs} />
    </>
  );
}

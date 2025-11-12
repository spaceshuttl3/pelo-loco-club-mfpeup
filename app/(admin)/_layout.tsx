
import React from 'react';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="products" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="birthdays" />
      <Stack.Screen name="coupons" />
    </Stack>
  );
}

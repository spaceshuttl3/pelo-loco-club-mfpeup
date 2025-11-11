
import React from 'react';
import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="appointments" options={{ title: 'Manage Appointments' }} />
      <Stack.Screen name="products" options={{ title: 'Manage Products' }} />
      <Stack.Screen name="notifications" options={{ title: 'Send Notifications' }} />
    </Stack>
  );
}

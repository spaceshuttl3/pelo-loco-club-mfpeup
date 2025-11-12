
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user:users!orders_user_id_fkey(id, name, email, phone)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      Alert.alert('Error', 'Could not load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (id: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', id);

      if (error) throw error;
      
      fetchOrders();
      Alert.alert('Success', `Order marked as ${paymentStatus}`);
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order');
    }
  };

  const handleDeleteOrder = (order: Order) => {
    Alert.alert(
      'Delete Order',
      `Are you sure you want to delete this order?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);

              if (error) throw error;
              
              Alert.alert('Success', 'Order deleted');
              fetchOrders();
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Error', 'Failed to delete order');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const pendingOrders = orders.filter(o => o.payment_status === 'pending');
  const completedOrders = orders.filter(o => o.payment_status === 'paid');

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Product Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Pending Orders ({pendingOrders.length})
        </Text>

        {pendingOrders.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No pending orders
            </Text>
          </View>
        ) : (
          pendingOrders.map((order) => (
            <View key={order.id} style={commonStyles.card}>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                  Order #{order.id.substring(0, 8)}
                </Text>
                <View
                  style={{
                    backgroundColor: colors.accent,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={[commonStyles.text, { fontSize: 12 }]}>
                    PENDING
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={commonStyles.textSecondary}>
                  Customer: {order.user?.name || 'Unknown'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Phone: {order.user?.phone || 'N/A'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Email: {order.user?.email || 'N/A'}
                </Text>
                <Text style={[commonStyles.text, { fontWeight: 'bold', marginTop: 8 }]}>
                  Total: ${order.total_price}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Payment: {order.payment_mode === 'pay_in_person' ? 'In Person' : 'Online'}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Date: {new Date(order.created_at).toLocaleDateString()} at{' '}
                  {new Date(order.created_at).toLocaleTimeString()}
                </Text>
              </View>

              {order.items && Array.isArray(order.items) && (
                <View style={{ marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                    Items:
                  </Text>
                  {order.items.map((item: any, index: number) => (
                    <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={commonStyles.textSecondary}>
                        {item.name} x {item.quantity}
                      </Text>
                      <Text style={commonStyles.textSecondary}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                  onPress={() => updateOrderStatus(order.id, 'paid')}
                >
                  <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                    Mark as Paid
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.card,
                    paddingVertical: 10,
                    borderRadius: 6,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.error,
                  }}
                  onPress={() => handleDeleteOrder(order)}
                >
                  <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600', color: colors.error }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {completedOrders.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 30, marginBottom: 16 }]}>
              Completed Orders ({completedOrders.length})
            </Text>

            {completedOrders.map((order) => (
              <View key={order.id} style={[commonStyles.card, { opacity: 0.7 }]}>
                <View style={[commonStyles.row, { marginBottom: 8 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    Order #{order.id.substring(0, 8)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12 }]}>
                      PAID
                    </Text>
                  </View>
                </View>

                <Text style={commonStyles.textSecondary}>
                  Customer: {order.user?.name || 'Unknown'}
                </Text>
                <Text style={[commonStyles.text, { fontWeight: 'bold', marginTop: 4 }]}>
                  Total: ${order.total_price}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Date: {new Date(order.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

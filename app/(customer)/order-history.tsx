
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Order } from '../../types';
import { commonStyles, colors } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('Fetching orders for user:', user?.id);
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>I Miei Ordini</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {orders.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Non hai ancora effettuato nessun ordine
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {orders.map((order, index) => (
              <View key={`order-${order.id}-${index}`} style={[commonStyles.card, { marginBottom: 16 }]}>
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                    Ordine #{order.id.substring(0, 8)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: 
                        order.payment_status === 'paid' 
                          ? colors.primary 
                          : order.payment_status === 'cancelled'
                          ? colors.error
                          : colors.accent,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12 }]}>
                      {order.payment_status === 'paid' 
                        ? 'PAGATO' 
                        : order.payment_status === 'cancelled'
                        ? 'ANNULLATO'
                        : 'IN ATTESA'}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <Text style={[commonStyles.text, { fontWeight: 'bold', marginBottom: 8 }]}>
                    💰 Totale: €{order.total_price}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    💳 Modalità: {order.payment_mode === 'pay_in_person' ? 'Paga di Persona' : 'Online'}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    📅 Data: {new Date(order.created_at || '').toLocaleDateString('it-IT')} alle{' '}
                    {new Date(order.created_at || '').toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {order.items && Array.isArray(order.items) && (
                  <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, marginBottom: 12 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                      Articoli:
                    </Text>
                    {order.items.map((item: any, itemIndex: number) => (
                      <View key={`item-${itemIndex}`} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={commonStyles.textSecondary}>
                          {item.name} x {item.quantity}
                        </Text>
                        <Text style={commonStyles.textSecondary}>
                          €{(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {order.cancellation_reason && (
                  <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 12 }]}>
                    <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600', marginBottom: 4 }]}>
                      Motivo Annullamento:
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      {order.cancellation_reason}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </React.Fragment>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

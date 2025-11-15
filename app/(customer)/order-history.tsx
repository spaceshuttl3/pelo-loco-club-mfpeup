
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Order } from '@/types';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      console.log('Fetching customer orders...');
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      console.log('Orders fetched:', data?.length || 0);
      setOrders(data || []);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

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

  const pendingOrders = orders.filter(o => o.payment_status === 'pending');
  const completedOrders = orders.filter(o => o.payment_status === 'paid');
  const cancelledOrders = orders.filter(o => o.payment_status === 'cancelled');

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
        {pendingOrders.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Ordini in Attesa ({pendingOrders.length})
            </Text>

            <React.Fragment>
              {pendingOrders.map((order, index) => (
                <View key={`pending-${order.id}-${index}`} style={[commonStyles.card, { marginBottom: 16 }]}>
                  <View style={[commonStyles.row, { marginBottom: 12 }]}>
                    <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                      Ordine #{order.id.substring(0, 8)}
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
                        IN ATTESA
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 12 }}>
                    <Text style={[commonStyles.text, { fontWeight: 'bold', marginBottom: 4 }]}>
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
                    <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
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
                </View>
              ))}
            </React.Fragment>
          </>
        )}

        {completedOrders.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: pendingOrders.length > 0 ? 30 : 0, marginBottom: 16 }]}>
              Ordini Completati ({completedOrders.length})
            </Text>

            <React.Fragment>
              {completedOrders.map((order, index) => (
                <View key={`completed-${order.id}-${index}`} style={[commonStyles.card, { opacity: 0.8, marginBottom: 12 }]}>
                  <View style={[commonStyles.row, { marginBottom: 8 }]}>
                    <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                      Ordine #{order.id.substring(0, 8)}
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
                        PAGATO
                      </Text>
                    </View>
                  </View>

                  <Text style={[commonStyles.text, { fontWeight: 'bold', marginBottom: 4 }]}>
                    💰 Totale: €{order.total_price}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    📅 Data: {new Date(order.created_at || '').toLocaleDateString('it-IT')}
                  </Text>

                  {order.items && Array.isArray(order.items) && (
                    <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 }}>
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
                </View>
              ))}
            </React.Fragment>
          </>
        )}

        {cancelledOrders.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: (pendingOrders.length > 0 || completedOrders.length > 0) ? 30 : 0, marginBottom: 16 }]}>
              Ordini Annullati ({cancelledOrders.length})
            </Text>

            <React.Fragment>
              {cancelledOrders.map((order, index) => (
                <View key={`cancelled-${order.id}-${index}`} style={[commonStyles.card, { opacity: 0.6, marginBottom: 12 }]}>
                  <View style={[commonStyles.row, { marginBottom: 8 }]}>
                    <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                      Ordine #{order.id.substring(0, 8)}
                    </Text>
                    <View
                      style={{
                        backgroundColor: colors.error,
                        paddingHorizontal: 12,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}
                    >
                      <Text style={[commonStyles.text, { fontSize: 12 }]}>
                        ANNULLATO
                      </Text>
                    </View>
                  </View>

                  <Text style={[commonStyles.text, { fontWeight: 'bold', marginBottom: 4 }]}>
                    💰 Totale: €{order.total_price}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    📅 Data: {new Date(order.created_at || '').toLocaleDateString('it-IT')}
                  </Text>

                  {order.items && Array.isArray(order.items) && (
                    <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 }}>
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
                </View>
              ))}
            </React.Fragment>
          </>
        )}

        {orders.length === 0 && (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun ordine trovato
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

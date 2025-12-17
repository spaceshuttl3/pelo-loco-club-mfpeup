
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Order } from '../types';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCompletedOrders, setShowCompletedOrders] = useState(false);
  const [showCancelledOrders, setShowCancelledOrders] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      console.log('Fetching orders...');
      
      // Fetch orders with user details using a proper join
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched:', data?.length || 0);
      console.log('Sample order with user:', data?.[0]);
      
      // Transform the data to match our Order type
      const transformedOrders = (data || []).map(order => ({
        ...order,
        user: order.users ? {
          id: order.users.id,
          name: order.users.name,
          email: order.users.email,
          phone: order.users.phone,
          role: 'customer' as const,
        } : undefined,
      }));
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      Alert.alert('Errore', 'Impossibile caricare gli ordini');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const updateOrderStatus = async (id: string, paymentStatus: string) => {
    try {
      console.log('Updating order status:', id, paymentStatus);
      
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: paymentStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }
      
      Alert.alert('Successo', `Ordine segnato come ${paymentStatus === 'paid' ? 'pagato' : 'in attesa'}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Errore', 'Impossibile aggiornare l\'ordine');
    }
  };

  const handleCancelOrder = (order: Order) => {
    setSelectedOrder(order);
    setCancellationReason('');
    setCancelModalVisible(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrder) return;

    if (!cancellationReason.trim()) {
      Alert.alert('Motivo Richiesto', 'Per favore, fornisci un motivo per l\'annullamento.');
      return;
    }

    try {
      console.log('Cancelling order:', selectedOrder.id);
      
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: 'cancelled',
          cancellation_reason: cancellationReason.trim(),
        })
        .eq('id', selectedOrder.id);

      if (error) {
        console.error('Error cancelling order:', error);
        throw error;
      }
      
      Alert.alert('Successo', 'Ordine annullato con successo');
      setCancelModalVisible(false);
      setSelectedOrder(null);
      setCancellationReason('');
      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert('Errore', 'Impossibile annullare l\'ordine');
    }
  };

  const handleDeleteOrder = (order: Order) => {
    Alert.alert(
      'Elimina Ordine',
      `Sei sicuro di voler eliminare definitivamente l'ordine #${order.id.substring(0, 8)}?`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting order:', order.id);
              
              const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);

              if (error) {
                console.error('Error deleting order:', error);
                throw error;
              }
              
              Alert.alert('Successo', 'Ordine eliminato con successo');
              fetchOrders();
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('Errore', 'Impossibile eliminare l\'ordine');
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
  const cancelledOrders = orders.filter(o => o.payment_status === 'cancelled');

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Ordini</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
          Ordini in Attesa ({pendingOrders.length})
        </Text>

        {pendingOrders.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun ordine in attesa
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {pendingOrders.map((order, index) => (
              <View key={`pending-${order.id}-${index}`} style={commonStyles.card}>
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
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 8 }]}>
                    Dettagli Cliente:
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    👤 Nome: {order.user?.name || 'Non disponibile'}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    📞 Telefono: {order.user?.phone || 'Non disponibile'}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    📧 Email: {order.user?.email || 'Non disponibile'}
                  </Text>
                  <Text style={[commonStyles.text, { fontWeight: 'bold', marginTop: 8 }]}>
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
                  <View style={{ marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
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
                      Segna Pagato
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
                      borderColor: colors.accent,
                    }}
                    onPress={() => handleCancelOrder(order)}
                  >
                    <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600', color: colors.accent }]}>
                      Annulla
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </React.Fragment>
        )}

        {completedOrders.length > 0 && (
          <>
            <TouchableOpacity
              style={[commonStyles.card, commonStyles.row, { marginTop: 30, marginBottom: 16 }]}
              onPress={() => setShowCompletedOrders(!showCompletedOrders)}
              activeOpacity={0.7}
            >
              <Text style={[commonStyles.subtitle, { flex: 1 }]}>
                Ordini Completati ({completedOrders.length})
              </Text>
              <IconSymbol 
                name={showCompletedOrders ? 'chevron.up' : 'chevron.down'} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>

            {showCompletedOrders && (
              <React.Fragment>
                {completedOrders.map((order, index) => (
                  <View key={`completed-${order.id}-${index}`} style={[commonStyles.card, { opacity: 0.7 }]}>
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

                    <Text style={commonStyles.textSecondary}>
                      👤 Cliente: {order.user?.name || 'Non disponibile'}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      📞 Telefono: {order.user?.phone || 'Non disponibile'}
                    </Text>
                    <Text style={[commonStyles.text, { fontWeight: 'bold', marginTop: 4 }]}>
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

                    <TouchableOpacity
                      style={{
                        marginTop: 12,
                        backgroundColor: colors.card,
                        paddingVertical: 8,
                        borderRadius: 6,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.error,
                      }}
                      onPress={() => handleDeleteOrder(order)}
                    >
                      <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600', color: colors.error }]}>
                        Elimina Ordine
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </React.Fragment>
            )}
          </>
        )}

        {cancelledOrders.length > 0 && (
          <>
            <TouchableOpacity
              style={[commonStyles.card, commonStyles.row, { marginTop: 30, marginBottom: 16 }]}
              onPress={() => setShowCancelledOrders(!showCancelledOrders)}
              activeOpacity={0.7}
            >
              <Text style={[commonStyles.subtitle, { flex: 1 }]}>
                Ordini Annullati ({cancelledOrders.length})
              </Text>
              <IconSymbol 
                name={showCancelledOrders ? 'chevron.up' : 'chevron.down'} 
                size={24} 
                color={colors.primary} 
              />
            </TouchableOpacity>

            {showCancelledOrders && (
              <React.Fragment>
                {cancelledOrders.map((order, index) => (
                  <View key={`cancelled-${order.id}-${index}`} style={[commonStyles.card, { opacity: 0.6 }]}>
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

                    <Text style={commonStyles.textSecondary}>
                      👤 Cliente: {order.user?.name || 'Non disponibile'}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      📞 Telefono: {order.user?.phone || 'Non disponibile'}
                    </Text>
                    <Text style={[commonStyles.text, { fontWeight: 'bold', marginTop: 4 }]}>
                      💰 Totale: €{order.total_price}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      📅 Data: {new Date(order.created_at || '').toLocaleDateString('it-IT')}
                    </Text>

                    {order.cancellation_reason && (
                      <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 12, marginTop: 8 }]}>
                        <Text style={[commonStyles.text, { fontSize: 12, fontWeight: '600', marginBottom: 4 }]}>
                          Motivo Annullamento:
                        </Text>
                        <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                          {order.cancellation_reason}
                        </Text>
                      </View>
                    )}

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

                    <TouchableOpacity
                      style={{
                        marginTop: 12,
                        backgroundColor: colors.card,
                        paddingVertical: 8,
                        borderRadius: 6,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.error,
                      }}
                      onPress={() => handleDeleteOrder(order)}
                    >
                      <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600', color: colors.error }]}>
                        Elimina Ordine
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </React.Fragment>
            )}
          </>
        )}
      </ScrollView>

      {/* Cancel Modal with Reason */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Annulla Ordine
            </Text>

            {selectedOrder && (
              <View style={[commonStyles.card, { backgroundColor: colors.error, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  Ordine #{selectedOrder.id.substring(0, 8)}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  Cliente: {selectedOrder.user?.name}
                </Text>
              </View>
            )}

            <Text style={[commonStyles.text, { marginBottom: 8, fontWeight: '600' }]}>
              Motivo dell&apos;annullamento
            </Text>
            <TextInput
              style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Spiega perché vuoi annullare questo ordine..."
              placeholderTextColor={colors.textSecondary}
              value={cancellationReason}
              onChangeText={setCancellationReason}
              multiline
              numberOfLines={4}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.error }]}
                onPress={confirmCancelOrder}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>Conferma Annullamento</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setCancelModalVisible(false);
                  setSelectedOrder(null);
                  setCancellationReason('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Indietro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

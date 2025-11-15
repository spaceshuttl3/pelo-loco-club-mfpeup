
import { supabase } from '@/lib/supabase';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useCart } from '@/contexts/CartContext';
import React from 'react';
import { IconSymbol } from '@/components/IconSymbol';

const { width } = Dimensions.get('window');

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, removeFromCart, totalPrice, clearCart } = useCart();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Carrello Vuoto', 'Aggiungi prodotti al carrello prima di procedere');
      return;
    }

    Alert.alert(
      'Metodo di Pagamento',
      'I prodotti possono essere pagati solo di persona al negozio.',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Conferma Ordine',
          onPress: () => processOrder('pay_in_person'),
        },
      ]
    );
  };

  const processOrder = async (paymentMode: 'pay_in_person' | 'online') => {
    try {
      console.log('Processing order...');
      
      const orderItems = cartItems.map((item) => ({
        product_id: item.product_id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          items: orderItems,
          total_price: totalPrice,
          payment_mode: paymentMode,
          payment_status: 'pending',
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created:', orderData);

      for (const item of cartItems) {
        const newStock = item.product.stock - item.quantity;
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (stockError) {
          console.error('Error updating stock:', stockError);
        }
      }

      await clearCart();

      Alert.alert(
        'Ordine Confermato!',
        'Il tuo ordine è stato ricevuto. Paga al negozio quando ritiri i prodotti.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/(customer)/order-history'),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Errore', 'Impossibile completare l\'ordine. Riprova.');
    }
  };

  const handleRemove = async (cartItemId: string, productName: string) => {
    Alert.alert(
      'Rimuovi Prodotto',
      `Vuoi rimuovere ${productName} dal carrello?`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFromCart(cartItemId);
              Alert.alert('Successo', 'Prodotto rimosso dal carrello');
            } catch (error) {
              console.error('Error removing from cart:', error);
              Alert.alert('Errore', 'Impossibile rimuovere il prodotto');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Carrello</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {cartItems.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Il tuo carrello è vuoto
            </Text>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 20 }]}
              onPress={() => router.push('/(customer)/products')}
            >
              <Text style={buttonStyles.text}>Vai ai Prodotti</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <React.Fragment>
            {cartItems.map((item, index) => (
              <View key={`cart-${item.id}-${index}`} style={[commonStyles.card, { marginBottom: 16 }]}>
                <View style={commonStyles.row}>
                  {item.product.photo_url ? (
                    <Image
                      source={{ uri: item.product.photo_url }}
                      style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: colors.border }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        backgroundColor: colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <IconSymbol name="photo" size={32} color={colors.textSecondary} />
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {item.product.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]}>
                      Quantità: {item.quantity}
                    </Text>
                    <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                      €{(item.product.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemove(item.id, item.product.name)}
                    style={{ padding: 8 }}
                  >
                    <IconSymbol name="trash" size={24} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20 }]}>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Text style={[commonStyles.text, { fontSize: 18, fontWeight: 'bold' }]}>
                  Totale
                </Text>
                <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold' }]}>
                  €{totalPrice.toFixed(2)}
                </Text>
              </View>
  <Text style={[commonStyles.textSecondary, { fontSize: 12, textAlign: 'center' }]}>
                Pagamento di persona al negozio 💳 
              </Text>

            </View>

            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 20 }]}
              onPress={handleCheckout}
            >
              <Text style={buttonStyles.text}>Conferma Ordine</Text>
            </TouchableOpacity>
          </React.Fragment>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

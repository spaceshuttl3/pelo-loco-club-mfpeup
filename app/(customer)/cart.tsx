
import React from 'react';
import { IconSymbol } from '@/components/IconSymbol';
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
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';

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
      'Come vuoi pagare?',
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Paga di Persona',
          onPress: () => processOrder('pay_in_person'),
        },
        {
          text: 'Paga Online',
          onPress: () => processOrder('online'),
        },
      ]
    );
  };

  const processOrder = async (paymentMode: 'pay_in_person' | 'online') => {
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          items: orderItems,
          total_price: totalPrice,
          payment_mode: paymentMode,
          payment_status: paymentMode === 'online' ? 'paid' : 'pending',
        });

      if (error) {
        console.error('Error creating order:', error);
        Alert.alert('Errore', 'Impossibile creare l\'ordine. Riprova.');
        return;
      }

      await clearCart();

      Alert.alert(
        'Ordine Confermato!',
        paymentMode === 'online'
          ? 'Il tuo ordine è stato confermato e pagato.'
          : 'Il tuo ordine è stato confermato. Paga al negozio.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error in processOrder:', error);
      Alert.alert('Errore', 'Impossibile completare l\'ordine. Riprova.');
    }
  };

  const handleRemove = (cartItemId: string, productName: string) => {
    Alert.alert(
      'Rimuovi Prodotto',
      `Rimuovere ${productName} dal carrello?`,
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
        <Text style={commonStyles.headerTitle}>Carrello</Text>
        <View style={{ width: 24 }} />
      </View>

      {cartItems.length === 0 ? (
        <View style={[commonStyles.content, commonStyles.centerContent]}>
          <IconSymbol name="bag" size={64} color={colors.textSecondary} />
          <Text style={[commonStyles.text, { marginTop: 16, fontSize: 18 }]}>
            Il tuo carrello è vuoto
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
            Aggiungi prodotti per iniziare lo shopping
          </Text>
          <TouchableOpacity
            style={[buttonStyles.primary, { marginTop: 24 }]}
            onPress={() => router.back()}
          >
            <Text style={buttonStyles.text}>Continua lo Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 120 }}>
            {cartItems.map((item) => (
              <View key={item.id} style={[commonStyles.card, { flexDirection: 'row', padding: 12 }]}>
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

                <View style={{ flex: 1, marginLeft: 12, justifyContent: 'space-between' }}>
                  <View>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {item.product.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      Quantità: {item.quantity}
                    </Text>
                  </View>

                  <View style={[commonStyles.row, { marginTop: 8 }]}>
                    <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                      €{(item.product.price * item.quantity).toFixed(2)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemove(item.id, item.product.name)}
                      style={{ padding: 4 }}
                    >
                      <IconSymbol name="trash" size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <View style={[commonStyles.card, { marginTop: 16 }]}>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={commonStyles.text}>Subtotale</Text>
                <Text style={commonStyles.text}>€{totalPrice.toFixed(2)}</Text>
              </View>
              <View style={[commonStyles.row, { marginBottom: 12 }]}>
                <Text style={commonStyles.text}>Spedizione</Text>
                <Text style={commonStyles.text}>Gratis</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
              <View style={commonStyles.row}>
                <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18 }]}>
                  Totale
                </Text>
                <Text style={[commonStyles.text, { fontWeight: 'bold', fontSize: 18, color: colors.primary }]}>
                  €{totalPrice.toFixed(2)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <TouchableOpacity style={buttonStyles.primary} onPress={handleCheckout}>
              <Text style={buttonStyles.text}>Procedi al Pagamento</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

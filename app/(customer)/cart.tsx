
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { useCart } from '@/contexts/CartContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cartItems, removeFromCart, updateQuantity, clearCart, totalPrice, loading } = useCart();

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty');
      return;
    }

    Alert.alert(
      'Checkout',
      'How would you like to pay?',
      [
        {
          text: 'Pay in Person',
          onPress: () => processOrder('pay_in_person'),
        },
        {
          text: 'Pay Online',
          onPress: () => processOrder('online'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const processOrder = async (paymentMode: 'pay_in_person' | 'online') => {
    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.product_id,
        product_name: item.product.name,
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
        Alert.alert('Error', 'Could not create order. Please try again.');
        return;
      }

      // Update product stock
      for (const item of cartItems) {
        const newStock = item.product.stock - item.quantity;
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);
      }

      await clearCart();

      Alert.alert(
        'Order Placed!',
        paymentMode === 'online'
          ? 'Your order has been placed and paid successfully!'
          : 'Your order has been placed. Please pay at the shop when you pick up your items.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error processing order:', error);
      Alert.alert('Error', 'Could not process order. Please try again.');
    }
  };

  const handleRemove = (cartItemId: string, productName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(cartItemId),
        },
      ]
    );
  };

  return (
    <View style={commonStyles.container}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Shopping Cart</Text>
      </View>

      <ScrollView style={commonStyles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {cartItems.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="cart" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Your cart is empty
            </Text>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 20 }]}
              onPress={() => router.back()}
            >
              <Text style={buttonStyles.text}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <View key={item.id} style={[commonStyles.card, { marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row' }}>
                  {item.product.photo_url && (
                    <Image
                      source={{ uri: item.product.photo_url }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        marginRight: 12,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {item.product.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                      ${item.product.price} each
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: colors.card,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <IconSymbol name="minus" size={16} color={colors.text} />
                        </TouchableOpacity>
                        
                        <Text style={[commonStyles.text, { marginHorizontal: 16, fontWeight: '600' }]}>
                          {item.quantity}
                        </Text>
                        
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: colors.card,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                        >
                          <IconSymbol name="plus" size={16} color={colors.text} />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemove(item.id, item.product.name)}
                      >
                        <IconSymbol name="trash" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                  <Text style={[commonStyles.text, { textAlign: 'right', fontWeight: 'bold' }]}>
                    Subtotal: ${(item.product.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}

            <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 20 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={[commonStyles.text, { fontSize: 18 }]}>Total:</Text>
                <Text style={[commonStyles.text, { fontSize: 24, fontWeight: 'bold' }]}>
                  ${totalPrice.toFixed(2)}
                </Text>
              </View>
              <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 20,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}>
          <TouchableOpacity
            style={buttonStyles.primary}
            onPress={handleCheckout}
            disabled={loading}
          >
            <Text style={buttonStyles.text}>
              Proceed to Checkout
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}


import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'expo-router';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart, totalItems } = useCart();
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error in fetchProducts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0) {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      return;
    }

    try {
      await addToCart(product.id);
      Alert.alert('Success', `${product.name} added to cart!`);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      Alert.alert('Error', error.message || 'Could not add item to cart');
    }
  };

  if (loading) {
    return (
      <View style={[commonStyles.container, commonStyles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={commonStyles.container}>
      <View style={[commonStyles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={commonStyles.headerTitle}>Shop</Text>
        <TouchableOpacity
          style={{ position: 'relative' }}
          onPress={() => router.push('/(customer)/cart' as any)}
        >
          <IconSymbol name="cart.fill" size={28} color={colors.text} />
          {totalItems > 0 && (
            <View
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: colors.primary,
                borderRadius: 10,
                width: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>
                {totalItems}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {products.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag.fill" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No products available
            </Text>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={[commonStyles.card, { marginBottom: 16 }]}>
              {product.photo_url && (
                <Image
                  source={{ uri: product.photo_url }}
                  style={{
                    width: '100%',
                    height: 200,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                  resizeMode="cover"
                />
              )}
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                    {product.name}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    {product.description}
                  </Text>
                </View>
                <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold', fontSize: 18 }]}>
                  ${product.price}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Text style={[commonStyles.textSecondary, { fontSize: 14 }]}>
                  Stock: {product.stock}
                </Text>
                <TouchableOpacity
                  style={[
                    buttonStyles.primary,
                    { paddingVertical: 8, paddingHorizontal: 16 },
                    product.stock <= 0 && { opacity: 0.5 },
                  ]}
                  onPress={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <Text style={buttonStyles.text}>
                    {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

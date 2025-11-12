
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';
import { useCart } from '@/contexts/CartContext';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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
    console.log('AddToCart - Button pressed for:', product.name);
    
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

  const handleCartPress = () => {
    console.log('Cart - Button pressed, navigating to cart');
    try {
      router.push('/(customer)/cart' as any);
    } catch (error) {
      console.error('Cart navigation error:', error);
    }
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
      <View style={[commonStyles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={commonStyles.headerTitle}>Shop</Text>
        <TouchableOpacity
          style={{ position: 'relative', padding: 8 }}
          onPress={handleCartPress}
          activeOpacity={0.7}
        >
          <IconSymbol name="cart.fill" size={28} color={colors.text} />
          {totalItems > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                backgroundColor: colors.primary,
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 4,
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
            <View key={product.id} style={[commonStyles.card, { marginBottom: 16, padding: 0, overflow: 'hidden' }]}>
              {product.photo_url ? (
                <Image
                  source={{ uri: product.photo_url }}
                  style={{
                    width: '100%',
                    height: (width - 40) * (9 / 16),
                    backgroundColor: colors.card,
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: (width - 40) * (9 / 16),
                    backgroundColor: colors.card,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                  <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
                    No image
                  </Text>
                </View>
              )}
              
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                      {product.name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {product.description}
                    </Text>
                  </View>
                  <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold', fontSize: 20, marginLeft: 12 }]}>
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
                      { paddingVertical: 10, paddingHorizontal: 20 },
                      product.stock <= 0 && { opacity: 0.5 },
                    ]}
                    onPress={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    activeOpacity={0.7}
                  >
                    <Text style={buttonStyles.text}>
                      {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

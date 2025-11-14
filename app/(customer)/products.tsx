
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/types';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart, totalItems } = useCart();

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
    try {
      await addToCart(product.id, 1);
      Alert.alert('Successo', `${product.name} aggiunto al carrello`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert('Errore', 'Impossibile aggiungere al carrello');
    }
  };

  const handleCartPress = () => {
    router.push('/(customer)/cart');
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
        <Text style={commonStyles.headerTitle}>Prodotti</Text>
        <TouchableOpacity onPress={handleCartPress} style={{ position: 'relative' }}>
          <IconSymbol name="bag.fill" size={24} color={colors.text} />
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
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun prodotto disponibile
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            {products.map((product) => (
              <View
                key={product.id}
                style={{
                  width: cardWidth,
                  margin: 6,
                }}
              >
                <View style={[commonStyles.card, { padding: 0, overflow: 'hidden' }]}>
                  {product.photo_url ? (
                    <Image
                      source={{ uri: product.photo_url }}
                      style={{ width: '100%', height: cardWidth, backgroundColor: colors.border }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        height: cardWidth,
                        backgroundColor: colors.border,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                    </View>
                  )}

                  <View style={{ padding: 12 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {product.name}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]} numberOfLines={2}>
                      {product.description}
                    </Text>
                    <View style={[commonStyles.row, { marginBottom: 12 }]}>
                      <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                        €{product.price}
                      </Text>
                      <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                        Stock: {product.stock}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        buttonStyles.primary,
                        { paddingVertical: 8 },
                        product.stock === 0 && { opacity: 0.5 },
                      ]}
                      onPress={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <Text style={[buttonStyles.text, { fontSize: 14 }]}>
                        {product.stock === 0 ? 'Esaurito' : 'Aggiungi'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

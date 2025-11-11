
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { commonStyles, colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
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
      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <Text style={[commonStyles.title, { marginBottom: 8 }]}>
          Shop Products
        </Text>
        <Text style={[commonStyles.textSecondary, { marginBottom: 20 }]}>
          Premium grooming products
        </Text>

        {products.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.text, { marginTop: 16, textAlign: 'center' }]}>
              No products available
            </Text>
            <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
              Check back soon for new items
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            {products.map((product) => (
              <View
                key={product.id}
                style={{
                  width: '50%',
                  padding: 6,
                }}
              >
                <View style={commonStyles.card}>
                  {product.photo_url ? (
                    <Image
                      source={{ uri: product.photo_url }}
                      style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 8,
                        marginBottom: 12,
                        backgroundColor: colors.highlight,
                      }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 8,
                        marginBottom: 12,
                        backgroundColor: colors.highlight,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <IconSymbol name="photo" size={40} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                    {product.name}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12, marginBottom: 8 }]}>
                    {product.description}
                  </Text>
                  <View style={[commonStyles.row, { marginBottom: 12 }]}>
                    <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                      ${product.price.toFixed(2)}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                      Stock: {product.stock}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: 8,
                      borderRadius: 6,
                      alignItems: 'center',
                    }}
                    disabled={product.stock === 0}
                  >
                    <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

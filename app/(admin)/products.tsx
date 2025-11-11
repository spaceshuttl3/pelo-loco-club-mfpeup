
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
  });

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

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('products').insert([
        {
          name: newProduct.name,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
          description: newProduct.description,
        },
      ]);

      if (error) throw error;

      Alert.alert('Success', 'Product added successfully');
      setShowAddModal(false);
      setNewProduct({ name: '', price: '', stock: '', description: '' });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

              if (error) throw error;
              fetchProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
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
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <TouchableOpacity
          style={[buttonStyles.primary, { marginBottom: 20 }]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={buttonStyles.text}>Add New Product</Text>
        </TouchableOpacity>

        {products.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No products yet
            </Text>
          </View>
        ) : (
          products.map((product) => (
            <View key={product.id} style={commonStyles.card}>
              <View style={[commonStyles.row, { marginBottom: 8 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                  {product.name}
                </Text>
                <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold' }]}>
                  ${product.price.toFixed(2)}
                </Text>
              </View>
              <Text style={[commonStyles.textSecondary, { marginBottom: 8 }]}>
                {product.description}
              </Text>
              <Text style={commonStyles.textSecondary}>
                Stock: {product.stock} units
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.error,
                  paddingVertical: 8,
                  borderRadius: 6,
                  alignItems: 'center',
                  marginTop: 12,
                }}
                onPress={() => handleDeleteProduct(product.id)}
              >
                <Text style={[commonStyles.text, { fontSize: 14, fontWeight: '600' }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 20 }}>
            <Text style={[commonStyles.subtitle, { marginBottom: 20 }]}>
              Add New Product
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Product Name"
              placeholderTextColor={colors.textSecondary}
              value={newProduct.name}
              onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Price"
              placeholderTextColor={colors.textSecondary}
              value={newProduct.price}
              onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Stock"
              placeholderTextColor={colors.textSecondary}
              value={newProduct.stock}
              onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
              keyboardType="number-pad"
            />

            <TextInput
              style={[commonStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={newProduct.description}
              onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={[buttonStyles.outline, { flex: 1 }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[buttonStyles.text, { color: colors.primary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleAddProduct}
              >
                <Text style={buttonStyles.text}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

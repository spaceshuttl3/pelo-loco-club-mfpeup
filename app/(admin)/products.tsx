
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
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
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { Product } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';
import * as ImagePicker from 'expo-image-picker';

export default function ManageProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to upload product photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const handleAddProduct = async () => {
    if (!name || !price || !stock || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!photoUrl) {
      Alert.alert('Error', 'Product photo is required');
      return;
    }

    setUploading(true);
    try {
      const productData = {
        name,
        price: parseFloat(price),
        stock: parseInt(stock),
        description,
        photo_url: photoUrl,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Error updating product:', error);
          Alert.alert('Error', 'Could not update product');
          return;
        }

        Alert.alert('Success', 'Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) {
          console.error('Error adding product:', error);
          Alert.alert('Error', 'Could not add product');
          return;
        }

        Alert.alert('Success', 'Product added successfully');
      }

      setModalVisible(false);
      setName('');
      setPrice('');
      setStock('');
      setDescription('');
      setPhotoUrl('');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error in handleAddProduct:', error);
      Alert.alert('Error', 'Could not save product');
    } finally {
      setUploading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setDescription(product.description || '');
    setPhotoUrl(product.photo_url || '');
    setModalVisible(true);
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

              if (error) {
                console.error('Error deleting product:', error);
                Alert.alert('Error', 'Could not delete product');
                return;
              }

              Alert.alert('Success', 'Product deleted successfully');
              fetchProducts();
            } catch (error) {
              console.error('Error in handleDeleteProduct:', error);
              Alert.alert('Error', 'Could not delete product');
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
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>Manage Products</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingProduct(null);
            setName('');
            setPrice('');
            setStock('');
            setDescription('');
            setPhotoUrl('');
            setModalVisible(true);
          }}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {products.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="bag.fill" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No products yet
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
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
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

              <Text style={[commonStyles.textSecondary, { marginBottom: 12 }]}>
                Stock: {product.stock}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, paddingVertical: 8 }]}
                  onPress={() => handleEditProduct(product)}
                >
                  <Text style={buttonStyles.text}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, paddingVertical: 8, backgroundColor: colors.error }]}
                  onPress={() => handleDeleteProduct(product.id)}
                >
                  <Text style={buttonStyles.text}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </Text>

            <ScrollView>
              <TextInput
                style={commonStyles.input}
                placeholder="Product Name *"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Price *"
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Stock *"
                placeholderTextColor={colors.textSecondary}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
              />

              <TextInput
                style={[commonStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Description *"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TouchableOpacity
                style={[commonStyles.card, { alignItems: 'center', padding: 20, marginBottom: 16 }]}
                onPress={pickImage}
              >
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={{ width: '100%', height: 200, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                    <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
                      Tap to add product photo *
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={handleAddProduct}
                  disabled={uploading}
                >
                  <Text style={buttonStyles.text}>
                    {uploading ? 'Saving...' : editingProduct ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => {
                    setModalVisible(false);
                    setEditingProduct(null);
                    setName('');
                    setPrice('');
                    setStock('');
                    setDescription('');
                    setPhotoUrl('');
                  }}
                  disabled={uploading}
                >
                  <Text style={[buttonStyles.text, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

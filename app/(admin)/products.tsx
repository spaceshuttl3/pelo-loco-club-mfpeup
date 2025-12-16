
import * as ImagePicker from 'expo-image-picker';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { IconSymbol } from '@/components/IconSymbol';
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
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ManageProductsScreen() {
  const router = useRouter();
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
  const [photoUri, setPhotoUri] = useState('');
  const [saving, setSaving] = useState(false);

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
    try {
      console.log('Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permesso Negato', 'Abbiamo bisogno del permesso per accedere alla galleria');
        return;
      }

      console.log('Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('Image selected:', result.assets[0].uri);
        setPhotoUri(result.assets[0].uri);
        setPhotoUrl('');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Errore', 'Impossibile selezionare l\'immagine');
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      console.log('Starting image upload from URI:', uri);
      
      // Generate a unique filename
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Read the file as a blob using fetch
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log('Blob created, size:', blob.size, 'type:', blob.type);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, blob, {
          contentType: blob.type || `image/${fileExt}`,
          upsert: false,
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Image uploaded successfully:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in uploadImage:', error);
      Alert.alert('Errore', 'Impossibile caricare l\'immagine. Verifica la connessione internet e riprova.');
      return null;
    }
  };

  const handleAddProduct = async () => {
    if (!name || !price || !stock) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori (nome, prezzo, stock)');
      return;
    }

    if (!photoUri && !photoUrl) {
      Alert.alert('Errore', 'L\'immagine del prodotto è obbligatoria. Seleziona un\'immagine.');
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Errore', 'Inserisci un prezzo valido');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      Alert.alert('Errore', 'Inserisci una quantità di stock valida');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoUrl = photoUrl;

      // Upload new image if a new one was selected
      if (photoUri) {
        console.log('Uploading new image...');
        const uploadedUrl = await uploadImage(photoUri);
        if (!uploadedUrl) {
          setSaving(false);
          return;
        }
        finalPhotoUrl = uploadedUrl;
        console.log('Image uploaded, URL:', finalPhotoUrl);
      }

      const productData = {
        name,
        price: priceNum,
        stock: stockNum,
        description,
        photo_url: finalPhotoUrl,
      };

      console.log('Saving product data:', productData);

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Error updating product:', error);
          Alert.alert('Errore', 'Impossibile aggiornare il prodotto');
          return;
        }

        Alert.alert('Successo', 'Prodotto aggiornato con successo');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) {
          console.error('Error adding product:', error);
          Alert.alert('Errore', 'Impossibile aggiungere il prodotto');
          return;
        }

        Alert.alert('Successo', 'Prodotto aggiunto con successo');
      }

      setModalVisible(false);
      setName('');
      setPrice('');
      setStock('');
      setDescription('');
      setPhotoUrl('');
      setPhotoUri('');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error in handleAddProduct:', error);
      Alert.alert('Errore', 'Impossibile salvare il prodotto');
    } finally {
      setSaving(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setDescription(product.description || '');
    setPhotoUrl(product.photo_url || '');
    setPhotoUri('');
    setModalVisible(true);
  };

  const handleDeleteProduct = (id: string) => {
    Alert.alert(
      'Elimina Prodotto',
      'Sei sicuro di voler eliminare questo prodotto?',
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
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

              if (error) {
                console.error('Error deleting product:', error);
                Alert.alert('Errore', 'Impossibile eliminare il prodotto');
                return;
              }

              Alert.alert('Successo', 'Prodotto eliminato con successo');
              fetchProducts();
            } catch (error) {
              console.error('Error in handleDeleteProduct:', error);
              Alert.alert('Errore', 'Impossibile eliminare il prodotto');
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

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Gestione prodotti</Text>
        <TouchableOpacity
          onPress={() => {
            setEditingProduct(null);
            setName('');
            setPrice('');
            setStock('');
            setDescription('');
            setPhotoUrl('');
            setPhotoUri('');
            setModalVisible(true);
          }}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
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
             Ancora nessun prodotto
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {products.map((product) => (
              <View key={`product-${product.id}`} style={[commonStyles.card, { marginBottom: 16, padding: 0, overflow: 'hidden' }]}>
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
                  </View>
                )}
                
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                        {product.name}
                      </Text>
                      <Text style={commonStyles.textSecondary}>
                        {product.description}
                      </Text>
                    </View>
                    <Text style={[commonStyles.text, { color: colors.primary, fontWeight: 'bold', fontSize: 18, marginLeft: 12 }]}>
                      €{product.price}
                    </Text>
                  </View>

                  <Text style={[commonStyles.textSecondary, { marginBottom: 12 }]}>
                    Stock: {product.stock}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={[buttonStyles.primary, { flex: 1, paddingVertical: 10 }]}
                      onPress={() => handleEditProduct(product)}
                    >
                      <Text style={buttonStyles.text}>Modifica</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[buttonStyles.primary, { flex: 1, paddingVertical: 10, backgroundColor: colors.error }]}
                      onPress={() => handleDeleteProduct(product.id)}
                    >
                      <Text style={buttonStyles.text}>Cancella</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </React.Fragment>
        )}
      </ScrollView>

      {/* Add/Edit Product Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <ScrollView style={{ width: '100%' }} contentContainerStyle={{ alignItems: 'center', paddingVertical: 40 }}>
            <View style={[commonStyles.card, { width: '90%' }]}>
              <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                {editingProduct ? 'Modifica Prodotto' : 'Aggiungi Prodotto'}
              </Text>

              <TouchableOpacity
                style={[
                  commonStyles.card,
                  {
                    height: 200,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 16,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={pickImage}
              >
                {(photoUri || photoUrl) ? (
                  <Image
                    source={{ uri: photoUri || photoUrl }}
                    style={{ width: '100%', height: '100%', borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <>
                    <IconSymbol name="photo" size={48} color={colors.textSecondary} />
                    <Text style={[commonStyles.textSecondary, { marginTop: 8 }]}>
                      Clicca per aggiungere una foto *
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TextInput
                style={commonStyles.input}
                placeholder="Nome Prodotto *"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Prezzo *"
                placeholderTextColor={colors.textSecondary}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Quantità Stock *"
                placeholderTextColor={colors.textSecondary}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
              />

              <TextInput
                style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Descrizione"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={handleAddProduct}
                  disabled={saving}
                >
                  <Text style={buttonStyles.text}>
                    {saving ? 'Salvataggio...' : editingProduct ? 'Aggiorna' : 'Aggiungi'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => {
                    setModalVisible(false);
                    setEditingProduct(null);
                  }}
                  disabled={saving}
                >
                  <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

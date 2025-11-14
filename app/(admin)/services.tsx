
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function ServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        return;
      }

      setServices(data || []);
    } catch (error) {
      console.error('Error in fetchServices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleAddService = () => {
    setEditingService(null);
    setName('');
    setDuration('');
    setPrice('');
    setDescription('');
    setModalVisible(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDuration(service.duration.toString());
    setPrice(service.price.toString());
    setDescription(service.description || '');
    setModalVisible(true);
  };

  const handleSaveService = async () => {
    if (!name || !duration || !price) {
      Alert.alert('Errore', 'Compila tutti i campi obbligatori');
      return;
    }

    const durationNum = parseInt(duration);
    const priceNum = parseFloat(price);

    if (isNaN(durationNum) || durationNum <= 0) {
      Alert.alert('Errore', 'Inserisci una durata valida (in minuti)');
      return;
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Errore', 'Inserisci un prezzo valido');
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name,
            duration: durationNum,
            price: priceNum,
            description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingService.id);

        if (error) throw error;
        Alert.alert('Successo', 'Servizio aggiornato con successo');
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            name,
            duration: durationNum,
            price: priceNum,
            description,
            is_active: true,
          });

        if (error) throw error;
        Alert.alert('Successo', 'Servizio aggiunto con successo');
      }

      setModalVisible(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      Alert.alert('Errore', 'Impossibile salvare il servizio');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      Alert.alert('Errore', 'Impossibile aggiornare il servizio');
    }
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Elimina Servizio',
      `Sei sicuro di voler eliminare "${service.name}"?`,
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
                .from('services')
                .delete()
                .eq('id', service.id);

              if (error) throw error;
              Alert.alert('Successo', 'Servizio eliminato');
              fetchServices();
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Errore', 'Impossibile eliminare il servizio');
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
        <Text style={commonStyles.headerTitle}>Gestione Servizi</Text>
        <TouchableOpacity onPress={handleAddService}>
          <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {services.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="scissors" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun servizio disponibile
            </Text>
            <TouchableOpacity
              style={[buttonStyles.primary, { marginTop: 16 }]}
              onPress={handleAddService}
            >
              <Text style={buttonStyles.text}>Aggiungi Servizio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <React.Fragment>
            {services.map((service, index) => (
              <View
                key={`service-${service.id}-${index}`}
                style={[
                  commonStyles.card,
                  { marginBottom: 16, opacity: service.is_active ? 1 : 0.6 },
                ]}
              >
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', fontSize: 18 }]}>
                      {service.name}
                    </Text>
                    {service.description && (
                      <Text style={[commonStyles.textSecondary, { marginTop: 4 }]}>
                        {service.description}
                      </Text>
                    )}
                  </View>
                  <View
                    style={{
                      backgroundColor: service.is_active ? colors.primary : colors.textSecondary,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 12 }]}>
                      {service.is_active ? 'ATTIVO' : 'DISATTIVO'}
                    </Text>
                  </View>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={commonStyles.textSecondary}>
                    ⏱️ Durata: {service.duration} minuti
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    💰 Prezzo: €{service.price}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[
                      buttonStyles.primary,
                      { flex: 1, paddingVertical: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
                    ]}
                    onPress={() => handleEditService(service)}
                  >
                    <Text style={[buttonStyles.text, { color: colors.text, fontSize: 14 }]}>
                      Modifica
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      buttonStyles.primary,
                      { flex: 1, paddingVertical: 10, backgroundColor: service.is_active ? colors.textSecondary : colors.primary },
                    ]}
                    onPress={() => handleToggleActive(service)}
                  >
                    <Text style={[buttonStyles.text, { fontSize: 14 }]}>
                      {service.is_active ? 'Disattiva' : 'Attiva'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      buttonStyles.primary,
                      { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.error },
                    ]}
                    onPress={() => handleDeleteService(service)}
                  >
                    <IconSymbol name="trash" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </React.Fragment>
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
              {editingService ? 'Modifica Servizio' : 'Nuovo Servizio'}
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Nome Servizio *"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
              editable={!saving}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Durata (minuti) *"
              placeholderTextColor={colors.textSecondary}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              editable={!saving}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Prezzo (€) *"
              placeholderTextColor={colors.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              editable={!saving}
            />

            <TextInput
              style={[commonStyles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Descrizione (opzionale)"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!saving}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleSaveService}
                disabled={saving}
              >
                <Text style={buttonStyles.text}>
                  {saving ? 'Salvataggio...' : 'Salva'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { supabase } from '../../lib/supabase';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FidelityReward } from '../../types';

export default function FidelityConfigScreen() {
  const router = useRouter();
  const [rewards, setRewards] = useState<FidelityReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState<FidelityReward | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creditsRequired, setCreditsRequired] = useState('');

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      console.log('Fetching fidelity rewards...');
      
      const { data, error } = await supabase
        .from('fidelity_rewards')
        .select('*')
        .order('credits_required', { ascending: true });

      if (error) {
        console.error('Error fetching rewards:', error);
      } else {
        console.log('Rewards fetched:', data?.length || 0);
        setRewards(data || []);
      }
    } catch (error) {
      console.error('Error in fetchRewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRewards();
  };

  const handleSaveReward = async () => {
    if (!name || !description || !creditsRequired) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    const credits = parseInt(creditsRequired);

    if (isNaN(credits) || credits <= 0) {
      Alert.alert('Errore', 'Inserisci un numero valido di crediti');
      return;
    }

    setSaving(true);
    try {
      const rewardData = {
        name: name.trim(),
        description: description.trim(),
        credits_required: credits,
        is_active: true,
      };

      if (editingReward) {
        const { error } = await supabase
          .from('fidelity_rewards')
          .update(rewardData)
          .eq('id', editingReward.id);

        if (error) throw error;
        Alert.alert('Successo', 'Ricompensa aggiornata');
      } else {
        const { error } = await supabase
          .from('fidelity_rewards')
          .insert(rewardData);

        if (error) throw error;
        Alert.alert('Successo', 'Ricompensa creata');
      }

      setModalVisible(false);
      resetForm();
      fetchRewards();
    } catch (error) {
      console.error('Error saving reward:', error);
      Alert.alert('Errore', 'Impossibile salvare la ricompensa');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReward = (reward: FidelityReward) => {
    Alert.alert(
      'Elimina Ricompensa',
      `Sei sicuro di voler eliminare "${reward.name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('fidelity_rewards')
                .delete()
                .eq('id', reward.id);

              if (error) throw error;
              Alert.alert('Successo', 'Ricompensa eliminata');
              fetchRewards();
            } catch (error) {
              console.error('Error deleting reward:', error);
              Alert.alert('Errore', 'Impossibile eliminare la ricompensa');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCreditsRequired('');
    setEditingReward(null);
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
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Configurazione Fedeltà</Text>
        <TouchableOpacity
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          activeOpacity={0.7}
        >
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
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
          Ricompense Fedeltà ({rewards.length})
        </Text>

        {rewards.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessuna ricompensa configurata
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {rewards.map((reward, index) => (
              <View key={`reward-${reward.id}-${index}`} style={[commonStyles.card, { marginBottom: 12 }]}>
                <View style={[commonStyles.row, { marginBottom: 12 }]}>
                  <View
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 18, fontWeight: 'bold' }]}>
                      {reward.credits_required}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {reward.name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {reward.description}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[buttonStyles.primary, { flex: 1, paddingVertical: 10, backgroundColor: colors.card }]}
                    onPress={() => {
                      setEditingReward(reward);
                      setName(reward.name);
                      setDescription(reward.description);
                      setCreditsRequired(reward.credits_required.toString());
                      setModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[buttonStyles.text, { color: colors.text }]}>Modifica</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[buttonStyles.primary, { flex: 1, paddingVertical: 10, backgroundColor: colors.error }]}
                    onPress={() => handleDeleteReward(reward)}
                    activeOpacity={0.7}
                  >
                    <Text style={buttonStyles.text}>Elimina</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </React.Fragment>
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <ScrollView>
              <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                {editingReward ? 'Modifica Ricompensa' : 'Nuova Ricompensa'}
              </Text>

              <TextInput
                style={commonStyles.input}
                placeholder="Nome Ricompensa"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={[commonStyles.input, { height: 80 }]}
                placeholder="Descrizione"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Crediti Richiesti"
                placeholderTextColor={colors.textSecondary}
                value={creditsRequired}
                onChangeText={setCreditsRequired}
                keyboardType="number-pad"
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={handleSaveReward}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>
                    {saving ? 'Salvataggio...' : editingReward ? 'Aggiorna' : 'Crea'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

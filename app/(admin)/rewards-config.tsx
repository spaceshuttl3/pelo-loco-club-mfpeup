
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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { LoyaltyReward, BadgeRule } from '@/types';

export default function RewardsConfigScreen() {
  const router = useRouter();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [badgeRules, setBadgeRules] = useState<BadgeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [editingBadge, setEditingBadge] = useState<BadgeRule | null>(null);
  const [saving, setSaving] = useState(false);

  // Reward form state
  const [pointsRequired, setPointsRequired] = useState('');
  const [rewardType, setRewardType] = useState<'free_service' | 'discount_percentage' | 'discount_euros' | 'custom'>('discount_percentage');
  const [rewardValue, setRewardValue] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');

  // Badge form state
  const [badgeName, setBadgeName] = useState('');
  const [badgeDescription, setBadgeDescription] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('star.fill');
  const [ruleType, setRuleType] = useState<'visits_count' | 'visits_timeframe' | 'total_spent'>('visits_count');
  const [requiredVisits, setRequiredVisits] = useState('');
  const [timeframeDays, setTimeframeDays] = useState('');
  const [requiredAmount, setRequiredAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching rewards and badge rules...');
      
      // Fetch rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .order('points_required', { ascending: true });

      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
      } else {
        console.log('Rewards fetched:', rewardsData?.length || 0);
        setRewards(rewardsData || []);
      }

      // Fetch badge rules
      const { data: badgesData, error: badgesError } = await supabase
        .from('badge_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (badgesError) {
        console.error('Error fetching badge rules:', badgesError);
      } else {
        console.log('Badge rules fetched:', badgesData?.length || 0);
        setBadgeRules(badgesData || []);
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSaveReward = async () => {
    if (!pointsRequired || !rewardValue || !rewardDescription) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    const points = parseInt(pointsRequired);
    const value = parseFloat(rewardValue);

    if (isNaN(points) || points <= 0) {
      Alert.alert('Errore', 'Inserisci un numero valido di punti');
      return;
    }

    if (isNaN(value) || value <= 0) {
      Alert.alert('Errore', 'Inserisci un valore valido');
      return;
    }

    setSaving(true);
    try {
      const rewardData = {
        points_required: points,
        reward_type: rewardType,
        reward_value: value,
        reward_description: rewardDescription.trim(),
        is_active: true,
      };

      if (editingReward) {
        const { error } = await supabase
          .from('loyalty_rewards')
          .update(rewardData)
          .eq('id', editingReward.id);

        if (error) throw error;
        Alert.alert('Successo', 'Ricompensa aggiornata');
      } else {
        const { error } = await supabase
          .from('loyalty_rewards')
          .insert(rewardData);

        if (error) throw error;
        Alert.alert('Successo', 'Ricompensa creata');
      }

      setRewardModalVisible(false);
      resetRewardForm();
      fetchData();
    } catch (error) {
      console.error('Error saving reward:', error);
      Alert.alert('Errore', 'Impossibile salvare la ricompensa');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBadge = async () => {
    if (!badgeName || !badgeDescription) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    let ruleConfig: any = {};

    if (ruleType === 'visits_count') {
      const visits = parseInt(requiredVisits);
      if (isNaN(visits) || visits <= 0) {
        Alert.alert('Errore', 'Inserisci un numero valido di visite');
        return;
      }
      ruleConfig = { required_visits: visits };
    } else if (ruleType === 'visits_timeframe') {
      const visits = parseInt(requiredVisits);
      const days = parseInt(timeframeDays);
      if (isNaN(visits) || visits <= 0 || isNaN(days) || days <= 0) {
        Alert.alert('Errore', 'Inserisci valori validi per visite e giorni');
        return;
      }
      ruleConfig = { required_visits: visits, timeframe_days: days };
    } else if (ruleType === 'total_spent') {
      const amount = parseFloat(requiredAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Errore', 'Inserisci un importo valido');
        return;
      }
      ruleConfig = { required_amount: amount };
    }

    setSaving(true);
    try {
      const badgeData = {
        badge_name: badgeName.trim(),
        badge_description: badgeDescription.trim(),
        badge_icon: badgeIcon,
        rule_type: ruleType,
        rule_config: ruleConfig,
        is_active: true,
      };

      if (editingBadge) {
        const { error } = await supabase
          .from('badge_rules')
          .update(badgeData)
          .eq('id', editingBadge.id);

        if (error) throw error;
        Alert.alert('Successo', 'Traguardo aggiornato');
      } else {
        const { error } = await supabase
          .from('badge_rules')
          .insert(badgeData);

        if (error) throw error;
        Alert.alert('Successo', 'Traguardo creato');
      }

      setBadgeModalVisible(false);
      resetBadgeForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving badge:', error);
      if (error.code === '23505') {
        Alert.alert('Errore', 'Esiste già un traguardo con questo nome');
      } else {
        Alert.alert('Errore', 'Impossibile salvare il traguardo');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReward = (reward: LoyaltyReward) => {
    Alert.alert(
      'Elimina Ricompensa',
      `Sei sicuro di voler eliminare "${reward.reward_description}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('loyalty_rewards')
                .delete()
                .eq('id', reward.id);

              if (error) throw error;
              Alert.alert('Successo', 'Ricompensa eliminata');
              fetchData();
            } catch (error) {
              console.error('Error deleting reward:', error);
              Alert.alert('Errore', 'Impossibile eliminare la ricompensa');
            }
          },
        },
      ]
    );
  };

  const handleDeleteBadge = (badge: BadgeRule) => {
    Alert.alert(
      'Elimina Traguardo',
      `Sei sicuro di voler eliminare "${badge.badge_name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('badge_rules')
                .delete()
                .eq('id', badge.id);

              if (error) throw error;
              Alert.alert('Successo', 'Traguardo eliminato');
              fetchData();
            } catch (error) {
              console.error('Error deleting badge:', error);
              Alert.alert('Errore', 'Impossibile eliminare il traguardo');
            }
          },
        },
      ]
    );
  };

  const resetRewardForm = () => {
    setPointsRequired('');
    setRewardType('discount_percentage');
    setRewardValue('');
    setRewardDescription('');
    setEditingReward(null);
  };

  const resetBadgeForm = () => {
    setBadgeName('');
    setBadgeDescription('');
    setBadgeIcon('star.fill');
    setRuleType('visits_count');
    setRequiredVisits('');
    setTimeframeDays('');
    setRequiredAmount('');
    setEditingBadge(null);
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
        <Text style={commonStyles.headerTitle}>Configurazione Premi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Loyalty Rewards Section */}
        <View style={[commonStyles.row, { marginBottom: 12 }]}>
          <Text style={[commonStyles.subtitle, { flex: 1 }]}>
            Ricompense Fedeltà ({rewards.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              resetRewardForm();
              setRewardModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

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
                      {reward.points_required}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {reward.reward_description}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {reward.reward_type === 'free_service' && 'Servizio Gratuito'}
                      {reward.reward_type === 'discount_percentage' && `${reward.reward_value}% di sconto`}
                      {reward.reward_type === 'discount_euros' && `€${reward.reward_value} di sconto`}
                      {reward.reward_type === 'custom' && 'Ricompensa Speciale'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[buttonStyles.primary, { flex: 1, paddingVertical: 10, backgroundColor: colors.card }]}
                    onPress={() => {
                      setEditingReward(reward);
                      setPointsRequired(reward.points_required.toString());
                      setRewardType(reward.reward_type);
                      setRewardValue(reward.reward_value.toString());
                      setRewardDescription(reward.reward_description);
                      setRewardModalVisible(true);
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

        {/* Badge Rules Section */}
        <View style={[commonStyles.row, { marginTop: 24, marginBottom: 12 }]}>
          <Text style={[commonStyles.subtitle, { flex: 1 }]}>
            Traguardi ({badgeRules.length})
          </Text>
          <TouchableOpacity
            onPress={() => {
              resetBadgeForm();
              setBadgeModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="plus.circle.fill" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {badgeRules.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="trophy" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun traguardo configurato
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {badgeRules.map((badge, index) => (
              <View key={`badge-${badge.id}-${index}`} style={[commonStyles.card, { marginBottom: 12 }]}>
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
                    <IconSymbol name={badge.badge_icon} size={24} color={colors.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {badge.badge_name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {badge.badge_description}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                      {badge.rule_type === 'visits_count' && `${badge.rule_config.required_visits} visite`}
                      {badge.rule_type === 'visits_timeframe' && 
                        `${badge.rule_config.required_visits} visite in ${badge.rule_config.timeframe_days} giorni`}
                      {badge.rule_type === 'total_spent' && `€${badge.rule_config.required_amount} spesi`}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[buttonStyles.primary, { flex: 1, paddingVertical: 10, backgroundColor: colors.card }]}
                    onPress={() => {
                      setEditingBadge(badge);
                      setBadgeName(badge.badge_name);
                      setBadgeDescription(badge.badge_description);
                      setBadgeIcon(badge.badge_icon);
                      setRuleType(badge.rule_type);
                      if (badge.rule_config.required_visits) {
                        setRequiredVisits(badge.rule_config.required_visits.toString());
                      }
                      if (badge.rule_config.timeframe_days) {
                        setTimeframeDays(badge.rule_config.timeframe_days.toString());
                      }
                      if (badge.rule_config.required_amount) {
                        setRequiredAmount(badge.rule_config.required_amount.toString());
                      }
                      setBadgeModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[buttonStyles.text, { color: colors.text }]}>Modifica</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[buttonStyles.primary, { flex: 1, paddingVertical: 10, backgroundColor: colors.error }]}
                    onPress={() => handleDeleteBadge(badge)}
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

      {/* Reward Modal */}
      <Modal
        visible={rewardModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRewardModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <ScrollView>
              <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                {editingReward ? 'Modifica Ricompensa' : 'Nuova Ricompensa'}
              </Text>

              <TextInput
                style={commonStyles.input}
                placeholder="Punti Richiesti"
                placeholderTextColor={colors.textSecondary}
                value={pointsRequired}
                onChangeText={setPointsRequired}
                keyboardType="number-pad"
              />

              <Text style={[commonStyles.text, { marginBottom: 8, marginTop: 16, fontWeight: '600' }]}>
                Tipo di Ricompensa
              </Text>
              <View style={[commonStyles.card, { marginBottom: 16 }]}>
                <Picker
                  selectedValue={rewardType}
                  onValueChange={(itemValue) => setRewardType(itemValue)}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label="Sconto Percentuale" value="discount_percentage" />
                  <Picker.Item label="Sconto in Euro" value="discount_euros" />
                  <Picker.Item label="Servizio Gratuito" value="free_service" />
                  <Picker.Item label="Personalizzato" value="custom" />
                </Picker>
              </View>

              <TextInput
                style={commonStyles.input}
                placeholder={rewardType === 'discount_percentage' ? 'Valore (%)' : 'Valore (€)'}
                placeholderTextColor={colors.textSecondary}
                value={rewardValue}
                onChangeText={setRewardValue}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={[commonStyles.input, { height: 80 }]}
                placeholder="Descrizione Ricompensa"
                placeholderTextColor={colors.textSecondary}
                value={rewardDescription}
                onChangeText={setRewardDescription}
                multiline
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
                    setRewardModalVisible(false);
                    resetRewardForm();
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

      {/* Badge Modal */}
      <Modal
        visible={badgeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBadgeModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <ScrollView>
              <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                {editingBadge ? 'Modifica Traguardo' : 'Nuovo Traguardo'}
              </Text>

              <TextInput
                style={commonStyles.input}
                placeholder="Nome Traguardo"
                placeholderTextColor={colors.textSecondary}
                value={badgeName}
                onChangeText={setBadgeName}
              />

              <TextInput
                style={[commonStyles.input, { height: 80 }]}
                placeholder="Descrizione"
                placeholderTextColor={colors.textSecondary}
                value={badgeDescription}
                onChangeText={setBadgeDescription}
                multiline
              />

              <TextInput
                style={commonStyles.input}
                placeholder="Icona (es. star.fill, trophy.fill)"
                placeholderTextColor={colors.textSecondary}
                value={badgeIcon}
                onChangeText={setBadgeIcon}
              />

              <Text style={[commonStyles.text, { marginBottom: 8, marginTop: 16, fontWeight: '600' }]}>
                Tipo di Regola
              </Text>
              <View style={[commonStyles.card, { marginBottom: 16 }]}>
                <Picker
                  selectedValue={ruleType}
                  onValueChange={(itemValue) => setRuleType(itemValue)}
                  style={{ color: colors.text }}
                >
                  <Picker.Item label="Numero di Visite" value="visits_count" />
                  <Picker.Item label="Visite in Periodo" value="visits_timeframe" />
                  <Picker.Item label="Totale Speso" value="total_spent" />
                </Picker>
              </View>

              {ruleType === 'visits_count' && (
                <TextInput
                  style={commonStyles.input}
                  placeholder="Numero di Visite Richieste"
                  placeholderTextColor={colors.textSecondary}
                  value={requiredVisits}
                  onChangeText={setRequiredVisits}
                  keyboardType="number-pad"
                />
              )}

              {ruleType === 'visits_timeframe' && (
                <>
                  <TextInput
                    style={commonStyles.input}
                    placeholder="Numero di Visite Richieste"
                    placeholderTextColor={colors.textSecondary}
                    value={requiredVisits}
                    onChangeText={setRequiredVisits}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={commonStyles.input}
                    placeholder="Periodo in Giorni"
                    placeholderTextColor={colors.textSecondary}
                    value={timeframeDays}
                    onChangeText={setTimeframeDays}
                    keyboardType="number-pad"
                  />
                </>
              )}

              {ruleType === 'total_spent' && (
                <TextInput
                  style={commonStyles.input}
                  placeholder="Importo Totale Richiesto (€)"
                  placeholderTextColor={colors.textSecondary}
                  value={requiredAmount}
                  onChangeText={setRequiredAmount}
                  keyboardType="decimal-pad"
                />
              )}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={handleSaveBadge}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>
                    {saving ? 'Salvataggio...' : editingBadge ? 'Aggiorna' : 'Crea'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => {
                    setBadgeModalVisible(false);
                    resetBadgeForm();
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

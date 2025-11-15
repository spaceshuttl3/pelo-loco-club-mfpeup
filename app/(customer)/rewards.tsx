
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { LoyaltyReward, Badge, LoyaltyTransaction } from '@/types';
import { GlassView } from 'expo-glass-effect';

const { width } = Dimensions.get('window');

export default function RewardsScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      console.log('Fetching rewards and transactions...');
      
      // Fetch active rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('points_required', { ascending: true });

      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
      } else {
        console.log('Rewards fetched:', rewardsData?.length || 0);
        setRewards(rewardsData || []);
      }

      // Fetch user's loyalty transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        console.log('Transactions fetched:', transactionsData?.length || 0);
        setTransactions(transactionsData || []);
      }

      // Refresh user data to get latest points and badges
      await refreshUser();
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

  const handleRedeemReward = (reward: LoyaltyReward) => {
    if (!user?.loyalty_points || user.loyalty_points < reward.points_required) {
      Alert.alert('Punti Insufficienti', `Hai bisogno di ${reward.points_required} punti per riscattare questa ricompensa.`);
      return;
    }

    Alert.alert(
      'Riscatta Ricompensa',
      `Vuoi riscattare questa ricompensa?\n\n${reward.reward_description}\n\nCosto: ${reward.points_required} punti\nPunti rimanenti: ${user.loyalty_points - reward.points_required}`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Riscatta',
          onPress: async () => {
            setRedeeming(true);
            try {
              // Deduct points
              const { error: updateError } = await supabase
                .from('users')
                .update({ loyalty_points: user.loyalty_points - reward.points_required })
                .eq('id', user.id);

              if (updateError) throw updateError;

              // Record transaction
              const { error: transactionError } = await supabase
                .from('loyalty_transactions')
                .insert({
                  user_id: user.id,
                  points_change: -reward.points_required,
                  transaction_type: 'redeemed',
                  reference_type: 'reward',
                  reference_id: reward.id,
                  description: `Redeemed: ${reward.reward_description}`,
                });

              if (transactionError) throw transactionError;

              Alert.alert(
                'Successo!',
                'Ricompensa riscattata! Mostra questa conferma al barbiere.',
                [{ text: 'OK', onPress: () => fetchData() }]
              );
            } catch (error) {
              console.error('Error redeeming reward:', error);
              Alert.alert('Errore', 'Impossibile riscattare la ricompensa. Riprova.');
            } finally {
              setRedeeming(false);
            }
          },
        },
      ]
    );
  };

  const getNextReward = () => {
    if (!user?.loyalty_points) return null;
    return rewards.find(r => r.points_required > user.loyalty_points);
  };

  const getProgressToNextReward = () => {
    const nextReward = getNextReward();
    if (!nextReward || !user?.loyalty_points) return 0;
    return (user.loyalty_points / nextReward.points_required) * 100;
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const nextReward = getNextReward();
  const progress = getProgressToNextReward();
  const userBadges = (user?.badges as Badge[]) || [];

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={commonStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Premi & Traguardi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Points Card */}
        <GlassView
          style={[
            commonStyles.card,
            {
              backgroundColor: colors.primary,
              padding: 24,
              alignItems: 'center',
              marginBottom: 20,
            },
          ]}
          intensity={80}
        >
          <IconSymbol name="star.fill" size={48} color={colors.text} />
          <Text style={[commonStyles.text, { fontSize: 48, fontWeight: 'bold', marginTop: 12 }]}>
            {user?.loyalty_points || 0}
          </Text>
          <Text style={[commonStyles.text, { fontSize: 18, marginTop: 4 }]}>
            Punti Fedeltà
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
            Guadagna 1 punto per ogni appuntamento completato
          </Text>
        </GlassView>

        {/* Next Reward Progress */}
        {nextReward && (
          <View style={[commonStyles.card, { marginBottom: 20 }]}>
            <View style={[commonStyles.row, { marginBottom: 12 }]}>
              <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                Prossima Ricompensa
              </Text>
              <Text style={[commonStyles.text, { color: colors.primary }]}>
                {user?.loyalty_points || 0}/{nextReward.points_required}
              </Text>
            </View>
            
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: colors.primary,
                }}
              />
            </View>

            <Text style={commonStyles.textSecondary}>
              {nextReward.reward_description}
            </Text>
            <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
              Ancora {nextReward.points_required - (user?.loyalty_points || 0)} punti
            </Text>
          </View>
        )}

        {/* Available Rewards */}
        <Text style={[commonStyles.subtitle, { marginBottom: 12 }]}>
          Ricompense Disponibili
        </Text>

        {rewards.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="gift" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Nessuna ricompensa disponibile al momento
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {rewards.map((reward, index) => {
              const canRedeem = (user?.loyalty_points || 0) >= reward.points_required;
              return (
                <GlassView
                  key={`reward-${reward.id}-${index}`}
                  style={[
                    commonStyles.card,
                    {
                      marginBottom: 12,
                      opacity: canRedeem ? 1 : 0.6,
                    },
                  ]}
                  intensity={canRedeem ? 80 : 40}
                >
                  <View style={[commonStyles.row, { marginBottom: 12 }]}>
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: canRedeem ? colors.primary : colors.card,
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

                  {canRedeem && (
                    <TouchableOpacity
                      style={[buttonStyles.primary, { paddingVertical: 10 }]}
                      onPress={() => handleRedeemReward(reward)}
                      disabled={redeeming}
                      activeOpacity={0.7}
                    >
                      <Text style={buttonStyles.text}>
                        {redeeming ? 'Riscatto...' : 'Riscatta'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </GlassView>
              );
            })}
          </React.Fragment>
        )}

        {/* Earned Badges */}
        <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
          Traguardi Raggiunti ({userBadges.length})
        </Text>

        {userBadges.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="trophy" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16, textAlign: 'center' }]}>
              Nessun traguardo raggiunto ancora.{'\n'}Continua a prenotare per sbloccare i traguardi!
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
            {userBadges.map((badge, index) => (
              <GlassView
                key={`badge-${badge.badge_id}-${index}`}
                style={{
                  width: (width - 48) / 2,
                  margin: 6,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                intensity={80}
              >
                <IconSymbol name={badge.badge_icon} size={40} color={colors.primary} />
                <Text style={[commonStyles.text, { fontWeight: '600', marginTop: 12, textAlign: 'center' }]}>
                  {badge.badge_name}
                </Text>
                <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4, textAlign: 'center' }]}>
                  {badge.badge_description}
                </Text>
                <Text style={[commonStyles.textSecondary, { fontSize: 10, marginTop: 8 }]}>
                  {new Date(badge.earned_at).toLocaleDateString('it-IT')}
                </Text>
              </GlassView>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
              Cronologia Punti
            </Text>
            <React.Fragment>
              {transactions.map((transaction, index) => (
                <View key={`transaction-${transaction.id}-${index}`} style={[commonStyles.card, { marginBottom: 8 }]}>
                  <View style={[commonStyles.row, { marginBottom: 4 }]}>
                    <Text style={[commonStyles.text, { flex: 1 }]}>
                      {transaction.description}
                    </Text>
                    <Text
                      style={[
                        commonStyles.text,
                        {
                          fontWeight: 'bold',
                          color: transaction.points_change > 0 ? colors.primary : colors.error,
                        },
                      ]}
                    >
                      {transaction.points_change > 0 ? '+' : ''}
                      {transaction.points_change}
                    </Text>
                  </View>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    {new Date(transaction.created_at).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              ))}
            </React.Fragment>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

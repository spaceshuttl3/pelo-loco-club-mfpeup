
import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { useAuth } from '../../contexts/AuthContext';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { FidelityReward, FidelityRedemption, FidelityTransaction } from '../../types';
import { GlassView } from 'expo-glass-effect';

const { width } = Dimensions.get('window');

export default function FidelityScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [rewards, setRewards] = useState<FidelityReward[]>([]);
  const [redemptions, setRedemptions] = useState<FidelityRedemption[]>([]);
  const [transactions, setTransactions] = useState<FidelityTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  
  // Use ref to prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    // Prevent duplicate fetches within 2 seconds unless forced
    const now = Date.now();
    if (!forceRefresh && (isFetchingRef.current || (now - lastFetchTimeRef.current < 2000))) {
      console.log('Skipping duplicate fetch request');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      console.log('Fetching fidelity data for user:', user?.id);
      
      if (!user?.id) {
        console.error('No user ID available');
        setLoading(false);
        setRefreshing(false);
        isFetchingRef.current = false;
        return;
      }

      // Fetch active rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('fidelity_rewards')
        .select('*')
        .eq('is_active', true)
        .order('credits_required', { ascending: true });

      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
      } else {
        console.log('Rewards fetched:', rewardsData?.length || 0);
        setRewards(rewardsData || []);
      }

      // Fetch user's redemptions
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('fidelity_redemptions')
        .select(`
          *,
          reward:fidelity_rewards(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (redemptionsError) {
        console.error('Error fetching redemptions:', redemptionsError);
      } else {
        console.log('Redemptions fetched:', redemptionsData?.length || 0);
        setRedemptions(redemptionsData || []);
      }

      // Fetch user's fidelity transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('fidelity_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        console.log('Transactions fetched:', transactionsData?.length || 0);
        setTransactions(transactionsData || []);
      }

      // Only refresh user data if forced (manual refresh)
      if (forceRefresh) {
        await refreshUser();
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [user?.id, refreshUser]);

  useEffect(() => {
    if (user?.id) {
      fetchData(false);
    } else {
      console.log('No user available, skipping fetch');
      setLoading(false);
    }
  }, [user?.id, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  const handleRedeemReward = (reward: FidelityReward) => {
    const userCredits = user?.fidelity_credits || 0;
    
    if (userCredits < reward.credits_required) {
      Alert.alert(
        'Crediti Insufficienti',
        `Hai bisogno di ${reward.credits_required} crediti per riscattare questa ricompensa.\n\nCrediti attuali: ${userCredits}`
      );
      return;
    }

    Alert.alert(
      'Prenota Appuntamento',
      `Per riscattare questa ricompensa, devi prenotare un appuntamento.\n\n${reward.name}\n${reward.description}\n\nCosto: ${reward.credits_required} crediti\n\nVuoi procedere con la prenotazione?`,
      [
        {
          text: 'Annulla',
          style: 'cancel',
        },
        {
          text: 'Prenota',
          onPress: () => {
            // Navigate to booking screen with reward info
            router.push({
              pathname: '/(customer)/book-appointment',
              params: {
                rewardId: reward.id,
                rewardName: reward.name,
                rewardCredits: reward.credits_required.toString(),
              },
            });
          },
        },
      ]
    );
  };

  const getNextReward = () => {
    const userCredits = user?.fidelity_credits || 0;
    return rewards.find(r => r.credits_required > userCredits);
  };

  const getProgressToNextReward = () => {
    const nextReward = getNextReward();
    const userCredits = user?.fidelity_credits || 0;
    if (!nextReward) return 100;
    return (userCredits / nextReward.credits_required) * 100;
  };

  if (loading) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]} edges={['top']}>
        <Text style={commonStyles.text}>Effettua il login per vedere il tuo programma fedeltà</Text>
      </SafeAreaView>
    );
  }

  const nextReward = getNextReward();
  const progress = getProgressToNextReward();
  const userCredits = user?.fidelity_credits || 0;

  return (
    <SafeAreaView style={commonStyles.container} edges={['top']}>
      <View style={[commonStyles.header, { paddingTop: 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }} activeOpacity={0.7}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Programma Fedeltà</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Credits Card */}
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
            {userCredits}
          </Text>
          <Text style={[commonStyles.text, { fontSize: 18, marginTop: 4 }]}>
            Crediti Fedeltà
          </Text>
          <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
            Guadagna 1 credito per ogni taglio completato e pagato
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
                {userCredits}/{nextReward.credits_required}
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

            <Text style={[commonStyles.text, { fontWeight: '600' }]}>
              {nextReward.name}
            </Text>
            <Text style={commonStyles.textSecondary}>
              {nextReward.description}
            </Text>
            <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
              Ancora {nextReward.credits_required - userCredits} crediti
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
              const canRedeem = userCredits >= reward.credits_required;
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
                      {!canRedeem && (
                        <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4, color: colors.error }]}>
                          {userCredits} / {reward.credits_required} crediti
                        </Text>
                      )}
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
                        {redeeming ? 'Riscatto...' : 'Prenota e Riscatta'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </GlassView>
              );
            })}
          </React.Fragment>
        )}

        {/* Pending Redemptions */}
        {redemptions.filter(r => r.status === 'pending').length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
              Ricompense in Attesa di Conferma
            </Text>
            <React.Fragment>
              {redemptions
                .filter(r => r.status === 'pending')
                .map((redemption, index) => (
                  <View key={`pending-${redemption.id}-${index}`} style={[commonStyles.card, { marginBottom: 12, backgroundColor: colors.primary }]}>
                    <View style={[commonStyles.row, { marginBottom: 8 }]}>
                      <Text style={[commonStyles.text, { fontWeight: '600', flex: 1 }]}>
                        {redemption.reward?.name}
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.card,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={[commonStyles.text, { fontSize: 12 }]}>
                          IN ATTESA
                        </Text>
                      </View>
                    </View>
                    <Text style={commonStyles.textSecondary}>
                      {redemption.reward?.description}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 8 }]}>
                      Riscattato il {new Date(redemption.created_at || '').toLocaleDateString('it-IT')}
                    </Text>
                    <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                      Mostra questa ricompensa al barbiere per confermarla
                    </Text>
                  </View>
                ))}
            </React.Fragment>
          </>
        )}

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <>
            <Text style={[commonStyles.subtitle, { marginTop: 24, marginBottom: 12 }]}>
              Cronologia Crediti
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
                          color: transaction.credits_change > 0 ? colors.primary : colors.error,
                        },
                      ]}
                    >
                      {transaction.credits_change > 0 ? '+' : ''}
                      {transaction.credits_change}
                    </Text>
                  </View>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    {new Date(transaction.created_at || '').toLocaleDateString('it-IT', {
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

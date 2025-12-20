
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '../../styles/commonStyles';
import { supabase } from '../../lib/supabase';
import { IconSymbol } from '../../components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, FidelityTransaction, FidelityRedemption } from '../../types';

export default function FidelityUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userTransactions, setUserTransactions] = useState<FidelityTransaction[]>([]);
  const [userRedemptions, setUserRedemptions] = useState<FidelityRedemption[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users with fidelity credits...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'customer')
        .order('fidelity_credits', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
      } else {
        console.log('Users fetched:', data?.length || 0);
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const fetchUserHistory = async (user: User) => {
    try {
      console.log('Fetching history for user:', user.id);
      
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('fidelity_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (transactionsError) {
        console.error('Error fetching transactions:', transactionsError);
      } else {
        setUserTransactions(transactionsData || []);
      }

      // Fetch redemptions
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from('fidelity_redemptions')
        .select(`
          *,
          reward:fidelity_rewards(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (redemptionsError) {
        console.error('Error fetching redemptions:', redemptionsError);
      } else {
        setUserRedemptions(redemptionsData || []);
      }

      setSelectedUser(user);
      setModalVisible(true);
    } catch (error) {
      console.error('Error in fetchUserHistory:', error);
    }
  };

  const handleAdjustCredits = async () => {
    if (!selectedUser || !adjustAmount || !adjustReason) {
      Alert.alert('Errore', 'Compila tutti i campi');
      return;
    }

    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      Alert.alert('Errore', 'Inserisci un numero valido');
      return;
    }

    const newCredits = (selectedUser.fidelity_credits || 0) + amount;
    if (newCredits < 0) {
      Alert.alert('Errore', 'I crediti non possono essere negativi');
      return;
    }

    try {
      // Update user credits
      const { error: updateError } = await supabase
        .from('users')
        .update({ fidelity_credits: newCredits })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('fidelity_transactions')
        .insert({
          user_id: selectedUser.id,
          credits_change: amount,
          transaction_type: 'adjusted',
          description: `Aggiustamento manuale: ${adjustReason}`,
        });

      if (transactionError) throw transactionError;

      Alert.alert('Successo', 'Crediti aggiornati');
      setAdjustModalVisible(false);
      setAdjustAmount('');
      setAdjustReason('');
      fetchUsers();
      if (selectedUser) {
        fetchUserHistory({ ...selectedUser, fidelity_credits: newCredits });
      }
    } catch (error) {
      console.error('Error adjusting credits:', error);
      Alert.alert('Errore', 'Impossibile aggiornare i crediti');
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={[commonStyles.headerTitle, { flex: 1 }]}>Crediti Utenti</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[commonStyles.content, { paddingTop: 0 }]}>
        <TextInput
          style={[commonStyles.input, { marginBottom: 16 }]}
          placeholder="Cerca utente..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 0 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {filteredUsers.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="person.3" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              Nessun utente trovato
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {filteredUsers.map((user, index) => (
              <TouchableOpacity
                key={`user-${user.id}-${index}`}
                style={[commonStyles.card, { marginBottom: 12 }]}
                onPress={() => fetchUserHistory(user)}
                activeOpacity={0.7}
              >
                <View style={[commonStyles.row, { marginBottom: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                      {user.name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {user.email}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={[commonStyles.text, { fontSize: 20, fontWeight: 'bold' }]}>
                      {user.fidelity_credits || 0}
                    </Text>
                  </View>
                </View>
                <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                  Tocca per vedere la cronologia
                </Text>
              </TouchableOpacity>
            ))}
          </React.Fragment>
        )}
      </ScrollView>

      {/* User History Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            {selectedUser && (
              <>
                <View style={[commonStyles.row, { marginBottom: 16 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[commonStyles.subtitle, { marginBottom: 4 }]}>
                      {selectedUser.name}
                    </Text>
                    <Text style={commonStyles.textSecondary}>
                      {selectedUser.email}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16, alignItems: 'center' }]}>
                  <Text style={[commonStyles.text, { fontSize: 40, fontWeight: 'bold' }]}>
                    {selectedUser.fidelity_credits || 0}
                  </Text>
                  <Text style={[commonStyles.text, { fontSize: 16 }]}>
                    Crediti Disponibili
                  </Text>
                </View>

                <TouchableOpacity
                  style={[buttonStyles.primary, { marginBottom: 16 }]}
                  onPress={() => setAdjustModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>Aggiusta Crediti</Text>
                </TouchableOpacity>

                <ScrollView style={{ maxHeight: 400 }}>
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 12 }]}>
                    Riscatti ({userRedemptions.length})
                  </Text>

                  {userRedemptions.length === 0 ? (
                    <Text style={[commonStyles.textSecondary, { marginBottom: 16 }]}>
                      Nessun riscatto
                    </Text>
                  ) : (
                    <React.Fragment>
                      {userRedemptions.map((redemption, index) => (
                        <View key={`redemption-${redemption.id}-${index}`} style={[commonStyles.card, { marginBottom: 8, backgroundColor: colors.card }]}>
                          <View style={[commonStyles.row, { marginBottom: 4 }]}>
                            <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>
                              {redemption.reward?.name}
                            </Text>
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 8,
                                backgroundColor: 
                                  redemption.status === 'confirmed' ? colors.primary :
                                  redemption.status === 'pending' ? colors.card :
                                  colors.error,
                              }}
                            >
                              <Text style={[commonStyles.text, { fontSize: 10 }]}>
                                {redemption.status.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                            Crediti: {redemption.credits_deducted}
                          </Text>
                          <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                            {new Date(redemption.created_at || '').toLocaleDateString('it-IT')}
                          </Text>
                        </View>
                      ))}
                    </React.Fragment>
                  )}

                  <Text style={[commonStyles.text, { fontWeight: '600', marginTop: 16, marginBottom: 12 }]}>
                    Transazioni ({userTransactions.length})
                  </Text>

                  {userTransactions.length === 0 ? (
                    <Text style={commonStyles.textSecondary}>
                      Nessuna transazione
                    </Text>
                  ) : (
                    <React.Fragment>
                      {userTransactions.map((transaction, index) => (
                        <View key={`transaction-${transaction.id}-${index}`} style={[commonStyles.card, { marginBottom: 8, backgroundColor: colors.card }]}>
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
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      ))}
                    </React.Fragment>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Adjust Credits Modal */}
      <Modal
        visible={adjustModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAdjustModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Aggiusta Crediti
            </Text>

            {selectedUser && (
              <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { marginBottom: 4 }]}>
                  Crediti attuali: {selectedUser.fidelity_credits || 0}
                </Text>
              </View>
            )}

            <TextInput
              style={commonStyles.input}
              placeholder="Quantità (+/- numero)"
              placeholderTextColor={colors.textSecondary}
              value={adjustAmount}
              onChangeText={setAdjustAmount}
              keyboardType="numeric"
            />

            <TextInput
              style={[commonStyles.input, { height: 80 }]}
              placeholder="Motivo dell'aggiustamento"
              placeholderTextColor={colors.textSecondary}
              value={adjustReason}
              onChangeText={setAdjustReason}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleAdjustCredits}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>Conferma</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setAdjustModalVisible(false);
                  setAdjustAmount('');
                  setAdjustReason('');
                }}
                activeOpacity={0.7}
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

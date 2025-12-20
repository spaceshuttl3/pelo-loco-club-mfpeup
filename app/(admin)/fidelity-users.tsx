
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
  KeyboardAvoidingView,
  Platform,
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
  const [adjusting, setAdjusting] = useState(false);

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
    console.log('handleAdjustCredits called');
    console.log('Selected user:', selectedUser);
    console.log('Adjust amount:', adjustAmount);
    console.log('Adjust reason:', adjustReason);

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

    setAdjusting(true);
    try {
      console.log('Updating user credits to:', newCredits);
      
      // Update user credits
      const { error: updateError } = await supabase
        .from('users')
        .update({ fidelity_credits: newCredits })
        .eq('id', selectedUser.id);

      if (updateError) {
        console.error('Error updating credits:', updateError);
        throw updateError;
      }

      console.log('Recording transaction...');
      
      // Record transaction
      const { error: transactionError } = await supabase
        .from('fidelity_transactions')
        .insert({
          user_id: selectedUser.id,
          credits_change: amount,
          transaction_type: 'adjusted',
          description: `Aggiustamento manuale: ${adjustReason}`,
        });

      if (transactionError) {
        console.error('Error recording transaction:', transactionError);
        throw transactionError;
      }

      console.log('Credits adjusted successfully');
      Alert.alert('Successo', 'Crediti aggiornati con successo');
      setAdjustModalVisible(false);
      setAdjustAmount('');
      setAdjustReason('');
      
      // Refresh data
      await fetchUsers();
      
      // Update selected user and refetch history
      const updatedUser = { ...selectedUser, fidelity_credits: newCredits };
      setSelectedUser(updatedUser);
      await fetchUserHistory(updatedUser);
    } catch (error) {
      console.error('Error adjusting credits:', error);
      Alert.alert('Errore', 'Impossibile aggiornare i crediti. Riprova.');
    } finally {
      setAdjusting(false);
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

      <ScrollView
        style={commonStyles.content}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <TextInput
          style={[commonStyles.input, { marginBottom: 16 }]}
          placeholder="Cerca utente..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

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
        transparent={false}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
          {selectedUser && (
            <>
              <View style={commonStyles.header}>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)} 
                  style={{ marginRight: 16 }} 
                  activeOpacity={0.7}
                >
                  <IconSymbol name="chevron.left" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.headerTitle, { marginBottom: 2 }]}>
                    {selectedUser.name}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12 }]}>
                    {selectedUser.email}
                  </Text>
                </View>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView 
                style={commonStyles.content}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
              >
                <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 24, marginBottom: 16, alignItems: 'center' }]}>
                  <Text style={[commonStyles.text, { fontSize: 48, fontWeight: 'bold' }]}>
                    {selectedUser.fidelity_credits || 0}
                  </Text>
                  <Text style={[commonStyles.text, { fontSize: 16, marginTop: 8 }]}>
                    Crediti Disponibili
                  </Text>
                </View>

                <TouchableOpacity
                  style={[buttonStyles.primary, { marginBottom: 24 }]}
                  onPress={() => {
                    console.log('Aggiusta Crediti button pressed');
                    setAdjustModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>Aggiusta Crediti</Text>
                </TouchableOpacity>

                <Text style={[commonStyles.text, { fontWeight: '600', fontSize: 18, marginBottom: 12 }]}>
                  Riscatti ({userRedemptions.length})
                </Text>

                {userRedemptions.length === 0 ? (
                  <View style={[commonStyles.card, { alignItems: 'center', padding: 32, marginBottom: 24 }]}>
                    <Text style={commonStyles.textSecondary}>
                      Nessun riscatto
                    </Text>
                  </View>
                ) : (
                  <React.Fragment>
                    {userRedemptions.map((redemption, index) => (
                      <View key={`redemption-${redemption.id}-${index}`} style={[commonStyles.card, { marginBottom: 12 }]}>
                        <View style={[commonStyles.row, { marginBottom: 8 }]}>
                          <Text style={[commonStyles.text, { flex: 1, fontWeight: '600' }]}>
                            {redemption.reward?.name}
                          </Text>
                          <View
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 4,
                              borderRadius: 12,
                              backgroundColor: 
                                redemption.status === 'confirmed' ? colors.primary :
                                redemption.status === 'pending' ? colors.card :
                                colors.error,
                            }}
                          >
                            <Text style={[commonStyles.text, { fontSize: 11, fontWeight: '600' }]}>
                              {redemption.status.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[commonStyles.textSecondary, { fontSize: 13, marginBottom: 4 }]}>
                          Crediti: {redemption.credits_deducted}
                        </Text>
                        <Text style={[commonStyles.textSecondary, { fontSize: 13 }]}>
                          {new Date(redemption.created_at || '').toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    ))}
                  </React.Fragment>
                )}

                <Text style={[commonStyles.text, { fontWeight: '600', fontSize: 18, marginTop: 8, marginBottom: 12 }]}>
                  Transazioni ({userTransactions.length})
                </Text>

                {userTransactions.length === 0 ? (
                  <View style={[commonStyles.card, { alignItems: 'center', padding: 32 }]}>
                    <Text style={commonStyles.textSecondary}>
                      Nessuna transazione
                    </Text>
                  </View>
                ) : (
                  <React.Fragment>
                    {userTransactions.map((transaction, index) => (
                      <View key={`transaction-${transaction.id}-${index}`} style={[commonStyles.card, { marginBottom: 12 }]}>
                        <View style={[commonStyles.row, { marginBottom: 8 }]}>
                          <Text style={[commonStyles.text, { flex: 1 }]}>
                            {transaction.description}
                          </Text>
                          <Text
                            style={[
                              commonStyles.text,
                              {
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: transaction.credits_change > 0 ? colors.primary : colors.error,
                              },
                            ]}
                          >
                            {transaction.credits_change > 0 ? '+' : ''}
                            {transaction.credits_change}
                          </Text>
                        </View>
                        <Text style={[commonStyles.textSecondary, { fontSize: 13 }]}>
                          {new Date(transaction.created_at || '').toLocaleDateString('it-IT', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
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
        </SafeAreaView>
      </Modal>

      {/* Adjust Credits Modal */}
      <Modal
        visible={adjustModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!adjusting) {
            setAdjustModalVisible(false);
          }
        }}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: 20,
          }}>
            <View style={[commonStyles.card, { width: '100%', maxWidth: 400 }]}>
              <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
                Aggiusta Crediti
              </Text>

              {selectedUser && (
                <View style={[commonStyles.card, { backgroundColor: colors.card, padding: 16, marginBottom: 16 }]}>
                  <Text style={[commonStyles.text, { marginBottom: 4 }]}>
                    Crediti attuali: {selectedUser.fidelity_credits || 0}
                  </Text>
                  <Text style={[commonStyles.textSecondary, { fontSize: 12, marginTop: 4 }]}>
                    Usa + per aggiungere, - per sottrarre
                  </Text>
                </View>
              )}

              <TextInput
                style={[commonStyles.input, { marginBottom: 12 }]}
                placeholder="Quantità (es: +5 o -3)"
                placeholderTextColor={colors.textSecondary}
                value={adjustAmount}
                onChangeText={setAdjustAmount}
                keyboardType="numeric"
                editable={!adjusting}
              />

              <TextInput
                style={[commonStyles.input, { height: 100, marginBottom: 16, textAlignVertical: 'top' }]}
                placeholder="Motivo dell'aggiustamento"
                placeholderTextColor={colors.textSecondary}
                value={adjustReason}
                onChangeText={setAdjustReason}
                multiline
                editable={!adjusting}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1 }]}
                  onPress={handleAdjustCredits}
                  disabled={adjusting}
                  activeOpacity={0.7}
                >
                  <Text style={buttonStyles.text}>
                    {adjusting ? 'Aggiornamento...' : 'Conferma'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                  onPress={() => {
                    if (!adjusting) {
                      setAdjustModalVisible(false);
                      setAdjustAmount('');
                      setAdjustReason('');
                    }
                  }}
                  disabled={adjusting}
                  activeOpacity={0.7}
                >
                  <Text style={[buttonStyles.text, { color: colors.text }]}>Annulla</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}


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
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { commonStyles, colors, buttonStyles } from '@/styles/commonStyles';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CouponConfig {
  id: string;
  coupon_text: string;
  discount_value: number;
  is_spin_wheel: boolean;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CouponsScreen() {
  const router = useRouter();
  const [configs, setConfigs] = useState<CouponConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<CouponConfig | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<CouponConfig | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const [couponText, setCouponText] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [isSpinWheel, setIsSpinWheel] = useState(false);
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching coupon configs and users...');
      
      // Fetch coupon configs
      const { data: configsData, error: configsError } = await supabase
        .from('admin_coupon_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (configsError) {
        console.error('Error fetching configs:', configsError);
      } else {
        console.log('Configs fetched:', configsData?.length || 0);
        setConfigs(configsData || []);
      }

      // Fetch ALL users (not just customers) to fix the user selection issue
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, role')
        .order('name', { ascending: true });

      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        console.log('All users fetched:', usersData?.length || 0);
        // Filter to only show customers
        const customerUsers = usersData?.filter(u => u.role === 'customer') || [];
        console.log('Customer users filtered:', customerUsers.length);
        setUsers(customerUsers);
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

  const handleSaveConfig = async () => {
    if (!couponText || !discountValue) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount <= 0 || discount > 100) {
      Alert.alert('Error', 'Please enter a valid discount percentage (1-100)');
      return;
    }

    setSaving(true);
    try {
      const configData = {
        coupon_text: couponText,
        discount_value: discount,
        is_spin_wheel: isSpinWheel,
        is_active: true,
      };

      if (editingConfig) {
        const { error } = await supabase
          .from('admin_coupon_config')
          .update(configData)
          .eq('id', editingConfig.id);

        if (error) {
          console.error('Error updating config:', error);
          Alert.alert('Error', 'Could not update coupon config');
          return;
        }

        Alert.alert('Success', 'Coupon config updated successfully');
      } else {
        const { error } = await supabase
          .from('admin_coupon_config')
          .insert(configData);

        if (error) {
          console.error('Error creating config:', error);
          Alert.alert('Error', 'Could not create coupon config');
          return;
        }

        Alert.alert('Success', 'Coupon config created successfully');
      }

      setModalVisible(false);
      setCouponText('');
      setDiscountValue('');
      setIsSpinWheel(false);
      setEditingConfig(null);
      fetchData();
    } catch (error) {
      console.error('Error in handleSaveConfig:', error);
      Alert.alert('Error', 'Could not save coupon config');
    } finally {
      setSaving(false);
    }
  };

  const handleSendCoupons = async () => {
    console.log('SendCoupons - Button pressed');
    
    if (!selectedConfig) return;

    if (selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    setSaving(true);
    try {
      const coupons = selectedUsers.map(userId => ({
        user_id: userId,
        config_id: selectedConfig.id,
        coupon_type: selectedConfig.coupon_text,
        discount_value: selectedConfig.discount_value,
        expiration_date: expirationDate.toISOString().split('T')[0],
        status: 'active',
        coupon_code: `PROMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      }));

      const { error } = await supabase
        .from('coupons')
        .insert(coupons);

      if (error) {
        console.error('Error sending coupons:', error);
        Alert.alert('Error', 'Could not send coupons');
        return;
      }

      Alert.alert(
        'Success',
        `Coupons sent to ${selectedUsers.length} user(s)!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setSendModalVisible(false);
              setSelectedConfig(null);
              setSelectedUsers([]);
              setExpirationDate(new Date());
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleSendCoupons:', error);
      Alert.alert('Error', 'Could not send coupons');
    } finally {
      setSaving(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    console.log('User selection toggled:', userId);
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const selectAllUsers = () => {
    console.log('Select all users pressed');
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
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
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed');
            router.back();
          }} 
          style={{ marginRight: 16 }}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={commonStyles.headerTitle}>Coupons</Text>
        <TouchableOpacity
          onPress={() => {
            console.log('Add coupon button pressed');
            setEditingConfig(null);
            setCouponText('');
            setDiscountValue('');
            setIsSpinWheel(false);
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
        {configs.length === 0 ? (
          <View style={[commonStyles.card, { alignItems: 'center', padding: 40 }]}>
            <IconSymbol name="ticket" size={48} color={colors.textSecondary} />
            <Text style={[commonStyles.textSecondary, { marginTop: 16 }]}>
              No coupon configs yet
            </Text>
          </View>
        ) : (
          configs.map((config) => (
            <View key={config.id} style={[commonStyles.card, { marginBottom: 16 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
                    {config.discount_value}%
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                    {config.coupon_text}
                  </Text>
                  <Text style={commonStyles.textSecondary}>
                    {config.is_spin_wheel ? 'Spin Wheel Coupon' : 'Direct Coupon'}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: config.is_active ? colors.primary : colors.card,
                  }}
                >
                  <Text style={[commonStyles.text, { fontSize: 12 }]}>
                    {config.is_active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    style={[buttonStyles.primary, { flex: 1, paddingVertical: 10 }]}
                    onPress={() => {
                      console.log('Send to users button pressed for config:', config.id);
                      setSelectedConfig(config);
                      setSelectedUsers([]);
                      const defaultExpiration = new Date();
                      defaultExpiration.setDate(defaultExpiration.getDate() + 30);
                      setExpirationDate(defaultExpiration);
                      setSendModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={buttonStyles.text}>Send to Users</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[buttonStyles.primary, { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.card }]}
                    onPress={() => {
                      console.log('Edit button pressed for config:', config.id);
                      setEditingConfig(config);
                      setCouponText(config.coupon_text);
                      setDiscountValue(config.discount_value.toString());
                      setIsSpinWheel(config.is_spin_wheel);
                      setModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="pencil" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
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
          <View style={[commonStyles.card, { width: '90%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              {editingConfig ? 'Edit Coupon Config' : 'Create Coupon Config'}
            </Text>

            <TextInput
              style={commonStyles.input}
              placeholder="Coupon Text"
              placeholderTextColor={colors.textSecondary}
              value={couponText}
              onChangeText={setCouponText}
            />

            <TextInput
              style={commonStyles.input}
              placeholder="Discount Percentage"
              placeholderTextColor={colors.textSecondary}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="number-pad"
            />

            <View style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}>
              <Text style={commonStyles.text}>Link to Spin the Wheel</Text>
              <Switch
                value={isSpinWheel}
                onValueChange={setIsSpinWheel}
                trackColor={{ false: colors.card, true: colors.primary }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleSaveConfig}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>
                  {saving ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setModalVisible(false);
                  setEditingConfig(null);
                }}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send to Users Modal */}
      <Modal
        visible={sendModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSendModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={[commonStyles.card, { width: '90%', maxHeight: '80%' }]}>
            <Text style={[commonStyles.subtitle, { marginBottom: 16 }]}>
              Send Coupons to Users
            </Text>

            {selectedConfig && (
              <View style={[commonStyles.card, { backgroundColor: colors.primary, padding: 16, marginBottom: 16 }]}>
                <Text style={[commonStyles.text, { fontWeight: '600', marginBottom: 4 }]}>
                  {selectedConfig.coupon_text}
                </Text>
                <Text style={commonStyles.textSecondary}>
                  {selectedConfig.discount_value}% off
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={commonStyles.text}>Expiration Date</Text>
              <Text style={[commonStyles.text, { color: colors.primary }]}>
                {expirationDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={expirationDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    setExpirationDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {users.length === 0 ? (
              <View style={[commonStyles.card, { alignItems: 'center', padding: 20 }]}>
                <Text style={commonStyles.textSecondary}>
                  No customer users found
                </Text>
                <Text style={[commonStyles.textSecondary, { marginTop: 8, textAlign: 'center' }]}>
                  Make sure you have users with the &apos;customer&apos; role in your database.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[commonStyles.card, commonStyles.row, { marginBottom: 16 }]}
                  onPress={selectAllUsers}
                  activeOpacity={0.7}
                >
                  <Text style={commonStyles.text}>
                    {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                  </Text>
                  <Text style={[commonStyles.text, { color: colors.primary }]}>
                    {selectedUsers.length}/{users.length}
                  </Text>
                </TouchableOpacity>

                <ScrollView style={{ maxHeight: 300, marginBottom: 16 }}>
                  {users.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        commonStyles.card,
                        commonStyles.row,
                        { marginBottom: 8 },
                        selectedUsers.includes(user.id) && { borderColor: colors.primary, borderWidth: 2 },
                      ]}
                      onPress={() => toggleUserSelection(user.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[commonStyles.text, { fontWeight: '600' }]}>
                          {user.name}
                        </Text>
                        <Text style={commonStyles.textSecondary}>
                          {user.email}
                        </Text>
                      </View>
                      {selectedUsers.includes(user.id) && (
                        <IconSymbol name="checkmark.circle.fill" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1 }]}
                onPress={handleSendCoupons}
                disabled={saving || users.length === 0}
                activeOpacity={0.7}
              >
                <Text style={buttonStyles.text}>
                  {saving ? 'Sending...' : `Send to ${selectedUsers.length} user(s)`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[buttonStyles.primary, { flex: 1, backgroundColor: colors.card }]}
                onPress={() => {
                  setSendModalVisible(false);
                  setSelectedConfig(null);
                  setSelectedUsers([]);
                  setExpirationDate(new Date());
                }}
                disabled={saving}
                activeOpacity={0.7}
              >
                <Text style={[buttonStyles.text, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

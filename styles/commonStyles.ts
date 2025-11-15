
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive scaling
const scale = (size: number) => (width / 375) * size;
const verticalScale = (size: number) => (height / 812) * size;
const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

export const colors = {
  background: '#0a0a0a',
  card: '#1a1a1a',
  border: '#2a2a2a',
  text: '#ffffff',
  textSecondary: '#888888',
  primary: '#9b59b6',
  secondary: '#8e44ad',
  accent: '#bb8fce',
  error: '#ff4444',
  success: '#4CAF50',
  black: '#000000',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: moderateScale(20),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(20),
    paddingTop: moderateScale(10),
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  title: {
    fontSize: moderateScale(28),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  text: {
    fontSize: moderateScale(16),
    color: colors.text,
  },
  textSecondary: {
    fontSize: moderateScale(14),
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
    color: colors.text,
    fontSize: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text,
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

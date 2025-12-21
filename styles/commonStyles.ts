
import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive scaling - more aggressive for smaller screens
const scale = (size: number) => {
  const baseWidth = 375; // iPhone X base width
  const ratio = width / baseWidth;
  // Cap the scaling to prevent too large sizes on tablets
  return size * Math.min(ratio, 1.2);
};

const verticalScale = (size: number) => {
  const baseHeight = 812; // iPhone X base height
  const ratio = height / baseHeight;
  return size * Math.min(ratio, 1.2);
};

const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Helper to determine if screen is small
export const isSmallScreen = width < 375;
export const isMediumScreen = width >= 375 && width < 414;
export const isLargeScreen = width >= 414;

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
    padding: moderateScale(16),
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: moderateScale(16),
    paddingTop: Platform.OS === 'android' ? moderateScale(12) : moderateScale(8),
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  subtitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  text: {
    fontSize: moderateScale(15),
    color: colors.text,
  },
  textSecondary: {
    fontSize: moderateScale(13),
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: moderateScale(14),
    padding: moderateScale(14),
    marginBottom: verticalScale(10),
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
    padding: moderateScale(14),
    marginBottom: verticalScale(14),
    color: colors.text,
    fontSize: moderateScale(15),
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.text,
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
});

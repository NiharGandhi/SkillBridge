import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({
  label,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  const { colors, isDark } = useTheme();

  // Generate badge styles based on props
  const getBadgeStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Size styles
    const sizeStyles: Record<BadgeSize, ViewStyle> = {
      small: { paddingVertical: 2, paddingHorizontal: 6 },
      medium: { paddingVertical: 4, paddingHorizontal: 8 },
      large: { paddingVertical: 6, paddingHorizontal: 12 },
    };

    // Variant styles
    const variantStyles: Record<BadgeVariant, ViewStyle> = {
      default: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      primary: {
        backgroundColor: colors.primary + '20',
      },
      secondary: {
        backgroundColor: colors.secondary + '20',
      },
      success: {
        backgroundColor: colors.success + '20',
      },
      warning: {
        backgroundColor: colors.warning + '20',
      },
      error: {
        backgroundColor: colors.error + '20',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  // Generate text styles based on props
  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontFamily: 'Inter-Medium',
    };

    // Size text styles
    const sizeStyles: Record<BadgeSize, TextStyle> = {
      small: { fontSize: 10 },
      medium: { fontSize: 12 },
      large: { fontSize: 14 },
    };

    // Variant text styles
    const variantStyles: Record<BadgeVariant, TextStyle> = {
      default: { color: colors.text },
      primary: { color: colors.primary },
      secondary: { color: colors.secondary },
      success: { color: colors.success },
      warning: { color: colors.warning },
      error: { color: colors.error },
      outline: { color: colors.text },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <View style={[getBadgeStyles(), style]}>
      <Text style={[getTextStyles(), textStyle]}>{label}</Text>
    </View>
  );
}
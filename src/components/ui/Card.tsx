import React from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: number;
  borderRadius?: number;
  margin?: number;
}

export function Card({ 
  children, 
  style, 
  variant = 'default',
  padding = 16,
  borderRadius = 16,
  margin = 0
}: CardProps) {
  const { colors, isDark } = useTheme();

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius,
      overflow: 'hidden',
      padding,
      margin,
    };

    const variantStyles: Record<string, ViewStyle> = {
      default: {},
      elevated: {
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
          },
          android: {
            elevation: 5,
          },
        }),
      },
      outlined: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
      },
    };

    return {
      ...baseStyle,
      ...variantStyles[variant],
    };
  };

  return <View style={[getCardStyle(), style]}>{children}</View>;
}

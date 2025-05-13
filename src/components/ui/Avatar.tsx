import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface AvatarProps {
  uri?: string | null;
  initials?: string;
  size?: number;
  borderRadius?: number;
  backgroundColor?: string;
}

export function Avatar({
  uri,
  initials,
  size = 40,
  borderRadius,
  backgroundColor,
}: AvatarProps) {
  const { colors } = useTheme();
  const finalBorderRadius = borderRadius ?? size / 2;
  const finalBackgroundColor = backgroundColor ?? colors.primary;

  // Get initials from a name (up to 2 characters)
  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.trim().split(' ');
    
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (
      parts[0].charAt(0).toUpperCase() + 
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  // If we have an image URL, display it
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: finalBorderRadius,
          },
        ]}
        resizeMode="cover"
      />
    );
  }

  // Otherwise display initials or a placeholder
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: finalBorderRadius,
          backgroundColor: finalBackgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: size * 0.4,
          },
        ]}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: '#DDD',
  },
  text: {
    color: 'white',
    fontFamily: 'Inter-Medium',
  },
});
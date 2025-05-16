import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import Feather from '@expo/vector-icons/Feather';

interface OpportunityCardProps {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string | null;
  location?: string | null;
  type: 'internship' | 'project' | 'job';
  deadline?: string | null;
  skillsRequired: string[];
  remote: boolean;
  onPress: (id: string) => void;
}

export function OpportunityCard({
  id,
  title,
  companyName,
  companyLogo,
  location,
  type,
  deadline,
  skillsRequired,
  remote,
  onPress,
}: OpportunityCardProps) {
  const { colors } = useTheme();

  const getTypeColor = () => {
    switch (type) {
      case 'internship':
        return 'primary';
      case 'project':
        return 'secondary';
      case 'job':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDeadline = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Closed';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days left`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={() => onPress(id)}
      style={styles.container}
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <Avatar
            uri={companyLogo}
            initials={companyName.charAt(0)}
            size={40}
          />
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.companyName, { color: colors.subtext }]}>
              {companyName}
            </Text>
          </View>
        </View>
        
        <View style={styles.details}>
          {location && (
            <View style={styles.detailItem}>
              <Feather name='map-pin' size={16} color={colors.subtext} />
              <Text style={[styles.detailText, { color: colors.subtext }]}>
                {location}
              </Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Feather name="briefcase" size={16} color={colors.subtext} />
            <Badge 
              label={type.charAt(0).toUpperCase() + type.slice(1)} 
              variant={getTypeColor()} 
              size="small" 
            />
          </View>
          
          {deadline && (
            <View style={styles.detailItem}>
              <Feather name="calendar" size={16} color={colors.subtext} />
              <Text style={[styles.detailText, { color: colors.subtext }]}>
                {formatDeadline(deadline)}
              </Text>
            </View>
          )}
          
          {remote && (
            <View style={styles.detailItem}>
              <Feather name="globe" size={16} color={colors.subtext} />
              <Text style={[styles.detailText, { color: colors.subtext }]}>
                Remote
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.skills}>
          {skillsRequired.slice(0, 3).map((skill, index) => (
            <Badge 
              key={index} 
              label={skill} 
              variant="outline" 
              size="small" 
            />
          ))}
          {skillsRequired.length > 3 && (
            <Badge 
              label={`+${skillsRequired.length - 3}`} 
              variant="default" 
              size="small" 
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  companyName: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
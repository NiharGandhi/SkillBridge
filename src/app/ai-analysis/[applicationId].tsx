import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { analyzeApplicant } from '../../lib/gemini';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface AnalysisResult {
  score: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  summary: string;
}

export default function AIAnalysisScreen() {
  const { colors } = useTheme();
  const { applicationId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDataAndAnalyze();
  }, [applicationId]);

  const fetchDataAndAnalyze = async () => {
    try {
      setLoading(true);
      
      // Fetch application data
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunities(*),
          student:profiles(*)
        `)
        .eq('id', applicationId)
        .single();

      if (appError || !application) throw appError || new Error('Application not found');

      // Prepare data for Gemini
      const profileData = JSON.stringify({
        name: `${application.student?.first_name} ${application.student?.last_name}`,
        skills: application.student?.skills || [],
        experience: application.student?.experience || {},
        education: application.student?.education || {}
      });

      const jobDescription = `
        Title: ${application.opportunity.title}
        Description: ${application.opportunity.description}
        Required Skills: ${application.opportunity.skills_required?.join(', ') || 'None specified'}
        Type: ${application.opportunity.type}
      `;

      // Get analysis from Gemini
      const analysisResult = await analyzeApplicant(
        jobDescription,
        profileData,
        application.resume_url || 'No resume provided'
      );

      setAnalysis(analysisResult);

    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze application');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Analyzing applicant...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>{error}</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No analysis data available</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={{ marginTop: 20 }}
        />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      <Card style={{ ...styles.card, backgroundColor: colors.card }}>
        <Text style={[styles.title, { color: colors.text }]}>AI Analysis</Text>
        
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getScoreColor(analysis.score, colors) }]}>
            {analysis.score}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.text }]}>Compatibility Score</Text>
        </View>

        <View style={[styles.recommendationContainer, { 
          backgroundColor: getRecommendationBackground(analysis.recommendation, colors),
          borderColor: getRecommendationColor(analysis.recommendation, colors)
        }]}>
          <Text style={[styles.recommendation, { 
            color: getRecommendationColor(analysis.recommendation, colors) 
          }]}>
            {analysis.recommendation}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
          <Text style={[styles.summary, { color: colors.text }]}>{analysis.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Strengths</Text>
          {analysis.strengths.map((strength, index) => (
            <View key={`strength-${index}`} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: colors.success }]} />
              <Text style={[styles.listText, { color: colors.text }]}>{strength}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Potential Gaps</Text>
          {analysis.gaps.map((gap, index) => (
            <View key={`gap-${index}`} style={styles.listItem}>
              <View style={[styles.bullet, { backgroundColor: colors.warning }]} />
              <Text style={[styles.listText, { color: colors.text }]}>{gap}</Text>
            </View>
          ))}
        </View>

        <Button 
          title="Back to Application" 
          onPress={() => router.back()} 
          style={{ marginTop: 24 }}
        />
      </Card>
    </ScrollView>
  );
}

function getScoreColor(score: number, colors: any) {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.notification;
  if (score >= 40) return colors.warning;
  return colors.error;
}

function getRecommendationColor(recommendation: string, colors: any) {
  switch(recommendation.toLowerCase()) {
    case 'strong yes': return colors.success;
    case 'yes': return colors.notification;
    case 'maybe': return colors.warning;
    default: return colors.error;
  }
}

function getRecommendationBackground(recommendation: string, colors: any) {
  switch(recommendation.toLowerCase()) {
    case 'strong yes': return `${colors.success}20`;
    case 'yes': return `${colors.notification}20`;
    case 'maybe': return `${colors.warning}20`;
    default: return `${colors.error}20`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
    marginTop: 32
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  score: {
    fontSize: 56,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 16,
    opacity: 0.8,
    marginTop: 4,
  },
  recommendationContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
  },
  recommendation: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    marginRight: 12,
  },
  listText: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
});
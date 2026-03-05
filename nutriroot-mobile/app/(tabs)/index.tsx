import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors } from '../../src/constants/theme';
import { Droplets, Thermometer, Zap, Activity, Info, LogOut } from 'lucide-react-native';
import { auth, db } from '../../src/config/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const SensorCard = ({ title, value, unit, icon: Icon, color, description }: any) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={24} color={color} />
      </View>
      <View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardValue}>{value}{unit}</Text>
      </View>
    </View>
    <Text style={styles.cardDescription}>{description}</Text>
  </View>
);

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [sensors, setSensors] = useState({
    moisture: 0,
    temperature: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    ph: 7.0,
    last_update: 'Never'
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen for real-time sensor data from Firestore
    const unsubscribe = onSnapshot(
      doc(db, 'sensorData', 'latest'),
      (doc) => {
        if (doc.exists()) {
          setSensors(doc.data() as any);
        }
      },
      (error) => {
        console.error("Dashboard Listener Error:", error.code, error.message);
        if (error.code === 'permission-denied') {
          // This might happen if the document doesn't exist yet or rules are restricted
          console.warn("Permission denied for sensor data. Using defaults.");
        }
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
    >
      <View style={styles.welcomeSection}>
        <View>
          <Text style={styles.greeting}>Hello, {auth.currentUser?.displayName || 'Farmer'}</Text>
          <Text style={styles.subtitle}>Here is your real-time soil health overview.</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutBtn}>
          <LogOut size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statusBox}>
        <View style={styles.statusHeader}>
          <Activity size={20} color={Colors.primary} />
          <Text style={styles.statusTitle}>Overall Status: Good</Text>
        </View>
        <Text style={styles.statusText}>Your soil nutrients are within optimal range for the current season.</Text>
      </View>

      <View style={styles.grid}>
        <SensorCard
          title="Moisture"
          value={sensors.moisture}
          unit="%"
          icon={Droplets}
          color="#2196F3"
          description="Optimal: 40-70%"
        />
        <SensorCard
          title="Temperature"
          value={sensors.temperature}
          unit="°C"
          icon={Thermometer}
          color="#FF9800"
          description="Optimal: 22-32°C"
        />
        <SensorCard
          title="Nitrogen (N)"
          value={sensors.nitrogen}
          unit=" mg/kg"
          icon={Zap}
          color="#4CAF50"
          description="Optimal: 30-80"
        />
        <SensorCard
          title="pH Level"
          value={sensors.ph}
          unit=""
          icon={Info}
          color="#9C27B0"
          description="Optimal: 5.5-7.5"
        />
      </View>

      <View style={styles.updateTimeContainer}>
        <Text style={styles.updateTime}>Last updated: {sensors.last_update}</Text>
      </View>

      <TouchableOpacity style={styles.recommendationBtn}>
        <Text style={styles.recommendationBtnText}>View Detailed Recommendations</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  statusBox: {
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: Colors.white,
    width: '48%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardDescription: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  updateTimeContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  updateTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recommendationBtn: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
  },
  recommendationBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

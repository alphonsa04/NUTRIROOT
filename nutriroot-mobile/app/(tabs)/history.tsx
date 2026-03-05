import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/theme';
import { Calendar, Beaker, ChevronRight } from 'lucide-react-native';
import { auth, db } from '../../src/config/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

const HistoryItem = ({ item }: any) => (
    <View style={styles.historyCard}>
        <View style={styles.cardLeft}>
            <View style={styles.dateIcon}>
                <Calendar size={20} color={Colors.primary} />
            </View>
            <View>
                <Text style={styles.dateText}>{item.timestamp || 'Recent Analysis'}</Text>
                <Text style={styles.cropText}>Crop: {item.crop || 'General'}</Text>
            </View>
        </View>
        <View style={styles.cardRight}>
            <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Healthy</Text>
            </View>
            <ChevronRight size={20} color={Colors.border} />
        </View>
    </View>
);

export default function HistoryScreen() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const q = query(
                    collection(db, 'soilData', user.uid, 'readings'),
                    orderBy('timestamp', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const items: any[] = [];
                querySnapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() });
                });
                setHistory(items);
            } catch (error) {
                console.error('Error fetching history:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={history}
                    renderItem={({ item }) => <HistoryItem item={item} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.header}>
                            <Beaker size={24} color={Colors.primary} />
                            <Text style={styles.headerTitle}>Past Soil Analyses</Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No history found.</Text>
                            <Text style={styles.emptySubtext}>Your past soil readings will appear here.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 10,
    },
    historyCard: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    cropText: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    cardRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    statusText: {
        color: '#2E7D32',
        fontSize: 10,
        fontWeight: 'bold',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 8,
    },
});

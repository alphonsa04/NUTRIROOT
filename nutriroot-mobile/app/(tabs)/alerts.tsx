import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/theme';
import { Bell, AlertTriangle, CheckCircle, Info } from 'lucide-react-native';
import { auth, db } from '../../src/config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const AlertItem = ({ item }: any) => {
    const getIcon = () => {
        switch (item.type) {
            case 'warning': return <AlertTriangle size={20} color="#FFA000" />;
            case 'error': return <AlertTriangle size={20} color="#C62828" />;
            case 'success': return <CheckCircle size={20} color="#2E7D32" />;
            default: return <Info size={20} color="#1976D2" />;
        }
    };

    const getBgColor = () => {
        switch (item.type) {
            case 'warning': return '#FFF8E1';
            case 'error': return '#FFEBEE';
            case 'success': return '#E8F5E9';
            default: return '#E3F2FD';
        }
    };

    return (
        <View style={[styles.alertCard, { backgroundColor: getBgColor() }]}>
            <View style={styles.alertIcon}>
                {getIcon()}
            </View>
            <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{item.title || 'New Alert'}</Text>
                <Text style={styles.alertMessage}>{item.message}</Text>
                <Text style={styles.alertTime}>{item.timestamp || 'Just now'}</Text>
            </View>
        </View>
    );
};

export default function AlertsScreen() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setLoading(false);
            return;
        }

        // Listen for user alerts
        const q = query(
            collection(db, 'alerts', user.uid, 'userAlerts'),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const items: any[] = [];
                snapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() });
                });
                setAlerts(items);
                setLoading(false);
            },
            (error) => {
                console.error("Alerts Listener Error:", error.code, error.message);
                setLoading(false);
                if (error.code === 'permission-denied') {
                    console.warn("Permission denied for user alerts. They might not have been created yet.");
                }
            }
        );

        return () => unsubscribe();
    }, [auth.currentUser]);

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    renderItem={({ item }) => <AlertItem item={item} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Bell size={48} color={Colors.border} />
                            <Text style={styles.emptyText}>No alerts yet.</Text>
                            <Text style={styles.emptySubtext}>We'll notify you when your soil needs attention.</Text>
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
    alertCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    alertIcon: {
        marginRight: 12,
        marginTop: 2,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    alertMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 8,
    },
    alertTime: {
        fontSize: 12,
        color: Colors.textSecondary,
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
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
    },
});

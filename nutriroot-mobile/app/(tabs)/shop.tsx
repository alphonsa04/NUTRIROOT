import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Colors } from '../../src/constants/theme';
import { Search, ShoppingCart, Star } from 'lucide-react-native';
import { db } from '../../src/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ProductCard = ({ item }: any) => (
    <TouchableOpacity style={styles.productCard}>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.productImage} />
        <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.ratingContainer}>
                <Star size={14} color="#FFC107" fill="#FFC107" />
                <Text style={styles.ratingText}>4.5</Text>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.productPrice}>₹{item.price}</Text>
                <TouchableOpacity style={styles.addButton}>
                    <ShoppingCart size={20} color={Colors.white} />
                </TouchableOpacity>
            </View>
        </View>
    </TouchableOpacity>
);

export default function ShopScreen() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch only approved products
                const q = query(collection(db, 'products'), where('status', '==', 'approved'));
                const querySnapshot = await getDocs(q);
                const items: any[] = [];
                querySnapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() });
                });
                setProducts(items);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Search size={20} color={Colors.textSecondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search fertilizers, seeds..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={({ item }) => <ProductCard item={item} />}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No products found.</Text>
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
    searchSection: {
        padding: 20,
        backgroundColor: Colors.white,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 48,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        color: Colors.text,
    },
    listContent: {
        padding: 12,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    productCard: {
        backgroundColor: Colors.white,
        width: '48%',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    productImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0',
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        height: 40,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    ratingText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    addButton: {
        backgroundColor: Colors.primary,
        padding: 8,
        borderRadius: 10,
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
        color: Colors.textSecondary,
        fontSize: 16,
    },
});

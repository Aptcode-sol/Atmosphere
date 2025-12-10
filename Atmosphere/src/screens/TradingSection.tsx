import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, SafeAreaView } from 'react-native';
import TopNavbar from '../components/TopNavbar';
import BottomNav from '../components/BottomNav';
import { BOTTOM_NAV_HEIGHT } from '../lib/layout';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const items = [
    { id: '1', name: 'Zlyft Autonomy Pvt Ltd', person: 'Joshua Paul', tagline: 'Building next-gen autonomous vehicles for urban transportation', avatar: 'https://i.pravatar.cc/150?img=33' },
    { id: '2', name: 'TechFlow Solutions', person: 'Priya Sharma', tagline: 'Streamlining enterprise workflows with intelligent automation', avatar: 'https://i.pravatar.cc/150?img=47' },
    { id: '3', name: 'GreenTech Innovations', person: 'Sarah Williams', tagline: 'Sustainable energy solutions for a carbon-neutral future', avatar: 'https://i.pravatar.cc/150?img=25' },
    { id: '4', name: 'FinNext Solutions', person: 'Michael Rodriguez', tagline: 'Digital banking infrastructure for the next generation', avatar: 'https://i.pravatar.cc/150?img=52' },
    { id: '5', name: 'EduTech Pro', person: 'Aisha Patel', tagline: 'Personalized learning experiences powered by AI', avatar: 'https://i.pravatar.cc/150?img=38' },
];

const Trading = () => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabsRow}>
                <TouchableOpacity style={[styles.tabButton, styles.tabLeft]}>
                    <Text style={styles.tabText}>BUY</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, styles.tabRight]}>
                    <Text style={styles.tabText}>SELL</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                    <MaterialCommunityIcons name="magnify" size={18} color="#bfbfbf" />
                    <TextInput placeholder="Search companies..." placeholderTextColor="#bfbfbf" style={styles.searchInput} />
                </View>
                <TouchableOpacity style={styles.bookmarkBtn}>
                    <MaterialCommunityIcons name="bookmark-outline" size={20} color="#bfbfbf" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.filterRow}>
                <View style={styles.filterLeft}><MaterialCommunityIcons name="tune" size={18} color="#fff" /></View>
                <Text style={styles.filterText}>Filters</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#bfbfbf" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <View style={styles.contentWrap}>
                <Text style={styles.sectionTitle}>Suggested for You</Text>
                <FlatList
                    data={items}
                    keyExtractor={i => i.id}
                    contentContainerStyle={{ paddingBottom: BOTTOM_NAV_HEIGHT + 24 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.avatarWrap}>
                                <View style={styles.avatarCircle} />
                            </View>
                            <View style={styles.cardBody}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.companyName}>{item.name}</Text>
                                    <TouchableOpacity style={styles.iconBtn}><MaterialCommunityIcons name="bookmark-outline" size={18} color="#bfbfbf" /></TouchableOpacity>
                                </View>
                                <Text style={styles.personName}>{item.person}</Text>
                                <Text style={styles.tagline}>{item.tagline}</Text>
                            </View>
                        </View>
                    )}
                />
            </View>

            <BottomNav />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#070707' },
    tabsRow: { flexDirection: 'row', padding: 12, paddingTop: 10, justifyContent: 'center', gap: 12 },
    tabButton: { width: 140, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2f2f2f' },
    tabLeft: {},
    tabRight: {},
    tabText: { color: '#fff', fontWeight: '700' },
    searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 12 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 24 },
    searchInput: { marginLeft: 8, color: '#fff', flex: 1 },
    bookmarkBtn: { marginLeft: 12, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f' },
    filterRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginHorizontal: 16, backgroundColor: '#0f0f0f', padding: 12, borderRadius: 12 },
    filterLeft: { marginRight: 8 },
    filterText: { color: '#fff', fontWeight: '600' },
    contentWrap: { paddingHorizontal: 12, marginTop: 12 },
    sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f0f', marginVertical: 8, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#333333' },
    avatarWrap: { marginRight: 12 },
    avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222' },
    cardBody: { flex: 1 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    companyName: { color: '#fff', fontWeight: '700' },
    personName: { color: '#bfbfbf', fontSize: 12, marginTop: 4 },
    tagline: { color: '#bfbfbf', fontSize: 12, marginTop: 6 },
    iconBtn: { padding: 6 },
});

export default Trading;

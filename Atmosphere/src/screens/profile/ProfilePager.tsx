/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, FlatList, ActivityIndicator, Image, TouchableWithoutFeedback, Modal, Pressable } from 'react-native';
import { PLACEHOLDER } from '../../lib/localImages';
import { getImageSource } from '../../lib/image';
import styles from './Profile.styles';

type Props = {
    posts: any[];
    postsLoading: boolean;
    theme: any;
};

export default function ProfilePager({ posts, postsLoading, theme }: Props) {
    const pagerRef = useRef<Animated.ScrollView | null>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const screenW = Dimensions.get('window').width;
    const [activeTab, setActiveTab] = useState<'posts' | 'expand' | 'trades'>('posts');
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewSource, setPreviewSource] = useState<any>(null);

    return (
        <>
            <View style={styles.tabsRow}>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('posts'); pagerRef.current?.scrollTo({ x: 0, animated: true }); }}>
                    <Text style={[activeTab === 'posts' ? styles.tabTextActive : styles.tabText, { color: theme.text }]}>Posts</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('expand'); pagerRef.current?.scrollTo({ x: screenW, animated: true }); }}>
                    <Text style={[activeTab === 'expand' ? styles.tabTextActive : styles.tabText, { color: theme.placeholder }]}>Expand</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tabItem} onPress={() => { setActiveTab('trades'); pagerRef.current?.scrollTo({ x: screenW * 2, animated: true }); }}>
                    <Text style={[activeTab === 'trades' ? styles.tabTextActive : styles.tabText, { color: theme.placeholder }]}>Trades</Text>
                </TouchableOpacity>

                <Animated.View
                    style={[
                        styles.tabIndicator,
                        {
                            width: screenW / 3,
                            transform: [{ translateX: scrollX.interpolate({ inputRange: [0, screenW, screenW * 2], outputRange: [0, screenW / 3, (screenW / 3) * 2] }) }]
                        }
                    ]}
                />
            </View>

            <View style={styles.pagerWrap}>
                <Animated.ScrollView
                    horizontal
                    pagingEnabled
                    ref={r => (pagerRef.current = r)}
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={(e) => {
                        const idx = Math.round(e.nativeEvent.contentOffset.x / screenW);
                        setActiveTab(idx === 0 ? 'posts' : idx === 1 ? 'expand' : 'trades');
                    }}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    style={{ flex: 1 }}
                >
                    <View style={[styles.pagerPage, { width: screenW }]}>
                        {/* add spacing between Posts header and grid */}
                        <View style={{ height: 12 }} />
                        {postsLoading ? (
                            <View style={styles.pagerEmpty}><ActivityIndicator size="small" color={theme.primary} /><Text style={[styles.emptyText, { color: theme.placeholder }]}>Loading posts...</Text></View>
                        ) : posts.length === 0 ? (
                            <View style={styles.pagerEmpty}><Text style={[styles.emptyTitle, { color: theme.text }]}>No posts yet</Text><Text style={[styles.emptyText, { color: theme.placeholder }]}>You haven't posted anything yet. Tap the + button to create your first post.</Text></View>
                        ) : (
                            <>
                                <FlatList
                                    data={posts}
                                    keyExtractor={(it) => String(it._id || it.id || Math.random())}
                                    numColumns={3}
                                    columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
                                    renderItem={({ item }) => {
                                        // prefer media array objects with url/src
                                        const mediaFirst = Array.isArray(item.media) && item.media.length > 0 ? item.media[0] : null;
                                        const candidate = mediaFirst?.url || mediaFirst?.src || item.image || item.imageUrl || item.profileImage || item.photo || mediaFirst || null;
                                        const source = getImageSource(candidate || (PLACEHOLDER || 'https://via.placeholder.com/300x300.png?text=Post'));
                                        return (
                                            <TouchableWithoutFeedback onPress={() => { setPreviewSource(source); setPreviewVisible(true); }}>
                                                <Image source={source} style={styles.gridItem} onError={(e) => { console.warn('Profile grid image error', e.nativeEvent, candidate); }} />
                                            </TouchableWithoutFeedback>
                                        );
                                    }}
                                />
                                {/* Image preview modal */}
                                <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={() => setPreviewVisible(false)}>
                                    <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setPreviewVisible(false)}>
                                        {previewSource ? <Image source={previewSource} style={{ width: '90%', height: '70%', resizeMode: 'contain' }} /> : null}
                                    </Pressable>
                                </Modal>
                            </>
                        )}
                    </View>

                    <View style={[styles.pagerPage, { width: screenW }]}>
                        <View style={styles.pagerEmpty}><Text style={[styles.emptyTitle, { color: theme.text }]}>Expand</Text><Text style={[styles.emptyText, { color: theme.placeholder }]}>Content for Expand goes here.</Text></View>
                    </View>

                    <View style={[styles.pagerPage, { width: screenW }]}>
                        <View style={styles.pagerEmpty}><Text style={[styles.emptyTitle, { color: theme.text }]}>Trades</Text><Text style={[styles.emptyText, { color: theme.placeholder }]}>Content for Trades goes here.</Text></View>
                    </View>
                </Animated.ScrollView>
            </View>
        </>
    );
}

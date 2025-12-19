import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image as RNImage, Animated, LayoutAnimation, UIManager, Platform } from 'react-native';
import Video from 'react-native-video';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActiveTrade } from '../types';
import { styles } from '../styles';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TradeCardProps {
    trade: ActiveTrade;
    isExpanded: boolean;
    isSaved: boolean;
    currentPhotoIndex: number;
    onToggleExpand: () => void;
    onToggleSave: () => void;
    onPhotoIndexChange: (index: number) => void;
    onExpressInterest: () => void;
}

export const TradeCard: React.FC<TradeCardProps> = ({
    trade,
    isExpanded,
    isSaved,
    currentPhotoIndex,
    onToggleExpand,
    onToggleSave,
    onPhotoIndexChange,
    onExpressInterest,
}) => {
    // Animation value for opacity (uses native driver for smoothness)
    const opacityAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

    // Animate when isExpanded changes
    useEffect(() => {
        // Configure smooth layout animation
        LayoutAnimation.configureNext({
            duration: 200,
            update: { type: LayoutAnimation.Types.easeInEaseOut },
            create: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
            delete: { type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity },
        });

        // Smooth opacity fade
        Animated.timing(opacityAnim, {
            toValue: isExpanded ? 1 : 0,
            duration: 200,
            useNativeDriver: true, // Native driver for smooth animation
        }).start();
    }, [isExpanded, opacityAnim]);

    // Combine images and video into one media array - video is last
    const imageCount = trade.imageUrls?.length || 0;
    const hasVideo = !!trade.videoUrl;
    const totalMediaCount = imageCount + (hasVideo ? 1 : 0);
    const isCurrentItemVideo = hasVideo && currentPhotoIndex === imageCount;

    return (
        <View style={styles.professionalTradeCard}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={onToggleExpand}
                style={[styles.collapsedCardRow, isExpanded && styles.expandedCardHeader]}
            >
                {/* Avatar */}
                {trade.imageUrls && trade.imageUrls.length > 0 && trade.imageUrls[0] ? (
                    <RNImage
                        source={{ uri: trade.imageUrls[0] }}
                        style={styles.collapsedAvatar}
                    />
                ) : (
                    <View style={styles.collapsedAvatar}>
                        <Text style={styles.collapsedAvatarText}>
                            {trade.companyName[0]}
                        </Text>
                    </View>
                )}

                {/* Company Info - Name and Description stacked */}
                <View style={styles.collapsedCompanyInfo}>
                    <Text style={styles.collapsedCompanyName}>{trade.companyName}</Text>
                    {!isExpanded && (
                        <Text style={styles.collapsedDescription} numberOfLines={1}>
                            {trade.description || 'No description provided'}
                        </Text>
                    )}
                </View>

                {/* Action Button - Bookmark only */}
                <View style={styles.collapsedActions}>
                    <TouchableOpacity
                        style={styles.collapsedActionBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onToggleSave();
                        }}
                    >
                        <MaterialCommunityIcons
                            name={isSaved ? "bookmark" : "bookmark-outline"}
                            size={16}
                            color={isSaved ? "#fff" : "#999"}
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Expanded Content - LayoutAnimation handles smooth transition */}
            {isExpanded && (
                <Animated.View style={{ opacity: opacityAnim }}>
                    {/* Description Below Profile Pic (Full Size) */}
                    <Text style={styles.expandedDescription}>
                        {trade.description || 'No description provided'}
                    </Text>

                    {/* Media Carousel (Images + Video at end) */}
                    {totalMediaCount > 0 && (
                        <View style={styles.professionalImageContainer}>
                            {isCurrentItemVideo ? (
                                // Show Video Player
                                <Video
                                    source={{ uri: trade.videoUrl }}
                                    style={styles.professionalImage}
                                    controls={true}
                                    resizeMode="contain"
                                    repeat={true}
                                    paused={!isExpanded}
                                />
                            ) : (
                                // Show Image
                                <RNImage
                                    source={{ uri: trade.imageUrls?.[currentPhotoIndex] }}
                                    style={styles.professionalImage}
                                />
                            )}

                            {/* Navigation Arrows */}
                            {totalMediaCount > 1 && (
                                <>
                                    {/* Left Arrow */}
                                    {currentPhotoIndex > 0 && (
                                        <TouchableOpacity
                                            style={[styles.professionalArrow, styles.professionalArrowLeft]}
                                            onPress={() => onPhotoIndexChange(currentPhotoIndex - 1)}
                                        >
                                            <MaterialCommunityIcons name="chevron-left" size={22} color="#fff" />
                                        </TouchableOpacity>
                                    )}

                                    {/* Right Arrow */}
                                    {currentPhotoIndex < totalMediaCount - 1 && (
                                        <TouchableOpacity
                                            style={[styles.professionalArrow, styles.professionalArrowRight]}
                                            onPress={() => onPhotoIndexChange(currentPhotoIndex + 1)}
                                        >
                                            <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
                                        </TouchableOpacity>
                                    )}

                                    {/* Media Indicators (Dots) */}
                                    <View style={styles.professionalIndicators}>
                                        {Array.from({ length: totalMediaCount }).map((_, idx) => (
                                            <View
                                                key={idx}
                                                style={[
                                                    styles.professionalDot,
                                                    idx === currentPhotoIndex && styles.professionalDotActive
                                                ]}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Info Grid */}
                    <View style={styles.professionalInfoGrid}>
                        <View style={styles.professionalInfoItem}>
                            <Text style={styles.professionalInfoLabel}>Revenue</Text>
                            <Text style={styles.professionalInfoValue}>
                                {trade.revenueStatus === 'revenue-generating' ? 'Revenue Generating' : 'Pre Revenue'}
                            </Text>
                        </View>
                        <View style={styles.professionalInfoItem}>
                            <Text style={styles.professionalInfoLabel}>Age</Text>
                            <Text style={styles.professionalInfoValue}>{trade.companyAge || 'N/A'}</Text>
                        </View>
                        <View style={styles.professionalInfoItem}>
                            <Text style={styles.professionalInfoLabel}>Range</Text>
                            <Text style={styles.professionalInfoValue}>
                                {trade.sellingRangeMin}% - {trade.sellingRangeMax}%
                            </Text>
                        </View>
                    </View>

                    {/* Industry Tags */}
                    {trade.selectedIndustries && trade.selectedIndustries.length > 0 && (
                        <View style={styles.professionalTags}>
                            {trade.selectedIndustries.map((industry, idx) => (
                                <View key={idx} style={styles.professionalTag}>
                                    <Text style={styles.professionalTagText}>{industry}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Express Interest Button */}
                    <TouchableOpacity style={styles.expressInterestButton} onPress={onExpressInterest}>
                        <Text style={styles.expressInterestText}>Express Interest</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}
        </View>
    );
};

import React from 'react';
import { View, Text, TouchableOpacity, Image as RNImage, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ActiveTrade } from '../types';
import { styles } from '../styles';

interface TradeCardProps {
    trade: ActiveTrade;
    isExpanded: boolean;
    isSaved: boolean;
    currentPhotoIndex: number;
    onToggleExpand: () => void;
    onToggleSave: () => void;
    onPhotoIndexChange: (index: number) => void;
}

export const TradeCard: React.FC<TradeCardProps> = ({
    trade,
    isExpanded,
    isSaved,
    currentPhotoIndex,
    onToggleExpand,
    onToggleSave,
    onPhotoIndexChange,
}) => {
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

                {/* Action Buttons - Bookmark and Chat aligned horizontally */}
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
                            color={isSaved ? "#1a73e8" : "#999"}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.collapsedActionBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert('Chat', 'Chat functionality coming soon!');
                        }}
                    >
                        <MaterialCommunityIcons
                            name="message-outline"
                            size={16}
                            color="#999"
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
                <>
                    {/* Description Below Profile Pic (Full Size) */}
                    <Text style={styles.expandedDescription}>
                        {trade.description || 'No description provided'}
                    </Text>

                    {/* Image Carousel */}
                    {trade.imageUrls && trade.imageUrls.length > 0 && (
                        <View style={styles.professionalImageContainer}>
                            <RNImage
                                source={{ uri: trade.imageUrls[currentPhotoIndex] }}
                                style={styles.professionalImage}
                            />

                            {/* Navigation Arrows */}
                            {trade.imageUrls.length > 1 && (
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
                                    {currentPhotoIndex < trade.imageUrls.length - 1 && (
                                        <TouchableOpacity
                                            style={[styles.professionalArrow, styles.professionalArrowRight]}
                                            onPress={() => onPhotoIndexChange(currentPhotoIndex + 1)}
                                        >
                                            <MaterialCommunityIcons name="chevron-right" size={22} color="#fff" />
                                        </TouchableOpacity>
                                    )}

                                    {/* Image Indicators (Dots) */}
                                    <View style={styles.professionalIndicators}>
                                        {trade.imageUrls.map((_, idx) => (
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
                    <TouchableOpacity style={styles.expressInterestButton}>
                        <Text style={styles.expressInterestText}>Express Interest</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

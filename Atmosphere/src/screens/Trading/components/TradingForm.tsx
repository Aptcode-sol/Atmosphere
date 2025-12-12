import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image as RNImage } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../styles';
import { industryTags } from '../types';

interface TradingFormProps {
    sellingRangeMin: number;
    setSellingRangeMin: (val: number) => void;
    sellingRangeMax: number;
    setSellingRangeMax: (val: number) => void;
    isManualEntry: boolean;
    setIsManualEntry: (val: boolean) => void;
    startupUsername: string;
    setStartupUsername: (val: string) => void;
    externalLinkHeading: string;
    setExternalLinkHeading: (val: string) => void;
    externalLinkUrl: string;
    setExternalLinkUrl: (val: string) => void;
    description: string;
    setDescription: (val: string) => void;
    revenueStatus: "revenue-generating" | "pre-revenue";
    setRevenueStatus: (val: "revenue-generating" | "pre-revenue") => void;
    videoUri: string;
    handleVideoUpload: () => void;
    imageUris: string[];
    handleImageUpload: () => void;
    removeImage: (index: number) => void;
    selectedIndustries: string[];
    toggleIndustry: (tag: string) => void;
    onSubmit: () => void;
    submitText: string;
    noPadding?: boolean;
}

export const TradingForm: React.FC<TradingFormProps> = ({
    sellingRangeMin,
    setSellingRangeMin,
    sellingRangeMax,
    setSellingRangeMax,
    isManualEntry,
    setIsManualEntry,
    startupUsername,
    setStartupUsername,
    externalLinkHeading,
    setExternalLinkHeading,
    externalLinkUrl,
    setExternalLinkUrl,
    description,
    setDescription,
    revenueStatus,
    setRevenueStatus,
    videoUri,
    handleVideoUpload,
    imageUris,
    handleImageUpload,
    removeImage,
    selectedIndustries,
    toggleIndustry,
    onSubmit,
    submitText,
    noPadding
}) => {
    return (
        <View style={[
            styles.portfolioExpanded,
            noPadding && {
                marginHorizontal: -16,
                paddingHorizontal: 16,
                borderTopWidth: 1, // ensure explicit border
                borderColor: '#333',
                // marginTop: 12, // optional spacing
                marginBottom: -16, // pull bottom to edge
                paddingBottom: 24, // add internal padding
            }
        ]}>
            {/* Selling Range */}
            <Text style={styles.formLabel}>Selling Range (%)</Text>
            <View style={styles.rangeRow}>
                <TextInput
                    style={styles.rangeInput}
                    placeholder="10"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={String(sellingRangeMin)}
                    onChangeText={(text) => setSellingRangeMin(parseFloat(text) || 0)}
                />
                <Text style={styles.rangeToText}>to</Text>
                <TextInput
                    style={styles.rangeInput}
                    placeholder="40"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={String(sellingRangeMax)}
                    onChangeText={(text) => setSellingRangeMax(parseFloat(text) || 0)}
                />
            </View>

            {/* Startup Details */}
            <Text style={styles.formLabel}>Startup Details</Text>
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleButton, !isManualEntry && styles.toggleButtonActive]}
                    onPress={() => setIsManualEntry(false)}
                >
                    <Text style={!isManualEntry ? styles.toggleTextActive : styles.toggleText}>
                        Auto Entry
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, isManualEntry && styles.toggleButtonActive]}
                    onPress={() => setIsManualEntry(true)}
                >
                    <Text style={isManualEntry ? styles.toggleTextActive : styles.toggleText}>
                        Manual Entry
                    </Text>
                </TouchableOpacity>
            </View>

            {!isManualEntry ? (
                // AUTO ENTRY
                <View>
                    <TextInput
                        style={styles.usernameInput}
                        placeholder="@username"
                        placeholderTextColor="#666"
                        value={startupUsername}
                        onChangeText={setStartupUsername}
                    />

                    <Text style={styles.formLabel}>Add external link</Text>
                    <View style={styles.linkRow}>
                        <TextInput
                            style={[styles.linkInput, { flex: 1, marginRight: 8 }]}
                            placeholder="Heading"
                            placeholderTextColor="#666"
                            value={externalLinkHeading}
                            onChangeText={setExternalLinkHeading}
                        />
                        <TextInput
                            style={[styles.linkInput, { flex: 1 }]}
                            placeholder="Link"
                            placeholderTextColor="#666"
                            value={externalLinkUrl}
                            onChangeText={setExternalLinkUrl}
                        />
                    </View>
                </View>
            ) : (
                // MANUAL ENTRY
                <View>
                    <TextInput
                        style={styles.usernameInput}
                        placeholder="@username (optional)"
                        placeholderTextColor="#666"
                        value={startupUsername}
                        onChangeText={setStartupUsername}
                    />

                    <Text style={styles.formLabel}>Add external link</Text>
                    <View style={styles.linkRow}>
                        <TextInput
                            style={[styles.linkInput, { flex: 1, marginRight: 8 }]}
                            placeholder="Heading"
                            placeholderTextColor="#666"
                            value={externalLinkHeading}
                            onChangeText={setExternalLinkHeading}
                        />
                        <TextInput
                            style={[styles.linkInput, { flex: 1 }]}
                            placeholder="Link"
                            placeholderTextColor="#666"
                            value={externalLinkUrl}
                            onChangeText={setExternalLinkUrl}
                        />
                    </View>

                    {/* Segment Tags */}
                    <Text style={styles.formLabel}>Segment (max 3)</Text>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        style={styles.tagsScroll}
                        nestedScrollEnabled={true}
                    >
                        <View style={styles.tagsContent}>
                            {industryTags.map(tag => (
                                <TouchableOpacity
                                    key={tag}
                                    onPress={() => toggleIndustry(tag)}
                                    disabled={!selectedIndustries.includes(tag) && selectedIndustries.length >= 3}
                                    style={[
                                        styles.tagChip,
                                        selectedIndustries.includes(tag) && styles.tagChipActive
                                    ]}
                                >
                                    <Text style={[
                                        styles.tagChipText,
                                        selectedIndustries.includes(tag) && styles.tagChipTextActive
                                    ]}>
                                        {tag}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Description */}
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                        style={styles.descriptionInput}
                        placeholder="Description..."
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={3}
                        value={description}
                        onChangeText={setDescription}
                    />

                    {/* Revenue Status */}
                    <View style={styles.toggleRow}>
                        <TouchableOpacity
                            style={[styles.toggleButton, revenueStatus === 'revenue-generating' && styles.toggleButtonActive]}
                            onPress={() => setRevenueStatus('revenue-generating')}
                        >
                            <Text style={revenueStatus === 'revenue-generating' ? styles.toggleTextActive : styles.toggleText}>
                                Revenue Generating
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleButton, revenueStatus === 'pre-revenue' && styles.toggleButtonActive]}
                            onPress={() => setRevenueStatus('pre-revenue')}
                        >
                            <Text style={revenueStatus === 'pre-revenue' ? styles.toggleTextActive : styles.toggleText}>
                                Pre Revenue
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Video Upload */}
                    <TouchableOpacity style={styles.uploadButton} onPress={handleVideoUpload}>
                        <MaterialCommunityIcons name="video" size={16} color="#fff" />
                        <Text style={styles.uploadButtonText}>
                            {videoUri ? 'Video Selected' : 'Upload Video'}
                        </Text>
                    </TouchableOpacity>

                    {/* Image Upload */}
                    <TouchableOpacity style={styles.uploadButton} onPress={handleImageUpload}>
                        <MaterialCommunityIcons name="image" size={16} color="#fff" />
                        <Text style={styles.uploadButtonText}>Upload Images</Text>
                    </TouchableOpacity>

                    {imageUris.length > 0 && (
                        <View style={styles.imagePreviewContainer}>
                            {imageUris.map((uri, idx) => (
                                <View key={idx} style={styles.imagePreview}>
                                    <RNImage source={{ uri }} style={styles.previewImage} />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeImage(idx)}
                                    >
                                        <MaterialCommunityIcons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}

            <TouchableOpacity
                style={styles.openTradeButton}
                onPress={onSubmit}
            >
                <Text style={styles.openTradeButtonText}>
                    {submitText}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import styles from '../Opportunities.styles';

interface RoleCardProps {
    item: any;
    isMyAd?: boolean;
    expanded?: boolean;
    onExpand: () => void;
}

function RoleCard({ item, isMyAd = false, expanded = false, onExpand }: RoleCardProps) {
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [applicantsCount] = useState(item.applicantsCount || 0);

    const cardBg = '#000000';
    const borderColor = '#333';
    const textColor = '#ffffff';
    const subTextColor = '#ffffff';
    const accentColor = '#ffffff';

    const tags = ['AI', 'B2B', 'SaaS', 'Startup'];
    const description = item.description || item.requirements || 'No description provided.';

    const handleApply = () => {
        const url = item.applicationUrl || item.url;
        if (url) {
            Linking.openURL(url).catch(() => {
                Alert.alert('Error', 'Could not open the application link');
            });
        } else {
            Alert.alert('Info', 'No application link available for this position');
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {/* Header: Company + Badge */}
            <View style={styles.cardHeaderRow}>
                <View style={styles.companyRow}>
                    <View style={styles.companyIcon}>
                        <MaterialIcons name="business" size={20} color="#fff" />
                    </View>
                    <View style={styles.companyInfo}>
                        <View style={styles.companyNameRow}>
                            <Text style={[styles.companyName, { color: accentColor }]} numberOfLines={1}>
                                {item.poster?.startupName || item.startupName || 'Unknown Startup'}
                            </Text>
                            {isMyAd && (
                                <View style={styles.myAdBadge}>
                                    <Text style={styles.myAdText}>My Ad</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.companyType, { color: subTextColor }]}>
                            {item.companyType || item.sector || 'Startup'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Role Title + Location */}
            <View style={styles.roleSection}>
                <Text style={[styles.roleTitle, { color: textColor }]} numberOfLines={2}>
                    {item.roleTitle || item.title}
                </Text>
                <View style={styles.locationRow}>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="place" size={14} color={accentColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaText, { color: accentColor }]}>
                            {item.location || item.locationType || 'Remote'}
                        </Text>
                    </View>
                    <Text style={[styles.remoteText, { color: subTextColor }]}>
                        {item.isRemote ? 'Remote' : 'On-site'}
                    </Text>
                </View>
            </View>

            {/* Description */}
            <View style={styles.descContainer}>
                <Text style={[styles.cardDesc, { color: subTextColor }]} numberOfLines={showFullDesc ? undefined : 2}>
                    {description}
                </Text>
                {description.length > 80 && (
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <Text style={styles.moreLess}>{showFullDesc ? 'Less' : 'More'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tags */}
            <View style={styles.tagsRow}>
                {tags.map((tag, idx) => (
                    <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
            </View>

            {/* Footer: Applicants + Employment Type */}
            <View style={[styles.footerRow, { borderTopColor: borderColor }]}>
                <TouchableOpacity onPress={onExpand} style={styles.applicantsBtn}>
                    <Text style={[styles.chevron, { transform: [{ rotate: expanded ? '180deg' : '0deg' }] }]}>▼</Text>
                    <Text style={[styles.applicantsText, { color: subTextColor }]}>
                        {applicantsCount} applicants
                    </Text>
                </TouchableOpacity>
                <Text style={[styles.employmentText, { color: textColor }]}>
                    {item.employmentType || 'Full-time'} • {item.isRemote ? 'Remote' : 'On-site'}
                </Text>
            </View>

            {/* Expanded Section - Direct Apply Button */}
            {expanded && (
                <View style={styles.expandedSectionInline}>
                    <TouchableOpacity
                        style={[styles.sendBtnDark, { backgroundColor: '#fff' }]}
                        onPress={handleApply}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={[styles.sendBtnText, { color: '#000' }]}>Send Application</Text>
                            <MaterialIcons name="open-in-new" size={16} color="#000" style={{ marginLeft: 8 }} />
                        </View>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

export default RoleCard;

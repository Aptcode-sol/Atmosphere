import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    Alert,
    Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getBadgeColor, formatDate } from '../helpers';
import styles from '../Opportunities.styles';

interface GrantEventCardProps {
    item: any;
    type: 'Grant' | 'Event';
}

function GrantEventCard({ item, type }: GrantEventCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [applied, setApplied] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', notes: '' });
    const [showFullDesc, setShowFullDesc] = useState(false);

    const companyName = type === 'Grant' ? (item.organization || 'Unknown Org') : (item.organizer || 'Unknown Host');

    const cardBg = '#000';
    const borderColor = '#202122';
    const textColor = '#f2f2f2';
    const subTextColor = '#888';

    const description = item.description || 'No description provided.';
    const badgeType = item.type || type.toLowerCase();

    const handleApply = () => {
        if (!form.name || !form.email) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }
        setTimeout(() => {
            setApplied(true);
            Alert.alert('Success', `Successfully ${type === 'Grant' ? 'applied' : 'registered'}!`);
            setExpanded(false);
        }, 1000);
    };

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {/* Header: Title + Badge on same line */}
            <View style={styles.cardHeaderRow}>
                <View style={styles.titleBadgeRow}>
                    <Text style={[styles.roleTitle, { color: textColor, flex: 1 }]} numberOfLines={2}>
                        {item.name || item.title}
                    </Text>
                    <View style={[styles.myAdBadge, { backgroundColor: 'rgba(100, 100, 100, 0.3)', marginLeft: 12 }]}>
                        <Text style={[styles.myAdText, { color: '#aaa' }]}>{badgeType}</Text>
                    </View>
                </View>
            </View>

            {/* Organization/Company Name */}
            <Text style={[styles.companySubtitle, { color: subTextColor }]}>
                {companyName}
            </Text>

            {/* Description */}
            <View style={[styles.descContainer, { marginTop: 8 }]}>
                <Text style={[styles.cardDesc, { color: subTextColor }]} numberOfLines={expanded || showFullDesc ? undefined : 2}>
                    {description}
                </Text>
                {!expanded && description.length > 80 && (
                    <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)}>
                        <Text style={styles.moreLess}>{showFullDesc ? 'Less' : 'More'}</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Location + Deadline Row */}
            <View style={styles.roleSection}>
                <View style={styles.locationRow}>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="place" size={16} color={subTextColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaText, { color: subTextColor }]}>
                            {item.location || 'Remote'}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <MaterialIcons name="event" size={16} color={subTextColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.metaText, { color: subTextColor }]}>
                            {formatDate(item.deadline || item.date)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Expanded Form Section */}
            {expanded ? (
                <View style={[styles.expandedSection, { borderColor, backgroundColor: '#111' }]}>
                    {!applied ? (
                        <>
                            <Text style={[styles.formHeader, { color: textColor }]}>
                                {type === 'Grant' ? 'Application Details' : 'Registration Details'}
                            </Text>

                            <TextInput
                                style={[styles.input, { color: textColor, borderColor }]}
                                placeholder="Full Name *"
                                placeholderTextColor={subTextColor}
                                value={form.name}
                                onChangeText={t => setForm({ ...form, name: t })}
                            />
                            <TextInput
                                style={[styles.input, { color: textColor, borderColor }]}
                                placeholder="Email Address *"
                                placeholderTextColor={subTextColor}
                                value={form.email}
                                onChangeText={t => setForm({ ...form, email: t })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {type === 'Grant' && (
                                <TextInput
                                    style={[styles.input, { color: textColor, borderColor, minHeight: 80, textAlignVertical: 'top' }]}
                                    placeholder="Why are you a good fit? (Optional)"
                                    placeholderTextColor={subTextColor}
                                    value={form.notes}
                                    onChangeText={t => setForm({ ...form, notes: t })}
                                    multiline
                                />
                            )}

                            <View style={styles.formActions}>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { borderColor }]}
                                    onPress={() => setExpanded(false)}
                                >
                                    <Text style={styles.cancelText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.submitBtn, { backgroundColor: '#fff' }]}
                                    onPress={handleApply}
                                >
                                    <Text style={[styles.submitText, { color: '#000' }]}>
                                        {type === 'Grant' ? 'Submit Application' : 'Register Now'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    ) : (
                        <View style={styles.appliedContainer}>
                            <Text style={styles.appliedText}>✓ {type === 'Grant' ? 'Application Sent' : 'Registered Successfully'}</Text>
                        </View>
                    )}
                </View>
            ) : (
                /* Action Row when NOT expanded */
                <View style={[styles.footerRow, { borderTopColor: borderColor }]}>
                    {/* Left side info: Amount or Attendees */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {type === 'Grant' && (
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                                {item.amount || 'Varies'}
                            </Text>
                        )}
                        {type === 'Event' && item.attendees && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialIcons name="group" size={16} color={subTextColor} style={{ marginRight: 4 }} />
                                <Text style={[styles.employmentText, { color: subTextColor }]}>
                                    {item.attendees}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Right side: Apply Button - Opens URL */}
                    <TouchableOpacity
                        onPress={() => {
                            const url = item.url || item.applicationUrl;
                            if (url) {
                                Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link'));
                            } else {
                                Alert.alert('Info', 'No application link available');
                            }
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                            {type === 'Grant' ? 'Apply' : 'Register'}
                        </Text>
                        <MaterialIcons name="open-in-new" size={18} color="#fff" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

export default GrantEventCard;

import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
    Share, // Keep React Native Share
    Linking,
    ScrollView,
    Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { pick, types } from '@react-native-documents/picker';
import RNShare from 'react-native-share'; // Requires installing react-native-share if not already used, checking package.json it is there
import { ThemeContext } from '../../../contexts/ThemeContext';
import styles from '../Opportunities.styles';
import { useAlert } from '../../../components/CustomAlert';

const api = require('../../../lib/api');
import RNFS from 'react-native-fs';


interface RoleCardProps {
    item: any;
    isMyAd?: boolean;
    expanded?: boolean;
    onExpand: () => void;
    onApplySuccess?: () => void;
    userRole?: string;
}

function RoleCard({ item, isMyAd = false, expanded = false, onExpand, onApplySuccess, userRole = '' }: RoleCardProps) {
    const { theme } = useContext(ThemeContext) as any;
    const { showAlert } = useAlert();
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [applicantsCount, setApplicantsCount] = useState(item.applicantsCount || item.applicantCount || 0);
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [questionAnswers, setQuestionAnswers] = useState<string[]>(
        (item.customQuestions || []).map(() => '')
    );
    const [resumeFile, setResumeFile] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [uploadingResume, setUploadingResume] = useState(false);

    // Export Logic State
    const [exporting, setExporting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [exportedFilePath, setExportedFilePath] = useState('');

    const handleExportToExcel = async () => {
        setExporting(true);
        try {
            const jobId = item._id || item.id;

            // Fetch applicants data
            const data = await api.getJobApplicants(jobId);
            const applicants = data.applicants || [];

            if (applicants.length === 0) {
                showAlert('No Data', 'There are no applicants to export.');
                setExporting(false);
                return;
            }

            // Generate CSV content
            let csvContent = 'Applicant Name,Email,Applied Date,Resume URL';

            // Add custom question headers
            const questions = item.customQuestions || [];
            questions.forEach((_q: string, idx: number) => {
                csvContent += `,Question ${idx + 1}`;
            });
            csvContent += '\n';

            // Add applicant rows
            applicants.forEach((app: any) => {
                const user = app.userId || app.user || {};
                const name = user.displayName || user.username || 'Unknown';
                const email = user.email || '';
                const appliedDate = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '';
                const resumeUrl = app.resumeUrl || '';

                // Escape CSV values
                const escapeCSV = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

                csvContent += `${escapeCSV(name)},${escapeCSV(email)},${appliedDate},${escapeCSV(resumeUrl)}`;

                // Add responses
                questions.forEach((_q: string, idx: number) => {
                    const response = (app.responses || [])[idx];
                    const answer = response?.answer || '';
                    csvContent += `,${escapeCSV(answer)}`;
                });
            });

            // Save to Android/media/com.atmosphere folder (standard app media location)
            const { Platform } = require('react-native');
            const fileName = `${(item.title || 'Job').replace(/[^a-zA-Z0-9]/g, '_')}_Applicants.csv`;

            // Create app folder in Android/media
            const appFolderPath = `${RNFS.ExternalStorageDirectoryPath}/Android/media/com.atmosphere`;

            // Check if folder exists, create if not
            const folderExists = await RNFS.exists(appFolderPath);
            if (!folderExists) {
                await RNFS.mkdir(appFolderPath);
            }

            const filePath = `${appFolderPath}/${fileName}`;
            await RNFS.writeFile(filePath, csvContent, 'utf8');

            setExportedFilePath(filePath);
            setShowSuccessModal(true);

        } catch (err: any) {
            console.log('Export error:', err);
            showAlert('Export Failed', err.message || 'Could not save file');
        } finally {
            setExporting(false);
        }
    };

    const cardBg = '#000000';
    const borderColor = '#333';
    const textColor = '#ffffff';
    const subTextColor = '#ffffff';
    const accentColor = '#ffffff';

    const tags = ['AI', 'B2B', 'SaaS', 'Startup'];
    const description = item.description || item.requirements || 'No description provided.';
    const customQuestions = item.customQuestions || [];

    // Dynamic poster name - works for both investors and startups
    const getPosterDisplayName = () => {
        // First check for explicit startupName on the job
        if (item.startupName) return item.startupName;

        // Check poster object for display info
        if (item.poster) {
            // For startups, use startupName or companyName
            if (item.poster.startupName) return item.poster.startupName;
            if (item.poster.companyName) return item.poster.companyName;
            // For investors or any user, use displayName or username
            if (item.poster.displayName) return item.poster.displayName;
            if (item.poster.fullName) return item.poster.fullName;
            if (item.poster.username) return `@${item.poster.username}`;
        }

        return 'Unknown Poster';
    };

    // Poster type label
    const getPosterType = () => {
        if (item.sector) return item.sector;
        if (item.companyType) return item.companyType;
        if (item.poster?.roles?.includes('investor')) return 'Investor';
        if (item.poster?.roles?.includes('startup')) return 'Startup';
        return 'Organization';
    };

    const pickResume = async () => {
        try {
            const result = await pick({
                type: [types.pdf],
            });
            if (result && result.length > 0) {
                const file = result[0];
                setResumeFile({
                    uri: file.uri,
                    name: file.name || 'resume.pdf',
                    type: file.type || 'application/pdf',
                });
            }
        } catch (err: any) {
            if (err.code !== 'DOCUMENT_PICKER_CANCELED') {
                showAlert('Error', 'Failed to pick document');
            }
        }
    };

    const handleApply = async () => {
        // Check if all questions are answered
        const hasQuestions = customQuestions.length > 0;
        const allAnswered = questionAnswers.every((ans, i) =>
            customQuestions[i] ? ans.trim() !== '' : true
        );

        if (hasQuestions && !allAnswered) {
            showAlert('Required', 'Please answer all questions before submitting.');
            return;
        }

        setApplying(true);
        try {
            let resumeUrl = '';

            // Upload resume if selected
            if (resumeFile) {
                setUploadingResume(true);
                try {
                    resumeUrl = await api.uploadDocument(resumeFile.uri, resumeFile.name, resumeFile.type);
                } catch (uploadErr: any) {
                    showAlert('Upload Error', uploadErr.message || 'Failed to upload resume');
                    setApplying(false);
                    setUploadingResume(false);
                    return;
                }
                setUploadingResume(false);
            }

            const responses = customQuestions.map((q: string, i: number) => ({
                question: q,
                answer: questionAnswers[i] || ''
            }));

            await api.applyToJob(item._id || item.id, { responses, resumeUrl });

            setApplied(true);
            setApplicantsCount((prev: number) => prev + 1);
            Alert.alert('Success', 'Application submitted successfully!');
            onApplySuccess?.();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to submit application');
        } finally {
            setApplying(false);
        }
    };

    return (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            {/* Header: Poster Info + Badge */}
            <View style={styles.cardHeaderRow}>
                <View style={styles.companyRow}>
                    <View style={styles.companyIcon}>
                        <MaterialIcons
                            name={item.poster?.roles?.includes('investor') ? 'account-balance' : 'business'}
                            size={20}
                            color="#fff"
                        />
                    </View>
                    <View style={styles.companyInfo}>
                        <View style={styles.companyNameRow}>
                            <Text style={[styles.companyName, { color: accentColor }]} numberOfLines={1}>
                                {getPosterDisplayName()}
                            </Text>
                            {/* {isMyAd && (
                                <View style={styles.myAdBadge}>
                                    <Text style={styles.myAdText}>My Ad</Text>
                                </View>
                            )} */}
                        </View>
                        <Text style={[styles.companyType, { color: subTextColor }]}>
                            {getPosterType()}
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
                        <MaterialIcons name="place" size={16} color={accentColor} style={{ marginRight: 4 }} />
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
                {isMyAd ? (
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#333',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                        onPress={onExpand}
                    >
                        <MaterialIcons name="file-download" size={16} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Export CSV</Text>
                    </TouchableOpacity>
                ) : (
                    <Text style={[styles.employmentText, { color: textColor }]}>
                        {item.employmentType || 'Full-time'} • {item.isRemote ? 'Remote' : 'On-site'}
                    </Text>
                )}
            </View>


            {/* Expanded Section */}
            {expanded && (
                <View style={styles.expandedSectionInline}>
                    {isMyAd ? (
                        /* Owner View - Show Applicants and Export Button directly */
                        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#333',
                                    borderColor: '#444',
                                    borderWidth: 1,
                                    borderRadius: 22,
                                    height: 44,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    paddingHorizontal: 24,
                                    width: '100%'
                                }}
                                onPress={handleExportToExcel}
                                disabled={exporting}
                            >
                                {exporting ? (
                                    <ActivityIndicator color="#fff" size="small" />
                                ) : (
                                    <>
                                        <MaterialIcons name="file-download" size={20} color="#fff" style={{ marginRight: 8 }} />
                                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                                            Export {applicantsCount} Applicants to CSV
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <Modal
                                visible={showSuccessModal}
                                transparent={true}
                                animationType="fade"
                                onRequestClose={() => setShowSuccessModal(false)}
                            >
                                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                    <View style={{ backgroundColor: '#1E1E1E', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340, borderWidth: 1, borderColor: '#333' }}>
                                        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12, textAlign: 'center' }}>Export Successful</Text>
                                        <Text style={{ color: '#aaa', fontSize: 14, marginBottom: 24, textAlign: 'center', lineHeight: 20 }}>
                                            File saved to:{'\n'}Android/media/com.atmosphere
                                        </Text>

                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity
                                                onPress={() => setShowSuccessModal(false)}
                                                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#444', alignItems: 'center' }}
                                            >
                                                <Text style={{ color: '#fff', fontWeight: '600' }}>Close</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={async () => {
                                                    try {
                                                        console.log('Opening file:', exportedFilePath);

                                                        if (!exportedFilePath) {
                                                            showAlert('Error', 'No file path available');
                                                            return;
                                                        }

                                                        const exists = await RNFS.exists(exportedFilePath);
                                                        if (!exists) {
                                                            showAlert('Error', 'File no longer exists');
                                                            return;
                                                        }

                                                        // Copy to cache directory for proper sharing
                                                        const fileName = exportedFilePath.split('/').pop() || 'applicants.csv';
                                                        const cachePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
                                                        await RNFS.copyFile(exportedFilePath, cachePath);

                                                        console.log('File copied to cache:', cachePath);

                                                        // Share using file path from cache
                                                        await RNShare.open({
                                                            url: `file://${cachePath}`,
                                                            type: 'text/csv',
                                                        });
                                                        setShowSuccessModal(false);
                                                    } catch (err: any) {
                                                        // User cancelled or dismissed is not an error
                                                        if (err?.message?.includes('cancel') || err?.message?.includes('dismiss') || err?.message?.includes('User did not share')) {
                                                            setShowSuccessModal(false);
                                                            return;
                                                        }
                                                        console.log('Open file error:', err);
                                                        showAlert('Error', 'Could not open file: ' + (err?.message || 'Unknown error'));
                                                    }
                                                }}
                                                style={{ flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center' }}
                                            >
                                                <Text style={{ color: '#000', fontWeight: '600' }}>Share</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </Modal>
                        </View>
                    ) : !applied ? (
                        <>
                            {/* Check if user allowed to apply */}
                            {userRole !== 'personal' ? (
                                <View style={{ alignItems: 'center', paddingVertical: 20, backgroundColor: '#1a1a1a', borderRadius: 8, marginTop: 8 }}>
                                    <MaterialIcons name="lock-outline" size={32} color="#888" />
                                    <Text style={{ color: '#aaa', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}>
                                        Job applications are only available for personal accounts.
                                    </Text>
                                    <Text style={{ color: '#666', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                                        Switch to a personal account to apply.
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    {/* Custom Questions */}
                                    {customQuestions.length > 0 && (
                                        <View style={{ marginBottom: 16 }}>
                                            {customQuestions.map((question: string, index: number) => (
                                                <View key={index} style={{ marginBottom: 12 }}>
                                                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>
                                                        {question}
                                                    </Text>
                                                    <TextInput
                                                        style={{
                                                            backgroundColor: '#1a1a1a',
                                                            borderRadius: 8,
                                                            padding: 12,
                                                            color: '#fff',
                                                            minHeight: 60,
                                                            textAlignVertical: 'top',
                                                            borderWidth: 1,
                                                            borderColor: '#333',
                                                        }}
                                                        placeholder="Your answer..."
                                                        placeholderTextColor="#666"
                                                        value={questionAnswers[index]}
                                                        onChangeText={(text) => {
                                                            const newAnswers = [...questionAnswers];
                                                            newAnswers[index] = text;
                                                            setQuestionAnswers(newAnswers);
                                                        }}
                                                        multiline
                                                    />
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    {/* Resume Upload */}
                                    <View style={{ marginBottom: 16 }}>
                                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', marginBottom: 6 }}>
                                            Resume (PDF)
                                        </Text>
                                        <TouchableOpacity
                                            onPress={pickResume}
                                            style={{
                                                backgroundColor: '#1a1a1a',
                                                borderRadius: 8,
                                                padding: 14,
                                                borderWidth: 1,
                                                borderColor: resumeFile ? '#22c55e' : '#333',
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                <MaterialIcons
                                                    name={resumeFile ? 'check-circle' : 'attach-file'}
                                                    size={20}
                                                    color={resumeFile ? '#22c55e' : '#666'}
                                                    style={{ marginRight: 10 }}
                                                />
                                                <Text
                                                    style={{ color: resumeFile ? '#fff' : '#666', flex: 1 }}
                                                    numberOfLines={1}
                                                >
                                                    {resumeFile ? resumeFile.name : 'Tap to upload resume (PDF)'}
                                                </Text>
                                            </View>
                                            {resumeFile && (
                                                <TouchableOpacity
                                                    onPress={() => setResumeFile(null)}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <MaterialIcons name="close" size={18} color="#888" />
                                                </TouchableOpacity>
                                            )}
                                        </TouchableOpacity>
                                    </View>

                                    {/* Apply Button */}
                                    <TouchableOpacity
                                        style={[styles.sendBtnDark, { backgroundColor: '#fff', opacity: applying ? 0.7 : 1 }]}
                                        onPress={handleApply}
                                        disabled={applying}
                                    >
                                        {applying ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <ActivityIndicator color="#000" size="small" />
                                                <Text style={{ color: '#000', marginLeft: 8 }}>
                                                    {uploadingResume ? 'Uploading Resume...' : 'Submitting...'}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={[styles.sendBtnText, { color: '#000' }]}>Send Application</Text>
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                        </>
                    ) : (
                        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                            <MaterialIcons name="check-circle" size={32} color="#22c55e" />
                            <Text style={{ color: '#22c55e', fontSize: 14, fontWeight: '500', marginTop: 8 }}>
                                Application Sent Successfully
                            </Text>
                            <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                                You can track your application in My Jobs
                            </Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

export default RoleCard;

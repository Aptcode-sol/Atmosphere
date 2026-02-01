import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 16,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        backgroundColor: '#171819',
        borderRadius: 15,
        padding: 8,
        marginHorizontal: 12,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBtnActive: {
        backgroundColor: '#000305',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tabTextInactive: {
        color: '#888',
    },

    // List
    listContent: {
        paddingBottom: 80,
        paddingHorizontal: 16,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    resultCount: {
        fontSize: 14,
        paddingTop: 6,
        color: '#888',
    },
    filterIcon: {
        fontSize: 18,
    },
    filterIconBtn: {
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#333',
    },
    loaderContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    footerLoader: {
        marginVertical: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 32,
        fontSize: 16,
    },

    // Card Base
    card: {
        borderRadius: 24,
        marginBottom: 16,
        padding: 20,
        borderWidth: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardHeaderText: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardOrg: {
        fontSize: 12,
    },
    badge: {
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },

    // Description
    descContainer: {
        marginBottom: 12,
    },
    cardDesc: {
        fontSize: 13,
        lineHeight: 18,
    },
    moreLess: {
        color: '#3b82f6',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
    },

    // Meta Row
    metaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaIcon: {
        fontSize: 12,
        marginRight: 4,
    },
    metaText: {
        fontSize: 12,
    },

    // Action Row
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountText: {
        fontSize: 15,
        fontWeight: '600',
    },
    applyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    applyBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '600',
    },
    applyBtnIcon: {
        color: '#000',
        fontSize: 12,
        marginLeft: 4,
    },

    // Role Card specific
    companyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    companyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    companyIconText: {
        fontSize: 20,
    },
    companyInfo: {
        flex: 1,
    },
    companyNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    companyName: {
        fontSize: 14,
        fontWeight: '600',
    },
    companyType: {
        fontSize: 12,
        marginTop: 2,
    },
    myAdBadge: {
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    myAdText: {
        color: '#8b5cf6',
        fontSize: 10,
        fontWeight: '600',
    },

    // Role Section
    roleSection: {
        marginBottom: 12,
    },
    roleTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    remoteText: {
        fontSize: 12,
    },

    // Tags
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    tag: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#111',
    },
    tagText: {
        color: '#ccc',
        fontSize: 11,
        fontWeight: '500',
    },

    // Footer
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    applicantsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chevron: {
        color: '#888',
        fontSize: 10,
        marginRight: 6,
    },
    applicantsText: {
        fontSize: 12,
    },
    employmentText: {
        fontSize: 12,
    },

    // Expanded Section
    expandedSection: {
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
    },
    questionContainer: {
        marginBottom: 16,
    },
    questionLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    questionInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 13,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    uploadContainer: {
        marginBottom: 16,
    },
    uploadLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 8,
    },
    uploadBtn: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    uploadBtnText: {
        fontSize: 13,
    },
    sendBtn: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    sendBtnText: {
        color: '#000',
        fontSize: 14,
        fontWeight: '600',
    },
    appliedContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    appliedText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '500',
    },
    appliedSubtext: {
        fontSize: 12,
        marginTop: 4,
    },

    // Inline Expanded Section
    expandedSectionInline: {
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
    },
    questionContainerInline: {
        marginBottom: 24,
    },
    questionLabelBold: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    questionInputDark: {
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 14,
        fontSize: 14,
        color: '#f2f2f2',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    uploadContainerInline: {
        marginBottom: 24,
    },
    uploadLabelBold: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    fileChooserRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileChooserBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    fileChooserBtnText: {
        color: '#000',
        fontSize: 13,
        fontWeight: '600',
    },
    noFileText: {
        color: '#fff',
        fontSize: 13,
        marginLeft: 12,
    },
    sendBtnDark: {
        backgroundColor: '#333',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },

    filterModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    filterModalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    filterModalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    filterCloseBtn: {
        fontSize: 20,
    },
    filterScrollView: {
        padding: 16,
    },
    filterSection: {
        marginBottom: 12,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    filterChevron: {
        color: '#888',
        fontSize: 12,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        marginTop: 8,
    },
    filterOption: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#333',
    },
    filterOptionActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    filterOptionText: {
        fontSize: 12,
        fontWeight: '500',
    },
    clearFiltersBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        marginTop: 8,
    },
    clearFiltersText: {
        color: '#888',
        fontSize: 14,
    },

    // Action Buttons
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    actionBtn: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Form Styles
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: '#f2f2f2',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputDark: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        color: '#f2f2f2',
    },
    submitBtnDark: {
        flex: 1,
        backgroundColor: '#222',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
        marginLeft: 8,
    },
    questionsLabel: {
        color: '#f2f2f2',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 4,
    },
    questionsSubLabel: {
        color: '#888',
        fontSize: 12,
        marginBottom: 16,
    },
    createBtn: {
        backgroundColor: '#333',
        borderColor: '#444',
    },
    createBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    myTeamsBtn: {
        backgroundColor: 'transparent',
        borderColor: '#373737',
        borderWidth: 1,
        padding: 8,
    },
    myTeamsBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },

    // Modal
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalBox: {
        width: '90%',
        maxHeight: '85%',
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#fff',
    },
    modalScroll: {
        maxHeight: 400,
    },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        fontSize: 15,
        color: '#fff',
        backgroundColor: '#1a1a1a',
    },
    remoteToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#333',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    remoteToggleText: {
        color: '#fff',
        fontSize: 14,
    },

    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    cancelBtn: {
        backgroundColor: '#333',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    cancelText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        flex: 1,
    },
    submitText: {
        color: '#000',
        fontSize: 15,
        fontWeight: 'bold',
    },
    formHeader: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    formActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    titleBadgeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    companySubtitle: {
        fontSize: 14,
        marginTop: -8,
    },
    myTeamsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    myTeamsList: {
        minHeight: 80,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    myTeamsEmptyText: {
        color: '#666',
        fontStyle: 'italic',
        marginLeft: 4,
    },
    teamMemberItem: {
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
        width: 60,
    },
    teamMemberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#333',
        marginBottom: 4,
    },
    teamMemberName: {
        color: '#fff',
        fontSize: 10,
        textAlign: 'center',
    },
    removeMemberBtn: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#333',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#000',
        padding: 2,
    },
    myTeamsSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 12,
    },
    myTeamsSearchInput: {
        flex: 1,
        color: '#fff',
        paddingVertical: 10,
    },
    teamSearchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    teamSearchResultAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#333',
        marginRight: 12,
    },
    teamSearchResultInfo: {
        flex: 1,
    },
    teamSearchResultName: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    addTeamMemberBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
    addTeamMemberText: {
        color: '#000',
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Active Job Posts Section
    activeJobsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#0d0d0d',
        borderWidth: 1,
        borderColor: '#272727',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginTop: 12,
        marginBottom: 8,
    },
    activeJobsTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    activeJobsContainer: {
        backgroundColor: '#0d0d0d',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#272727',
    },
    noActiveJobsText: {
        color: '#666',
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: 16,
    },
    myJobCard: {
        backgroundColor: '#111',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#222',
    },
    myJobCardContent: {
        marginBottom: 10,
    },
    myJobTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    myJobMeta: {
        color: '#888',
        fontSize: 12,
    },
    myJobActions: {
        flexDirection: 'row',
        gap: 16,
    },
    myJobActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    closeJobText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '500',
    },
    editJobText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '500',
    },
});

export default styles;

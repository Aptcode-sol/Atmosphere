import { StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
export const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.6);

export const commentStyles = StyleSheet.create({
    backdrop: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#000'
    },
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        // Ensure modal takes full screen
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    sheet: {
        backgroundColor: '#0a0a0a',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#222',
    },
    handleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#333'
    },
    closeBtn: {
        position: 'absolute',
        right: 0,
        top: -4,
        padding: 8
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 16,
        color: '#fff'
    },
    contentWrap: {
        flex: 1
    },
    emptyWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40
    },
    emptyText: {
        color: '#666',
        fontSize: 14
    },
    commentRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    replyRow: {
        marginLeft: 0,
        marginBottom: 12,
    },
    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#333',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    avatarLetter: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14
    },
    commentBody: {
        flex: 1
    },
    commentHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    commentAuthor: {
        fontWeight: '600',
        color: '#fff',
        fontSize: 14
    },
    commentText: {
        marginTop: 4,
        color: '#e0e0e0',
        fontSize: 14,
        lineHeight: 20
    },
    commentTimestamp: {
        fontSize: 12,
        color: '#666'
    },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    replyBtn: {
        paddingVertical: 2,
    },
    replyBtnText: {
        color: '#888',
        fontSize: 13,
        fontWeight: '500',
    },
    smallDeleteBtn: {
        backgroundColor: '#ef4444',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6
    },
    smallDeleteText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600'
    },
    viewRepliesBtn: {
        marginLeft: 48,
        marginBottom: 12,
    },
    hideRepliesBtn: {
        marginTop: 4,
    },
    viewRepliesText: {
        color: '#666',
        fontSize: 13,
    },
    repliesContainer: {
        marginLeft: 48,
        borderLeftWidth: 1,
        borderLeftColor: '#222',
        paddingLeft: 12,
        marginBottom: 8,
    },
    replyTag: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    replyIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1a1a1a',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    replyIndicatorText: {
        color: '#888',
        fontSize: 13,
    },
    replyIndicatorUsername: {
        color: '#fff',
        fontWeight: '600',
    },
    inputContainer: {
        paddingVertical: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 10,
        maxHeight: 100,
    },
    sendBtn: {
        padding: 8,
        marginLeft: 8,
    },
});

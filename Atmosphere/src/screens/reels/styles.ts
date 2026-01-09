import { Dimensions, StatusBar, StyleSheet } from 'react-native';
import { BOTTOM_NAV_HEIGHT } from '../../lib/layout';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
export const STATUS_BAR_HEIGHT = StatusBar.currentHeight || 0;
export const COMMENT_INPUT_HEIGHT = 56;

// Color scheme for Reels
export const COLORS = {
    primary: '#3d3d3d',
    success: '#22c55e',
    like: '#ef4444',
    text: '#f5f5f5',
    textMuted: '#666666',
};

// Reel height - subtract bottom nav (60px) since it's now in flow
export const ACTUAL_BOTTOM_NAV_HEIGHT = BOTTOM_NAV_HEIGHT + 50; // 60px total
export const ITEM_HEIGHT = SCREEN_HEIGHT - ACTUAL_BOTTOM_NAV_HEIGHT - STATUS_BAR_HEIGHT;

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    reelWrapper: {
        width: SCREEN_WIDTH,
        height: ITEM_HEIGHT,
        backgroundColor: '#000',
    },
    reelContainer: {
        width: SCREEN_WIDTH,
        height: ITEM_HEIGHT,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    touchOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
    },
    overlay: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    leftContent: {
        flex: 1,
        marginRight: 16,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        marginRight: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        backgroundColor: '#555',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    username: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginRight: 12,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    followBtn: {
        borderWidth: 1,
        borderColor: '#fff',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    followBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    caption: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    moreText: {
        color: '#aaa',
        fontWeight: '500',
    },
    hashtags: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    actions: {
        alignItems: 'center',
    },
    actionBtn: {
        alignItems: 'center',
        marginBottom: 20,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        marginTop: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    commentInputContainer: {
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    commentInput: {
        backgroundColor: '#1a1a1a',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#fff',
        fontSize: 15,
    },
    doubleTapHeart: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -35,
        marginLeft: -35,
        width: 70,
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        marginTop: 16,
    },
});

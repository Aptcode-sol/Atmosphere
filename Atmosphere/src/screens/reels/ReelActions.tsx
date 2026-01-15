import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react-native';
import { ReelActionsProps } from './types';
import { styles, COLORS } from './styles';

/**
 * ReelActions - Vertical action buttons for a reel (like, comment, share, save)
 */
const ReelActions: React.FC<ReelActionsProps> = ({
    reel,
    likeLoading,
    saveLoading,
    onLike,
    onComment,
    onShare,
    onSave,
}) => {
    return (
        <View style={styles.actions}>
            {/* Like */}
            <TouchableOpacity
                style={styles.actionBtn}
                onPress={onLike}
                disabled={likeLoading}
            >
                <Heart
                    size={28}
                    color={reel.isLiked ? COLORS.like : "#fff"}
                    fill={reel.isLiked ? COLORS.like : "transparent"}
                />
                <Text style={styles.actionText}>{reel.likesCount}</Text>
            </TouchableOpacity>

            {/* Comment */}
            <TouchableOpacity
                style={styles.actionBtn}
                onPress={onComment}
            >
                <MessageCircle size={26} color="#fff" />
                <Text style={styles.actionText}>{reel.commentsCount}</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
                style={styles.actionBtn}
                onPress={onShare}
            >
                <Send
                    size={26}
                    color={reel.isShared ? COLORS.success : "#fff"}
                />
                <Text style={styles.actionText}>{reel.sharesCount || 0}</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity
                style={styles.actionBtn}
                onPress={onSave}
                disabled={saveLoading}
            >
                <Bookmark
                    size={26}
                    color={"#fff"}
                    fill={reel.isSaved ? "#fff" : "transparent"}
                />
            </TouchableOpacity>
        </View>
    );
};

export default ReelActions;

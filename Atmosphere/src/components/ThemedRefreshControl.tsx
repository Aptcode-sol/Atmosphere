import React, { useContext } from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

interface ThemedRefreshControlProps extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> {
    refreshing: boolean;
    onRefresh: () => void;
    progressViewOffset?: number;
}

/**
 * A themed RefreshControl component that automatically applies
 * consistent styling based on the app's theme context.
 * 
 * Features:
 * - Automatic theme color integration (primary accent, dark background)
 * - Proper progressViewOffset for content below headers
 * - Android colors array support
 * - All standard RefreshControl props supported via spread
 */
const ThemedRefreshControl: React.FC<ThemedRefreshControlProps> = ({
    refreshing,
    onRefresh,
    progressViewOffset = 70,
    ...restProps
}) => {
    const { theme } = useContext(ThemeContext);

    return (
        <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]} // Android
            progressBackgroundColor={theme.cardBackground || '#1a1a1a'}
            progressViewOffset={progressViewOffset}
            {...restProps}
        />
    );
};

export default ThemedRefreshControl;

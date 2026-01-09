// Universal safe area hooks for all phone generations
// Uses react-native-safe-area-context for proper insets on iOS and Android

import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook that returns proper layout padding for the current device
 * Works on all iPhone generations (notch/dynamic island/older) and Android devices
 */
export const useLayoutInsets = () => {
    const insets = useSafeAreaInsets();

    return {
        // Top padding - accounts for status bar, notch, dynamic island
        topInset: insets.top,
        // Bottom padding - accounts for home indicator on iPhone X+, nav bar on Android
        bottomInset: insets.bottom,
        // Left/right for landscape or devices with side notches
        leftInset: insets.left,
        rightInset: insets.right,
        // Combined values for common use cases
        safeTop: insets.top,
        safeBottom: insets.bottom, // Use exact device inset for all phone types
        // Raw insets object for direct use
        insets,
    };
};

export default useLayoutInsets;

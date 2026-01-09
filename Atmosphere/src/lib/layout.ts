// Shared layout constants
import { Dimensions, Platform, StatusBar } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

// Get status bar height dynamically
const getStatusBarHeight = (): number => {
    if (Platform.OS === 'android') {
        return StatusBar.currentHeight || 24;
    }
    // iOS has different status bar heights based on device
    return screenHeight >= 812 ? 44 : 20; // iPhone X and newer vs older iPhones
};

export const STATUS_BAR_HEIGHT = getStatusBarHeight();
export const BOTTOM_NAV_HEIGHT = 0; // leave space for bottom nav / floating controls
export const TOP_PANEL_HEIGHT = STATUS_BAR_HEIGHT; // Dynamic based on device

export default { BOTTOM_NAV_HEIGHT, TOP_PANEL_HEIGHT, STATUS_BAR_HEIGHT };

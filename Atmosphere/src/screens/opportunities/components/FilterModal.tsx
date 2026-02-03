import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { sectors, locations, grantTypes, eventTypes, remoteOptions, employmentOptions } from '../constants';
import styles from '../Opportunities.styles';

interface FilterModalProps {
    visible: boolean;
    onClose: () => void;
    tabType: string;
    filters: any;
    setFilters: (filters: any) => void;
}

function FilterModal({ visible, onClose, tabType, filters, setFilters }: FilterModalProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>('type');

    const textColor = '#f2f2f2';
    const subTextColor = '#888';
    const bgColor = '#111';
    const borderColor = '#333';

    const renderFilterSection = (title: string, key: string, options: string[], currentValue: string) => (
        <View style={styles.filterSection}>
            <TouchableOpacity
                style={[styles.filterHeader, { borderColor }]}
                onPress={() => setExpandedSection(expandedSection === key ? null : key)}
            >
                <Text style={[styles.filterTitle, { color: textColor }]}>
                    {title}: {currentValue === 'all' ? 'All' : currentValue}
                </Text>
                <Text style={[styles.filterChevron, { transform: [{ rotate: expandedSection === key ? '180deg' : '0deg' }] }]}>
                    ▼
                </Text>
            </TouchableOpacity>
            {expandedSection === key && (
                <View style={styles.filterOptions}>
                    {options.map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.filterOption,
                                currentValue === option && styles.filterOptionActive,
                            ]}
                            onPress={() => {
                                setFilters({ ...filters, [key]: option });
                                setExpandedSection(null);
                            }}
                        >
                            <Text
                                style={[
                                    styles.filterOptionText,
                                    { color: currentValue === option ? '#fff' : subTextColor },
                                ]}
                            >
                                {option === 'all' ? 'All' : option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );

    const hasActiveFilters = () => {
        if (tabType === 'Grants') {
            return filters.grantType !== 'all' || filters.grantSector !== 'All Sectors';
        } else if (tabType === 'Events') {
            return filters.eventType !== 'all' || filters.eventSector !== 'All Sectors' || filters.eventLocation !== 'All Locations';
        } else if (tabType === 'Team' || tabType === 'Jobs') {
            return filters.teamSector !== 'All Sectors' || filters.teamLocation !== 'All Locations' ||
                filters.teamRemote !== 'all' || filters.teamEmployment !== 'all';
        }
        return false;
    };

    const clearFilters = () => {
        if (tabType === 'Grants') {
            setFilters({ ...filters, grantType: 'all', grantSector: 'All Sectors' });
        } else if (tabType === 'Events') {
            setFilters({ ...filters, eventType: 'all', eventSector: 'All Sectors', eventLocation: 'All Locations' });
        } else if (tabType === 'Team' || tabType === 'Jobs') {
            setFilters({ ...filters, teamSector: 'All Sectors', teamLocation: 'All Locations', teamRemote: 'all', teamEmployment: 'all' });
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={styles.filterModalOverlay}>
                <View style={[styles.filterModalContent, { backgroundColor: bgColor }]}>
                    <View style={styles.filterModalHeader}>
                        <Text style={[styles.filterModalTitle, { color: textColor }]}>Filters</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={[styles.filterCloseBtn, { color: subTextColor }]}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.filterScrollView}>
                        {tabType === 'Grants' && (
                            <>
                                {renderFilterSection('Type', 'grantType', grantTypes, filters.grantType)}
                                {renderFilterSection('Sector', 'grantSector', sectors, filters.grantSector)}
                            </>
                        )}
                        {tabType === 'Events' && (
                            <>
                                {renderFilterSection('Type', 'eventType', eventTypes, filters.eventType)}
                                {renderFilterSection('Sector', 'eventSector', sectors, filters.eventSector)}
                                {renderFilterSection('Location', 'eventLocation', locations, filters.eventLocation)}
                            </>
                        )}
                        {(tabType === 'Team' || tabType === 'Jobs') && (
                            <>
                                {renderFilterSection('Sector', 'teamSector', sectors, filters.teamSector)}
                                {renderFilterSection('Location', 'teamLocation', locations, filters.teamLocation)}
                                {renderFilterSection('Work Mode', 'teamRemote', remoteOptions, filters.teamRemote)}
                                {renderFilterSection('Employment', 'teamEmployment', employmentOptions, filters.teamEmployment)}
                            </>
                        )}

                        {hasActiveFilters() && (
                            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
                                <Text style={styles.clearFiltersText}>✕ Clear all filters</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

export default FilterModal;

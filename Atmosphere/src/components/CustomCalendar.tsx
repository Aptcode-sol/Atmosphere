import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

// Lightweight custom calendar: shows a simple date picker grid for the current month
// This is intentionally minimal to avoid adding heavy dependencies.

type Props = {
    visible?: boolean;
    value?: Date | null;
    onChange: (d: Date) => void;
    onClose?: () => void;
};

function startOfMonth(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatDay(d: Date) {
    return d.getDate().toString();
}

export default function CustomCalendar({ visible = false, value, onChange, onClose }: Props) {
    const today = value ?? new Date();
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

    const firstDay = startOfMonth(currentMonth);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    const grid: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));

    function prevMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    }
    function nextMonth() {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    }

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
                            <Text>{'<'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.monthText}>{currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
                        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
                            <Text>{'>'}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.weekHeader}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w) => (
                            <Text key={w} style={styles.weekDay}>{w}</Text>
                        ))}
                    </View>
                    <View style={styles.grid}>
                        {grid.map((cell, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.cell, cell && value && cell.toDateString() === value.toDateString() ? styles.selectedCell : null]}
                                disabled={!cell}
                                onPress={() => { if (cell) { onChange(cell); if (onClose) onClose(); } }}
                            >
                                <Text style={styles.cellText}>{cell ? formatDay(cell) : ''}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.footerRow}>
                        <TouchableOpacity onPress={() => { if (onClose) onClose(); }} style={styles.actionBtn}>
                            <Text style={styles.actionText}>Close</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { onChange(new Date()); if (onClose) onClose(); }} style={styles.actionBtnPrimary}>
                            <Text style={styles.actionTextPrimary}>Today</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    card: { width: 320, backgroundColor: '#000000', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#1a1a1a' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    navBtn: { padding: 8 },
    monthText: { fontWeight: '600', color: '#fff' },
    weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    weekDay: { width: 40, textAlign: 'center', fontSize: 12, color: '#999' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    cell: { width: 40, height: 36, justifyContent: 'center', alignItems: 'center', margin: 2, borderRadius: 6, backgroundColor: 'transparent' },
    cellText: { color: '#ddd' },
    selectedCell: { backgroundColor: '#0b63ff' },
    footerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    actionBtn: { padding: 8 },
    actionText: { color: '#bbb' },
    actionBtnPrimary: { padding: 8, backgroundColor: '#0b63ff', borderRadius: 6 },
    actionTextPrimary: { color: '#fff' }
});

/**
 * Utility function to calculate years ago from a date
 */
export const getYearsAgo = (date?: Date | string): string => {
    if (!date) return '';
    const investmentDate = new Date(date);
    const years = new Date().getFullYear() - investmentDate.getFullYear();
    return years > 0 ? `${years} years ago` : 'This year';
};

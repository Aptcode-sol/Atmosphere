import React from 'react';
import HottestStartups from './HottestStartups';

interface TopStartupsProps {
    onOpenProfile?: (userId: string) => void;
}

const TopStartups = ({ onOpenProfile }: TopStartupsProps) => {
    return <HottestStartups onOpenProfile={onOpenProfile} />;
};

export default TopStartups;

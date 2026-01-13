// Industry/Segment tags
export const industryTags = [
    "AI", "ML", "Fintech", "HealthTech", "EV", "SaaS", "E-commerce", "EdTech", "AgriTech",
    "Blockchain", "IoT", "CleanTech", "FoodTech", "PropTech", "InsurTech", "LegalTech",
    "MarTech", "RetailTech", "TravelTech", "Logistics", "Cybersecurity", "Gaming", "Media", "SpaceTech"
];

// Category filters for buy tab
export const categories = [
    "AI", "ML", "DeepTech", "Manufacturing", "Cafe", "B2B", "B2C", "B2B2C",
    "Fintech", "SaaS", "HealthTech", "AgriTech", "D2C", "Logistics", "EV",
    "EdTech", "Robotics", "IoT", "Blockchain", "E-commerce", "FoodTech",
    "PropTech", "InsurTech", "LegalTech", "CleanTech", "BioTech", "Cybersecurity",
    "AR/VR", "Gaming", "Media", "Entertainment", "Travel", "Hospitality",
];

export interface Investment {
    _id?: string;
    companyName: string;
    companyId?: string;
    date?: Date | string;
    amount?: number;
    docs?: string[];
}

export interface InvestorPortfolio {
    _id: string;
    user: {
        _id: string;
        username: string;
        displayName?: string;
        avatarUrl?: string;
    };
    previousInvestments: Investment[];
}

export interface ActiveTrade {
    _id?: string;
    id?: number;
    companyId: string;
    companyName: string;
    companyType?: string[];
    startupUsername?: string;
    description: string;
    imageUrls: string[];
    videoUrl?: string;
    videoThumbnailUrl?: string;
    revenueStatus: 'revenue-generating' | 'pre-revenue';
    companyAge?: string;
    sellingRangeMin: number;
    sellingRangeMax: number;
    selectedIndustries: string[];
    externalLinkHeading?: string;
    externalLinkUrl?: string;
    views?: number;
    saves?: number;
    savedBy?: string[];
    isEdited?: boolean;
    isManualEntry?: boolean;
    user?: any;
    fundingTarget?: number;
}


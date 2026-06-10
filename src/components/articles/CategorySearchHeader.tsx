'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Category } from '@/types';

export interface SubCategory {
    id: string;
    label: string;
}

interface CategorySearchHeaderProps {
    category: Category;
    subCategories: SubCategory[];
    selectedSubCategory: string;
    onSubCategoryChange: (subCategoryId: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    categoryName: string;
    categoryColor: string;
}

export function CategorySearchHeader({
    category,
    subCategories,
    selectedSubCategory,
    onSubCategoryChange,
    searchQuery,
    onSearchChange,
    categoryName,
    categoryColor,
}: CategorySearchHeaderProps) {
    const [showSearch, setShowSearch] = useState(false);

    const handleSearchToggle = () => {
        if (showSearch && searchQuery) {
            onSearchChange('');
        }
        setShowSearch(!showSearch);
    };

    return (
        <div className="mb-6">
            {/* Category Header with Gradient Background */}
            <div
                className="rounded-lg p-6 mb-4 shadow-sm"
                style={{
                    background: `linear-gradient(135deg, ${categoryColor}15 0%, ${categoryColor}05 100%)`,
                    borderLeft: `4px solid ${categoryColor}`,
                }}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                        />
                        <h2 className="font-display text-2xl font-bold text-ink">
                            {categoryName}
                        </h2>
                    </div>

                    {/* Search Icon/Box */}
                    <div className="flex items-center gap-2">
                        {showSearch ? (
                            <div className="flex items-center gap-2 animate-fade-in">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={`Search in ${categoryName}...`}
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="pl-10 pr-4 py-2 w-64 md:w-80 rounded-lg border border-hairline bg-surface text-ink focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleSearchToggle}
                                    className="p-2 rounded-lg text-muted hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-all"
                                    aria-label="Close search"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleSearchToggle}
                                className="p-2 rounded-lg text-muted hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-all flex items-center gap-2"
                                aria-label="Open search"
                            >
                                <Search className="w-5 h-5" />
                                <span className="text-sm font-medium hidden sm:inline">Search</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-Categories Filter */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                    {subCategories.map((subCat) => (
                        <button
                            key={subCat.id}
                            onClick={() => onSubCategoryChange(subCat.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                selectedSubCategory === subCat.id
                                    ? 'text-white'
                                    : 'bg-surface text-ink hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E]'
                            }`}
                            style={{
                                backgroundColor: selectedSubCategory === subCat.id ? categoryColor : undefined,
                            }}
                        >
                            {subCat.label}
                        </button>
                    ))}
                </div>

                {/* Search Results Count */}
                {searchQuery && (
                    <div className="mt-3 text-sm text-muted">
                        Searching for: <span className="font-medium">&quot;{searchQuery}&quot;</span>
                    </div>
                )}
            </div>
        </div>
    );
}

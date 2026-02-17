'use client';

import { useState, useEffect } from 'react';
import { Twitter, Facebook, Linkedin, Share2, Link2, MessageCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui';

interface ShareButtonsProps {
    url: string;
    title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);
    const [canShare, setCanShare] = useState(false);

    useEffect(() => {
        setCanShare('share' in navigator);
    }, []);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    const shareLinks = [
        {
            name: 'Twitter',
            icon: Twitter,
            href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            color: 'hover:bg-sky-500',
            bgColor: 'bg-sky-500/10',
        },
        {
            name: 'Facebook',
            icon: Facebook,
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: 'hover:bg-blue-600',
            bgColor: 'bg-blue-600/10',
        },
        {
            name: 'LinkedIn',
            icon: Linkedin,
            href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
            color: 'hover:bg-blue-700',
            bgColor: 'bg-blue-700/10',
        },
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
            color: 'hover:bg-green-500',
            bgColor: 'bg-green-500/10',
        },
    ];

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            showToast('Link copied to clipboard!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('Failed to copy link', 'error');
        }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url,
            }).catch(() => { });
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-1">Share:</span>

            {shareLinks.map((link) => (
                <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-lg ${link.bgColor} ${link.color} hover:text-white text-gray-600 dark:text-gray-400 transition-all duration-200`}
                    aria-label={`Share on ${link.name}`}
                >
                    <link.icon className="w-4 h-4" />
                </a>
            ))}

            <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-all duration-200 ${copied
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                aria-label="Copy link"
            >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            </button>

            {canShare && (
                <button
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 transition-all duration-200"
                    aria-label="Share"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

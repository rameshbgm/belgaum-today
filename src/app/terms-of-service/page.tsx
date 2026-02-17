import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description:
        'Terms of Service for Belgaum Today — understand the rules and guidelines governing your use of our news aggregation and publishing platform.',
    openGraph: {
        title: 'Terms of Service | Belgaum Today',
        description:
            'Terms of Service for Belgaum Today — rules and guidelines governing your use of our platform.',
    },
};

export default function TermsOfServicePage() {
    return (
        <div className="container mx-auto px-4 py-10 max-w-4xl">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                    <FileText className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Effective Date: February 17, 2026 &nbsp;|&nbsp; Last Updated: February 17, 2026
                </p>
            </div>

            {/* Content */}
            <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400">
                {/* 1. Acceptance of Terms */}
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing and using <strong>Belgaum Today</strong> (available at{' '}
                    <a href="https://belgaum.today" target="_blank" rel="noopener noreferrer">
                        belgaum.today
                    </a>
                    ), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree with
                    any part of these Terms, you must discontinue use of the website immediately.
                </p>
                <p>
                    These Terms apply to all visitors, users, and others who access or use the website. We reserve
                    the right to update or modify these Terms at any time without prior notice. Your continued use
                    of the website after such changes constitutes your acceptance of the new Terms.
                </p>

                {/* 2. Description of Service */}
                <h2>2. Description of Service</h2>
                <p>
                    Belgaum Today is a news aggregation and publishing platform that curates, summarises, and
                    presents news articles from various publicly available sources across categories including
                    India, Business, Technology, Entertainment, Sports, and Belgaum local news.
                </p>
                <p>
                    Our service aggregates content from RSS feeds and other publicly available sources. We use
                    artificial intelligence to analyse, curate, and present relevant news stories. We do not
                    claim ownership of the original content from external sources and provide attribution and
                    links to the original articles wherever applicable.
                </p>

                {/* 3. Use of the Website */}
                <h2>3. Use of the Website</h2>
                <p>You agree to use Belgaum Today only for lawful purposes. You agree not to:</p>
                <ul>
                    <li>
                        Use the website in any way that violates applicable national or international laws or
                        regulations.
                    </li>
                    <li>
                        Attempt to gain unauthorised access to any portion of the website, other accounts,
                        computer systems, or networks connected to the website.
                    </li>
                    <li>
                        Use any automated means (bots, crawlers, scrapers) to access the website for any purpose
                        without our express written permission, except for standard search engine indexing.
                    </li>
                    <li>
                        Interfere with or disrupt the website or servers or networks connected to the website.
                    </li>
                    <li>
                        Reproduce, duplicate, copy, sell, resell, or otherwise exploit any portion of the website
                        without our express written permission.
                    </li>
                    <li>
                        Collect or harvest any personally identifiable information from the website.
                    </li>
                </ul>

                {/* 4. Intellectual Property */}
                <h2>4. Intellectual Property</h2>
                <p>
                    The website design, layout, graphics, logos, icons, and original editorial content created
                    by Belgaum Today are the intellectual property of Belgaum Today and are protected by
                    applicable copyright and trademark laws.
                </p>
                <p>
                    News articles aggregated from external sources remain the intellectual property of their
                    respective owners and publishers. Belgaum Today provides summaries, excerpts, and links to
                    original sources in accordance with fair use principles and applicable copyright laws. Full
                    attribution is provided to the original source for all aggregated content.
                </p>

                {/* 5. RSS Aggregation & Content Disclaimer */}
                <h2 id="disclaimer">5. Content Disclaimer &amp; RSS Aggregation</h2>
                <p>
                    Belgaum Today aggregates news content from multiple third-party sources via RSS feeds and
                    other publicly available methods. While we make every effort to ensure accuracy, we do not
                    guarantee the accuracy, completeness, timeliness, or reliability of any content published or
                    aggregated on our platform.
                </p>
                <ul>
                    <li>
                        <strong>No Editorial Endorsement:</strong> The inclusion of any article on our platform
                        does not constitute an endorsement of the views expressed in that article.
                    </li>
                    <li>
                        <strong>Third-Party Content:</strong> We are not responsible for the content, accuracy, or
                        opinions expressed in articles sourced from third-party publishers.
                    </li>
                    <li>
                        <strong>AI-Generated Content:</strong> Some content on our platform (including summaries,
                        categories, and trending analysis) may be generated or assisted by artificial intelligence.
                        Such content is reviewed for quality but may occasionally contain inaccuracies.
                    </li>
                    <li>
                        <strong>Content Removal:</strong> If you are a content owner and believe that your content
                        has been used improperly, please contact us at{' '}
                        <a href="mailto:ask@belgaum.today">ask@belgaum.today</a> and we will address your
                        concern promptly.
                    </li>
                </ul>

                {/* 6. Advertisements and Third-Party Links */}
                <h2>6. Advertisements and Third-Party Links</h2>
                <p>
                    Belgaum Today displays advertisements served by third-party advertising networks including
                    Google AdSense. We also use analytics and tracking tools such as Google Analytics and Meta
                    Pixel. These services are governed by their own terms and privacy policies.
                </p>
                <p>
                    Our website may contain links to third-party websites. We do not control, endorse, or assume
                    any responsibility for the content, privacy policies, or practices of any third-party websites.
                    You acknowledge and agree that Belgaum Today shall not be liable for any damage or loss caused
                    by or in connection with the use of any third-party content, goods, or services.
                </p>

                {/* 7. User Conduct */}
                <h2>7. User Conduct</h2>
                <p>
                    You are solely responsible for your conduct while using our website. You agree not to post,
                    upload, transmit, or share any content that:
                </p>
                <ul>
                    <li>Is unlawful, harmful, threatening, abusive, or harassing</li>
                    <li>Is defamatory, vulgar, obscene, or invasive of another&rsquo;s privacy</li>
                    <li>Infringes on any patent, trademark, copyright, or other proprietary rights</li>
                    <li>Contains viruses, malware, or any other harmful code</li>
                    <li>Constitutes unsolicited advertising, spam, or promotional material</li>
                </ul>

                {/* 8. Limitation of Liability */}
                <h2>8. Limitation of Liability</h2>
                <p>
                    To the fullest extent permitted by applicable law, Belgaum Today and its owners, operators,
                    contributors, and affiliates shall not be liable for any indirect, incidental, special,
                    consequential, or punitive damages, including but not limited to loss of profits, data,
                    goodwill, or other intangible losses, resulting from:
                </p>
                <ul>
                    <li>Your access to or use of (or inability to access or use) the website</li>
                    <li>Any content obtained from the website</li>
                    <li>Unauthorised access, use, or alteration of your transmissions or content</li>
                    <li>Any errors, inaccuracies, or omissions in the content</li>
                </ul>
                <p>
                    The website is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without
                    warranties of any kind, either express or implied.
                </p>

                {/* 9. Indemnification */}
                <h2>9. Indemnification</h2>
                <p>
                    You agree to indemnify and hold harmless Belgaum Today, its owners, operators, and affiliates
                    from any claims, damages, obligations, losses, liabilities, costs, or debt arising from your
                    use of the website, your violation of these Terms, or your violation of any rights of a third
                    party.
                </p>

                {/* 10. Modifications to Terms */}
                <h2>10. Modifications to Terms</h2>
                <p>
                    We reserve the right to modify these Terms at any time. Changes will be effective immediately
                    upon posting to this page. The &quot;Last Updated&quot; date at the top of this page indicates when
                    these Terms were last revised. We encourage you to review these Terms periodically.
                </p>

                {/* 11. Governing Law */}
                <h2>11. Governing Law</h2>
                <p>
                    These Terms shall be governed and construed in accordance with the laws of India, without
                    regard to its conflict-of-law provisions. Any disputes arising under or in connection with
                    these Terms shall be subject to the exclusive jurisdiction of the courts located in Belgaum
                    (Belagavi), Karnataka, India.
                </p>

                {/* 12. Severability */}
                <h2>12. Severability</h2>
                <p>
                    If any provision of these Terms is found to be unlawful, void, or unenforceable, that
                    provision shall be deemed severable from these Terms and shall not affect the validity and
                    enforceability of the remaining provisions.
                </p>

                {/* 13. Contact */}
                <h2>13. Contact Us</h2>
                <p>
                    If you have any questions about these Terms of Service, please contact us:
                </p>
                <ul>
                    <li>
                        <strong>Email:</strong>{' '}
                        <a href="mailto:ask@belgaum.today">ask@belgaum.today</a>
                    </li>
                    <li>
                        <strong>Website:</strong>{' '}
                        <a href="https://belgaum.today" target="_blank" rel="noopener noreferrer">
                            belgaum.today
                        </a>
                    </li>
                    <li>
                        <strong>Address:</strong> Belgaum (Belagavi), Karnataka, India — 590001
                    </li>
                </ul>

                <hr />

                <p className="text-sm text-gray-500 dark:text-gray-400">
                    These Terms of Service were last reviewed and updated on February 17, 2026.
                </p>
            </article>

            {/* Back to Home */}
            <div className="mt-10 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}

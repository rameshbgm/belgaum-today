import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description:
        'Privacy Policy for Belgaum Today — learn how we collect, use, and protect your personal information, including disclosures for Google AdSense, Google Analytics, and Meta Pixel.',
    openGraph: {
        title: 'Privacy Policy | Belgaum Today',
        description:
            'Privacy Policy for Belgaum Today — learn how we collect, use, and protect your personal information.',
    },
};

export default function PrivacyPolicyPage() {
    return (
        <div className="container mx-auto px-4 py-10 max-w-4xl">
            {/* Header */}
            <div className="mb-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-4">
                    <Shield className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Effective Date: February 17, 2026 &nbsp;|&nbsp; Last Updated: February 17, 2026
                </p>
            </div>

            {/* Content */}
            <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-a:text-blue-600 dark:prose-a:text-blue-400">
                {/* 1. Introduction */}
                <h2>1. Introduction</h2>
                <p>
                    Welcome to <strong>Belgaum Today</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). Belgaum Today
                    is a news aggregation and publishing platform available at{' '}
                    <a href="https://belgaum.today" target="_blank" rel="noopener noreferrer">
                        belgaum.today
                    </a>
                    . We are committed to protecting your privacy and ensuring the security of your personal
                    information. This Privacy Policy explains how we collect, use, disclose, and safeguard your
                    information when you visit our website.
                </p>
                <p>
                    By accessing or using Belgaum Today, you agree to the terms of this Privacy Policy. If you
                    do not agree with the terms of this Privacy Policy, please do not access the website.
                </p>

                {/* 2. Information We Collect */}
                <h2>2. Information We Collect</h2>
                <p>We collect information in the following ways:</p>

                <h3>2.1 Information Collected Automatically</h3>
                <p>
                    When you visit our website, certain information is collected automatically through cookies,
                    web beacons, tracking pixels, and similar technologies. This may include:
                </p>
                <ul>
                    <li>Your IP address (anonymised where possible)</li>
                    <li>Browser type and version</li>
                    <li>Operating system</li>
                    <li>Referring/exit pages and URLs</li>
                    <li>Pages viewed and time spent on those pages</li>
                    <li>Date and time of your visit</li>
                    <li>Device type (desktop, mobile, tablet)</li>
                    <li>Screen resolution and language preference</li>
                    <li>Clickstream data and interaction patterns</li>
                </ul>

                <h3>2.2 Information You Provide Voluntarily</h3>
                <p>
                    We may collect personal information that you voluntarily provide when you contact us, subscribe
                    to newsletters, or interact with certain features. This may include your name, email address,
                    and any message content you submit.
                </p>

                <h3>2.3 Information from Third-Party Services</h3>
                <p>
                    We use third-party services such as Google Analytics, Google AdSense, and Meta Pixel that may
                    independently collect information about you. Please refer to the specific disclosures in
                    Sections 5, 6, and 7 for details.
                </p>

                {/* 3. How We Use Information */}
                <h2>3. How We Use Your Information</h2>
                <p>We use the information we collect for one or more of the following purposes:</p>
                <ul>
                    <li>To operate, maintain, and improve our website and services</li>
                    <li>To personalise your experience and deliver content relevant to your interests</li>
                    <li>To analyse website traffic, usage patterns, and trends</li>
                    <li>To display relevant advertisements through third-party ad networks</li>
                    <li>To monitor and prevent fraud, abuse, and security threats</li>
                    <li>To comply with applicable laws, regulations, and legal processes</li>
                    <li>To communicate with you, including responding to inquiries and sending updates</li>
                    <li>To measure the effectiveness of advertising campaigns</li>
                </ul>

                {/* 4. Cookies and Tracking Technologies */}
                <h2>4. Cookies and Tracking Technologies</h2>
                <p>
                    Belgaum Today uses cookies and similar tracking technologies to enhance your browsing
                    experience. Cookies are small text files stored on your device that help us recognise your
                    browser and capture certain information.
                </p>

                <h3>Types of Cookies We Use</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Cookie Type</th>
                            <th>Purpose</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Essential Cookies</strong></td>
                            <td>Required for the website to function properly (e.g., session management, dark mode preferences).</td>
                        </tr>
                        <tr>
                            <td><strong>Analytics Cookies</strong></td>
                            <td>Help us understand how visitors interact with our website (e.g., Google Analytics).</td>
                        </tr>
                        <tr>
                            <td><strong>Advertising Cookies</strong></td>
                            <td>Used by third-party ad networks to deliver personalised advertisements (e.g., Google AdSense).</td>
                        </tr>
                        <tr>
                            <td><strong>Social Media Cookies</strong></td>
                            <td>Enable tracking of visits from social platforms and measure campaign effectiveness (e.g., Meta Pixel).</td>
                        </tr>
                    </tbody>
                </table>
                <p>
                    You can control or disable cookies through your browser settings. However, disabling cookies
                    may affect the functionality of certain parts of our website.
                </p>

                {/* 5. Google AdSense Disclosure */}
                <h2>5. Google AdSense Disclosure</h2>
                <p>
                    We use Google AdSense, an advertising service provided by Google LLC (&quot;Google&quot;), to display
                    advertisements on our website. Google AdSense uses cookies and web beacons to serve ads based
                    on your prior visits to this website and other websites on the internet.
                </p>
                <ul>
                    <li>
                        Google&rsquo;s use of advertising cookies enables it and its partners to serve ads based on
                        your visit to Belgaum Today and/or other sites on the internet.
                    </li>
                    <li>
                        You may opt out of personalised advertising by visiting{' '}
                        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
                            Google Ads Settings
                        </a>
                        .
                    </li>
                    <li>
                        Alternatively, you can opt out of third-party vendor cookies by visiting the{' '}
                        <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">
                            Network Advertising Initiative opt-out page
                        </a>
                        .
                    </li>
                    <li>
                        Google may collect and process data in accordance with their own{' '}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                            Privacy Policy
                        </a>
                        .
                    </li>
                </ul>
                <p>
                    For more information on how Google uses data from partner sites, please visit{' '}
                    <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
                        How Google Uses Data When You Use Our Partners&rsquo; Sites or Apps
                    </a>
                    .
                </p>

                {/* 6. Meta Pixel (Facebook Pixel) Disclosure */}
                <h2>6. Meta Pixel (Facebook Pixel) Disclosure</h2>
                <p>
                    We use Meta Pixel (formerly Facebook Pixel), a tracking tool provided by Meta Platforms, Inc.
                    (&quot;Meta&quot;), to measure the effectiveness of our advertising, understand user actions on our
                    website, and deliver targeted advertisements on Meta platforms (Facebook and Instagram).
                </p>
                <p>Meta Pixel may collect the following data:</p>
                <ul>
                    <li>HTTP headers — including IP address, browser information, page location, and referrer</li>
                    <li>Pixel-specific data — including Pixel ID and cookies</li>
                    <li>Button click data — including any content, button labels, and pages visited</li>
                    <li>Form field names — when you submit a form on our site (not field values unless specifically configured)</li>
                    <li>
                        Optional values — including conversion value, page type, and other custom data events we define
                    </li>
                </ul>
                <p>
                    This data is used to optimise ad delivery and provide aggregated analytics. You can control
                    the use of your data for advertising purposes through your{' '}
                    <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer">
                        Facebook Ad Preferences
                    </a>
                    . For more information, please review{' '}
                    <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">
                        Meta&rsquo;s Privacy Policy
                    </a>
                    .
                </p>

                {/* 7. Google Analytics Disclosure */}
                <h2>7. Google Analytics Disclosure</h2>
                <p>
                    We use Google Analytics, a web analytics service provided by Google LLC, to collect and analyse
                    information about the use of our website. Google Analytics uses cookies to help us understand
                    how visitors engage with our site.
                </p>
                <p>Google Analytics collects information such as:</p>
                <ul>
                    <li>How often you visit the website</li>
                    <li>What pages you view and how long you stay</li>
                    <li>What other websites you visited before arriving</li>
                    <li>Demographic information (age, gender, interests) where available</li>
                    <li>Geographic location (country, region, city)</li>
                    <li>Device and browser information</li>
                </ul>
                <p>
                    We have enabled IP anonymisation in Google Analytics, which means your IP address is truncated
                    and anonymised before being stored. The information generated by Google Analytics cookies about
                    your use of this website is transmitted to and stored on Google servers.
                </p>
                <p>
                    You can prevent Google Analytics from tracking you by installing the{' '}
                    <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
                        Google Analytics Opt-out Browser Add-on
                    </a>
                    . You can also manage your settings at{' '}
                    <a href="https://myaccount.google.com/data-and-privacy" target="_blank" rel="noopener noreferrer">
                        Google Data &amp; Privacy Settings
                    </a>
                    .
                </p>

                {/* 8. Data Sharing and Third-Party Disclosure */}
                <h2>8. Data Sharing and Third-Party Disclosure</h2>
                <p>
                    We do not sell, trade, or rent your personal information to third parties. We may share
                    aggregated, non-personally identifiable information with third parties for analytics,
                    advertising, and business purposes. We may also disclose your information in the following
                    circumstances:
                </p>
                <ul>
                    <li>
                        <strong>Service Providers:</strong> We share data with trusted third-party service providers
                        (such as Google and Meta) who assist us in operating our website, serving advertisements,
                        and analysing traffic, subject to confidentiality obligations.
                    </li>
                    <li>
                        <strong>Legal Obligations:</strong> We may disclose information if required by law, judicial
                        proceeding, court order, or governmental request.
                    </li>
                    <li>
                        <strong>Protection of Rights:</strong> We may disclose information when necessary to enforce
                        our site policies, protect our rights, or ensure the safety of our users.
                    </li>
                </ul>

                {/* 9. Data Retention */}
                <h2>9. Data Retention</h2>
                <p>
                    We retain your personal information only for as long as necessary to fulfil the purposes
                    described in this Privacy Policy, unless a longer retention period is required or permitted
                    by law. Specifically:
                </p>
                <ul>
                    <li>
                        Analytics data collected through Google Analytics is retained for a maximum of 26 months,
                        after which it is automatically deleted.
                    </li>
                    <li>
                        Server log files (including IP addresses and access logs) are retained for up to 90 days
                        for security monitoring purposes and then deleted.
                    </li>
                    <li>
                        Cookie data expires based on the specific cookie type. Session cookies are deleted when
                        you close your browser; persistent cookies expire at a set date or after a period of inactivity.
                    </li>
                </ul>

                {/* 10. Data Security */}
                <h2>10. Data Security</h2>
                <p>
                    We implement reasonable administrative, technical, and physical security measures to protect
                    your personal information from unauthorised access, alteration, disclosure, or destruction.
                    These measures include:
                </p>
                <ul>
                    <li>SSL/TLS encryption for data transmission</li>
                    <li>Secure server infrastructure with regular updates and patches</li>
                    <li>Access controls limiting data access to authorised personnel</li>
                    <li>Regular monitoring for security vulnerabilities</li>
                </ul>
                <p>
                    However, no method of electronic transmission or storage is 100% secure. While we strive to
                    use commercially acceptable means to protect your personal information, we cannot guarantee
                    its absolute security.
                </p>

                {/* 11. GDPR Rights (European Users) */}
                <h2>11. Your Rights Under the General Data Protection Regulation (GDPR)</h2>
                <p>
                    If you are a resident of the European Economic Area (EEA), you have certain data protection
                    rights under the GDPR. Belgaum Today aims to take reasonable steps to allow you to correct,
                    amend, delete, or limit the use of your personal data. You have the right to:
                </p>
                <ul>
                    <li>
                        <strong>Access:</strong> Request a copy of the personal data we hold about you.
                    </li>
                    <li>
                        <strong>Rectification:</strong> Request that we correct any inaccurate or incomplete personal data.
                    </li>
                    <li>
                        <strong>Erasure:</strong> Request that we delete your personal data, subject to certain exceptions.
                    </li>
                    <li>
                        <strong>Restriction:</strong> Request that we restrict the processing of your personal data.
                    </li>
                    <li>
                        <strong>Data Portability:</strong> Request a copy of your data in a structured, commonly used,
                        machine-readable format.
                    </li>
                    <li>
                        <strong>Objection:</strong> Object to processing of your personal data for direct marketing purposes.
                    </li>
                    <li>
                        <strong>Withdraw Consent:</strong> Withdraw your consent at any time where we relied on your
                        consent to process your personal data.
                    </li>
                </ul>
                <p>
                    To exercise any of these rights, please contact us at{' '}
                    <a href="mailto:ask@belgaum.today">ask@belgaum.today</a>. We will respond to your request
                    within 30 days.
                </p>

                {/* 12. CCPA Rights (California Users) */}
                <h2>12. Your Rights Under the California Consumer Privacy Act (CCPA)</h2>
                <p>
                    If you are a California resident, you have additional rights under the California Consumer
                    Privacy Act (CCPA). These rights include:
                </p>
                <ul>
                    <li>
                        <strong>Right to Know:</strong> You have the right to request that we disclose what personal
                        information we have collected about you, the sources of that information, the purpose for
                        collecting it, and the third parties with whom we share it.
                    </li>
                    <li>
                        <strong>Right to Delete:</strong> You have the right to request the deletion of your personal
                        information, subject to certain exceptions.
                    </li>
                    <li>
                        <strong>Right to Opt-Out:</strong> You have the right to opt out of the sale of your personal
                        information. Belgaum Today does not sell your personal information.
                    </li>
                    <li>
                        <strong>Right to Non-Discrimination:</strong> We will not discriminate against you for
                        exercising any of your CCPA rights.
                    </li>
                </ul>
                <p>
                    To exercise your CCPA rights, please contact us at{' '}
                    <a href="mailto:ask@belgaum.today">ask@belgaum.today</a>.
                </p>

                {/* 13. Children's Information (COPPA) */}
                <h2>13. Children&rsquo;s Information (COPPA Compliance)</h2>
                <p>
                    Belgaum Today does not knowingly collect personal information from children under the age of
                    13 (or under the age of 16 in EEA jurisdictions). Our website and services are not directed
                    to children.
                </p>
                <p>
                    If we learn that we have collected personal information from a child without verification of
                    parental consent, we will take steps to delete that information as quickly as possible. If you
                    believe we have inadvertently collected information from a child, please contact us immediately
                    at <a href="mailto:ask@belgaum.today">ask@belgaum.today</a>.
                </p>

                {/* 14. Consent */}
                <h2>14. Consent to This Policy</h2>
                <p>
                    By using Belgaum Today, you consent to the collection, use, and disclosure of your information
                    as described in this Privacy Policy. If we make material changes to this policy, we will notify
                    you by updating the &quot;Last Updated&quot; date at the top of this page. We encourage you to review
                    this Privacy Policy periodically.
                </p>
                <p>
                    Continued use of our website after any modifications to this Privacy Policy constitutes your
                    acknowledgement of the modifications and your consent to abide by the updated terms.
                </p>

                {/* 15. Contact */}
                <h2>15. How to Contact Us</h2>
                <p>
                    If you have any questions, concerns, or requests regarding this Privacy Policy or our data
                    practices, please contact us:
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
                    This Privacy Policy was last reviewed and updated on February 17, 2026. For questions about
                    specific advertising practices, please refer to the individual disclosures in Sections 5, 6,
                    and 7 above, or contact the respective platform directly.
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

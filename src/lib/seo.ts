/** JSON embedded in a script element must not contain a literal closing tag. */
export function safeJsonLd(value: unknown): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}

import { SITE_URL } from './site-url';

export const publisher = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#publisher`,
    name: 'Belgaum Today',
    alternateName: 'Belagavi Today',
    url: SITE_URL,
    logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/belgaum-today-logo.png` },
};

/**
 * BELGAUM TODAY - MAIN APPLICATION
 * v4.1 - Search Results Priority Sorting
 * 
 * NEW SORT LOGIC:
 * 1. Most recent search results appear FIRST
 * 2. Then remaining news sorted by date (newest first)
 */
(function() {
    'use strict';

    console.log('🚀 Belgaum Today v4.1 - Search Priority Sorting');

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        PROXIES: [
            { name: 'corsproxy', url: 'https://corsproxy.io/?' },
            { name: 'allorigins', url: 'https://api.allorigins.win/raw?url=' },
            { name: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' }
        ],
        NEWS_SOURCES: ['GOOGLE'],
        RSS_URLS: {
            GOOGLE: 'https://news.google.com/rss/search?q={QUERY}&hl=en-IN&gl=IN&ceid=IN:en'
        },
        DEFAULT_FONT: 'Cormorant Garamond',
        DEFAULT_THEME: 'theme-light',
        CACHE_EXPIRY: 5 * 60 * 1000,
        LOADER_TIMEOUT: 15000,
        RETRY_DELAY: 2000,
        MESSAGE_ROTATION_INTERVAL: 3000
    };

    // ==================== DOM & STATE ====================
    const DOM = {
        body: document.body,
        hamburger: document.getElementById('hamburger'),
        headerControls: document.getElementById('headerControls'),
        mainContent: document.getElementById('mainContent'),
        themeSelect: document.getElementById('themeSelect'),
        fontSelect: document.getElementById('fontSelect'),
        increaseFont: document.getElementById('increaseFont'),
        decreaseFont: document.getElementById('decreaseFont'),
        loader: document.getElementById('loader'),
        loaderText: document.getElementById('loaderText'),
        loaderTip: document.getElementById('loaderTip'),
        progressBar: document.getElementById('progressBar'),
        advancedNav: document.getElementById('advancedNav'),
        homeReset: document.getElementById('homeReset'),
        notificationBar: document.getElementById('notificationBar'),
        notificationMessage: document.getElementById('notificationMessage'),
        notificationClose: document.getElementById('notificationClose')
    };

    let currentFontSize = 16;
    let messageInterval, tipInterval, loaderTimeout;
    let currentTopic = 'Belgaum';
    let todayNewsItems = [];
    let historicalNewsItems = [];
    let loadedDates = new Set();
    let fetchInProgress = false;
    let lastSearchTimestamp = null; // NEW: Track last search time

    // ==================== NOTIFICATION SYSTEM ====================
    function showNotification(message, type = 'info') {
        console.log(`📢 Notification: ${message}`);
        DOM.notificationMessage.textContent = message;
        DOM.notificationBar.classList.add('show');
        
        const hideTimeout = setTimeout(() => {
            DOM.notificationBar.classList.remove('show');
        }, 5000);
        
        DOM.notificationClose.onclick = () => {
            clearTimeout(hideTimeout);
            DOM.notificationBar.classList.remove('show');
        };
    }

    // ==================== CACHE ====================
    class SimpleCache {
        constructor(expiryTime = 5 * 60 * 1000) {
            this.expiryTime = expiryTime;
        }
        set(key, value) {
            try {
                const data = { value, expiry: Date.now() + this.expiryTime };
                sessionStorage.setItem(`cache_${key}`, JSON.stringify(data));
            } catch (e) { }
        }
        get(key) {
            try {
                const item = sessionStorage.getItem(`cache_${key}`);
                if (!item) return null;
                const data = JSON.parse(item);
                if (Date.now() > data.expiry) {
                    sessionStorage.removeItem(`cache_${key}`);
                    return null;
                }
                return data.value;
            } catch (e) { return null; }
        }
    }

    const cache = new SimpleCache(CONFIG.CACHE_EXPIRY);

    // ==================== HOME RESET ====================
    DOM.homeReset.addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.hash = 'belgaum';
        location.reload();
    });

    // ==================== UTILITIES ====================
    function extractSourceName(url) {
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname.replace(/^www\./, '');
            const parts = hostname.split('.');
            if (parts.length >= 2) {
                return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
            }
            return hostname;
        } catch (e) { return 'Unknown'; }
    }

    function getTodayDateKey() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    function formatDateLabel(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    const stripHTML = (html) => (new DOMParser().parseFromString(html, 'text/html')).body.textContent || "";

    // ==================== NEW SORTING LOGIC ====================
    function sortNewsWithSearchPriority(items) {
        // Add search timestamp to each item if not present
        const now = Date.now();
        
        return items.sort((a, b) => {
            const aSearchTime = a.searchTimestamp || 0;
            const bSearchTime = b.searchTimestamp || 0;
            
            // If one has search timestamp and other doesn't, prioritize the one with timestamp
            if (aSearchTime && !bSearchTime) return -1;
            if (!aSearchTime && bSearchTime) return 1;
            
            // If both have search timestamps, sort by search time (most recent search first)
            if (aSearchTime && bSearchTime) {
                if (aSearchTime !== bSearchTime) {
                    return bSearchTime - aSearchTime; // Newest search first
                }
            }
            
            // If same search time or both have no search time, sort by publication date
            return new Date(b.pubDate) - new Date(a.pubDate);
        });
    }

    // ==================== LOADER ====================
    const showLoader = () => {
        DOM.loaderText.textContent = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
        DOM.loaderTip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
        DOM.loader.classList.add('active');
        
        DOM.progressBar.style.animation = 'none';
        setTimeout(() => {
            DOM.progressBar.style.animation = 'progressAnimation 2s ease-in-out forwards, gradientShift 3s ease infinite';
        }, 10);
        
        if (messageInterval) clearInterval(messageInterval);
        if (tipInterval) clearInterval(tipInterval);
        if (loaderTimeout) clearTimeout(loaderTimeout);
        
        messageInterval = setInterval(() => {
            DOM.loaderText.style.opacity = 0;
            setTimeout(() => {
                DOM.loaderText.textContent = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
                DOM.loaderText.style.opacity = 1;
            }, 300);
        }, CONFIG.MESSAGE_ROTATION_INTERVAL);
        
        tipInterval = setInterval(() => {
            DOM.loaderTip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
        }, 5000);

        loaderTimeout = setTimeout(() => {
            hideLoader();
            fetchInProgress = false;
            showNotification('⏱️ Request timed out. Please try again.', 'error');
        }, CONFIG.LOADER_TIMEOUT);
    };

    const hideLoader = () => {
        clearInterval(messageInterval);
        clearInterval(tipInterval);
        if (loaderTimeout) clearTimeout(loaderTimeout);
        DOM.loader.classList.remove('active');
    };

    // ==================== RSS PARSING (UPDATED) ====================
    function parseRSSXML(xmlDoc) {
        const items = [];
        const itemElements = xmlDoc.querySelectorAll('item');
        
        console.log(`📰 Parsing ${itemElements.length} RSS items`);
        
        itemElements.forEach((item, index) => {
            const imageUrl = item.querySelector('enclosure')?.getAttribute('url') || 
                           item.querySelector('media\\:thumbnail, thumbnail')?.getAttribute('url') || null;
            
            const link = item.querySelector('link')?.textContent || '';
            const title = item.querySelector('title')?.textContent || '';
            
            // Extract actual source from RSS
            const actualSource = extractActualSource(item);
            
            const newsItem = {
                title: title,
                link: link,
                description: item.querySelector('description')?.textContent || '',
                pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
                thumbnail: imageUrl,
                actualSource: actualSource
            };
            
            items.push(newsItem);
            
            // Debug first few items
            if (index < 2) {
                console.log(`   Item ${index + 1}:`, {
                    title: newsItem.title.substring(0, 50) + '...',
                    source: newsItem.actualSource,
                    link: newsItem.link.substring(0, 50) + '...'
                });
            }
        });
        
        return items;
    }

    // ==================== FETCH WITH PROXY (UPDATED) ====================
    async function fetchWithProxy(proxy, rssUrl) {
        try {
            let fetchUrl = proxy.name === 'rss2json' 
                ? proxy.url + encodeURIComponent(rssUrl)
                : proxy.url + encodeURIComponent(rssUrl);
            
            console.log(`   Trying ${proxy.name}...`);
            const response = await fetch(fetchUrl, { signal: AbortSignal.timeout(10000) });
            
            if (!response.ok) {
                console.warn(`   ⚠️ ${proxy.name} failed: HTTP ${response.status}`);
                return null;
            }
            
            if (proxy.name === 'rss2json') {
                const data = await response.json();
                if (data.status === 'ok' && data.items?.length > 0) {
                    console.log(`   ✓ ${proxy.name} success (${data.items.length} items)`);
                    
                    // Extract source from title for rss2json
                    return data.items.map(item => {
                        let actualSource = 'Unknown';
                        
                        // Try to extract from title (format: "Title - Source")
                        if (item.title) {
                            const titleParts = item.title.split(' - ');
                            if (titleParts.length > 1) {
                                actualSource = titleParts[titleParts.length - 1].trim();
                            }
                        }
                        
                        // Fallback: extract from link if not Google News
                        if (actualSource === 'Unknown' && item.link && !item.link.includes('news.google.com')) {
                            actualSource = extractSourceName(item.link);
                        }
                        
                        return {
                            ...item,
                            actualSource: actualSource
                        };
                    });
                }
            } else {
                const text = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');
                const items = parseRSSXML(xmlDoc);
                if (items.length > 0) {
                    console.log(`   ✓ ${proxy.name} success (${items.length} items)`);
                    return items;
                }
            }
            return null;
        } catch (e) {
            console.warn(`   ⚠️ ${proxy.name} error:`, e.message);
            return null;
        }
    }

    async function fetchFromSourceWithRetry(sourceName, query, dateFilter = null) {
        let rssUrl = CONFIG.RSS_URLS[sourceName]?.replace('{QUERY}', encodeURIComponent(query));
        if (!rssUrl) return [];
        
        if (!dateFilter) dateFilter = getTodayDateKey();
        const dateParam = `+after:${dateFilter}+before:${dateFilter}`;
        rssUrl = rssUrl.replace(encodeURIComponent(query), encodeURIComponent(query + dateParam));
        
        for (const proxy of CONFIG.PROXIES) {
            const items = await fetchWithProxy(proxy, rssUrl);
            if (items && items.length > 0) {
                return items.map(item => ({ ...item, source: sourceName }));
            }
            await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        }
        return [];
    }

    async function fetchNews(query, dateKey = null, isSearch = false) {
        const cacheKey = `${query}_${dateKey || getTodayDateKey()}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            // Add search timestamp if this is a search
            if (isSearch) {
                const timestamp = Date.now();
                return cached.map(item => ({ ...item, searchTimestamp: timestamp }));
            }
            return cached;
        }

        const results = await Promise.allSettled(
            CONFIG.NEWS_SOURCES.map(source => fetchFromSourceWithRetry(source, query, dateKey))
        );

        const items = [];
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                items.push(...result.value);
            }
        });

        // Sort by date within this fetch
        items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        
        // Add search timestamp if this is a search
        if (isSearch) {
            const timestamp = Date.now();
            items.forEach(item => item.searchTimestamp = timestamp);
        }
        
        if (items.length > 0) cache.set(cacheKey, items);
        return items;
    }

// ==================== ADVANCED SEARCH (STACK RESULTS) ====================
function renderAdvancedSearch() {
    // Store reference to existing search form
    const existingSearchForm = document.querySelector('.date-picker-section');
    
    if (!existingSearchForm) {
        // First time rendering - create everything
        DOM.mainContent.innerHTML = '';
        
        const title = document.createElement('h2');
        title.className = 'news-section-title';
        title.textContent = 'Advanced Search';
        DOM.mainContent.appendChild(title);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'search-message';
        messageDiv.textContent = SEARCH_MESSAGES[Math.floor(Math.random() * SEARCH_MESSAGES.length)];
        DOM.mainContent.appendChild(messageDiv);
        
        const section = document.createElement('div');
        section.className = 'date-picker-section';
        section.style.maxWidth = '1200px';
        
        const rowContainer = document.createElement('div');
        rowContainer.className = 'advanced-search-single-row';
        
        // Country Dropdown
        const countrySelect = document.createElement('select');
        countrySelect.id = 'advCountrySelect';
        countrySelect.required = true;
        countrySelect.innerHTML = '<option value="">Select Country *</option>';
        Object.keys(WORLD_LOCATIONS).sort().forEach(country => {
            countrySelect.innerHTML += `<option value="${country}">${country}</option>`;
        });
        
        // City Dropdown
        const citySelect = document.createElement('select');
        citySelect.id = 'advCitySelect';
        citySelect.required = true;
        citySelect.innerHTML = '<option value="">Select City *</option>';
        citySelect.disabled = true;
        
        // Topic Dropdown
        const topicSelect = document.createElement('select');
        topicSelect.id = 'advTopicSelect';
        topicSelect.required = true;
        topicSelect.innerHTML = '<option value="">Select Topic *</option>';
        SEARCH_TOPICS.forEach(topic => {
            topicSelect.innerHTML += `<option value="${topic}">${topic}</option>`;
        });
        
        // Date Input
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.id = 'advDateInput';
        dateInput.max = getTodayDateKey();
        dateInput.value = getTodayDateKey();
        dateInput.required = true;
        
        dateInput.addEventListener('click', function() {
            this.showPicker();
        });
        
        // Search Button
        const searchBtn = document.createElement('button');
        searchBtn.className = 'icon-btn';
        searchBtn.innerHTML = '🔍';
        searchBtn.title = 'Search';
        searchBtn.id = 'advSearchBtn';
        
        // Clear Button
        const clearBtn = document.createElement('button');
        clearBtn.className = 'icon-btn clear-icon-btn';
        clearBtn.innerHTML = '🗑️';
        clearBtn.title = 'Clear Results';
        clearBtn.id = 'advClearBtn';
        
        rowContainer.appendChild(countrySelect);
        rowContainer.appendChild(citySelect);
        rowContainer.appendChild(topicSelect);
        rowContainer.appendChild(dateInput);
        rowContainer.appendChild(searchBtn);
        rowContainer.appendChild(clearBtn);
        
        section.appendChild(rowContainer);
        
        // Country change handler
        countrySelect.addEventListener('change', () => {
            const country = countrySelect.value;
            citySelect.innerHTML = '<option value="">Select City *</option>';
            citySelect.disabled = !country;
            
            if (country && WORLD_LOCATIONS[country]) {
                WORLD_LOCATIONS[country].forEach(city => {
                    citySelect.innerHTML += `<option value="${city}">${city}</option>`;
                });
                citySelect.disabled = false;
            }
            
            messageDiv.textContent = SEARCH_MESSAGES[Math.floor(Math.random() * SEARCH_MESSAGES.length)];
        });
        
        // Search handler
        searchBtn.addEventListener('click', async () => {
            const country = countrySelect.value;
            const city = citySelect.value;
            const topic = topicSelect.value;
            const date = dateInput.value;
            
            if (!country) {
                showNotification('⚠️ Please select a country', 'warning');
                countrySelect.focus();
                return;
            }
            
            if (!city) {
                showNotification('⚠️ Please select a city', 'warning');
                citySelect.focus();
                return;
            }
            
            if (!topic) {
                showNotification('⚠️ Please select a topic', 'warning');
                topicSelect.focus();
                return;
            }
            
            if (!date) {
                showNotification('⚠️ Please select a date', 'warning');
                dateInput.focus();
                return;
            }
            
            let query = `${city} ${country} ${topic}`;
            const uniqueKey = `${date}_${query}`;
            
            if (loadedDates.has(uniqueKey)) {
                showNotification('ℹ️ This search has already been loaded!', 'info');
                return;
            }
            
            searchBtn.disabled = true;
            searchBtn.innerHTML = '⏳';
            showLoader();
            
            const items = await fetchNews(query, date, true);
            
            if (items.length > 0) {
                loadedDates.add(uniqueKey);
                historicalNewsItems.push(...items);
                historicalNewsItems = sortNewsWithSearchPriority(historicalNewsItems);
                
                const location = `${city}, ${country}`;
                
                // Insert result IMMEDIATELY after search form (stack on top)
                renderSearchResultsAfterForm(date, items, `${location} - ${topic}`);
                
                showNotification(`✅ Found ${items.length} articles!`, 'success');
                messageDiv.textContent = SEARCH_MESSAGES[Math.floor(Math.random() * SEARCH_MESSAGES.length)];
            } else {
                showNotification('❌ No news found', 'error');
            }
            
            searchBtn.disabled = false;
            searchBtn.innerHTML = '🔍';
            hideLoader();
        });
        
        // Clear handler
        clearBtn.addEventListener('click', () => {
            loadedDates.clear();
            historicalNewsItems = [];
            lastSearchTimestamp = null;
            
            // Remove all search results (keep form)
            document.querySelectorAll('.date-separator').forEach(el => el.remove());
            document.querySelectorAll('.news-grid').forEach(el => el.remove());
            
            countrySelect.value = '';
            citySelect.value = '';
            citySelect.innerHTML = '<option value="">Select City *</option>';
            citySelect.disabled = true;
            topicSelect.value = '';
            dateInput.value = getTodayDateKey();
            
            messageDiv.textContent = SEARCH_MESSAGES[Math.floor(Math.random() * SEARCH_MESSAGES.length)];
            showNotification('🗑️ All results cleared!', 'info');
        });
        
        DOM.mainContent.appendChild(section);
    }
}

// ==================== RENDER RESULTS AFTER FORM (FIXED ORDER) ====================
function renderSearchResultsAfterForm(dateKey, items, label) {
    // Create separator with label
    const separator = document.createElement('div');
    separator.className = 'date-separator';
    separator.innerHTML = `
        <div class="date-separator-line"></div>
        <div class="date-separator-label">${label} - ${formatDateLabel(dateKey)}</div>
    `;
    
    // Create news grid
    const grid = document.createElement('div');
    grid.className = 'news-grid';
    items.forEach(item => grid.appendChild(createNewsCard(item)));
    
    // Find the search form
    const searchForm = document.querySelector('.date-picker-section');
    
    if (searchForm) {
        // Get the element right after the search form
        const insertAfter = searchForm.nextSibling;
        
        if (insertAfter) {
            // Insert separator first, then grid
            searchForm.parentNode.insertBefore(separator, insertAfter);
            searchForm.parentNode.insertBefore(grid, insertAfter);
        } else {
            // No elements after form, just append
            searchForm.parentNode.appendChild(separator);
            searchForm.parentNode.appendChild(grid);
        }
    } else {
        // Fallback: append to main content
        DOM.mainContent.appendChild(separator);
        DOM.mainContent.appendChild(grid);
    }
}


// Keep the original renderSearchResults for compatibility
function renderSearchResults(dateKey, items, label) {
    renderSearchResultsAfterForm(dateKey, items, label);
}




    // ==================== RENDERING ====================
    function renderTodayNews(items, topic) {
        DOM.mainContent.innerHTML = '';
        
        const title = document.createElement('h2');
        title.className = 'news-section-title';
        title.textContent = `Today's ${topic} News`;
        DOM.mainContent.appendChild(title);
        
        if (items.length === 0) {
            const noNews = document.createElement('p');
            noNews.style.textAlign = 'center';
            noNews.style.padding = '2rem';
            noNews.style.color = 'var(--text-muted)';
            noNews.textContent = `No ${topic} news found`;
            DOM.mainContent.appendChild(noNews);
        } else {
            const grid = document.createElement('div');
            grid.className = 'news-grid';
            items.forEach(item => grid.appendChild(createNewsCard(item)));
            DOM.mainContent.appendChild(grid);
        }
    }

    // ==================== RENDER SEARCH RESULTS ====================
    function renderSearchResults(dateKey, items, label) {
        const separator = document.createElement('div');
        separator.className = 'date-separator';
        separator.innerHTML = `
            <div class="date-separator-line"></div>
            <div class="date-separator-label">${label} - ${formatDateLabel(dateKey)}</div>
        `;
        
        const grid = document.createElement('div');
        grid.className = 'news-grid';
        items.forEach(item => grid.appendChild(createNewsCard(item)));
        
        DOM.mainContent.appendChild(separator);
        DOM.mainContent.appendChild(grid);
    }


    // ==================== CREATE NEWS CARD (UPDATED) ====================
    function createNewsCard(item) {
        const card = document.createElement('div');
        card.className = 'news-card';
        const formattedDate = new Date(item.pubDate).toLocaleDateString();
        
        // Clean up the title - remove source if it's at the end
        let cleanTitle = item.title;
        const titleParts = cleanTitle.split(' - ');
        if (titleParts.length > 1 && titleParts[titleParts.length - 1].trim() === item.actualSource) {
            cleanTitle = titleParts.slice(0, -1).join(' - ');
        }
        
        // Display: "Google News - [Actual Source]"
        const sourceDisplay = item.actualSource && item.actualSource !== 'Unknown' 
            ? `Google News - ${item.actualSource}` 
            : 'Google News';
        
        card.innerHTML = `
            ${item.thumbnail ? `<img src="${item.thumbnail}" alt="" class="news-image" onerror="this.style.display='none'">` : ''}
            <div class="news-content">
                <h3 class="news-title">${stripHTML(cleanTitle)}</h3>
                <p class="news-description">${stripHTML(item.description).substring(0, 120)}</p>
                <div class="news-footer">
                    <span class="news-time">${formattedDate} • ${sourceDisplay}</span>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="read-more">Read More</a>
                </div>
            </div>`;
        return card;
    }



    // ==================== NAVIGATION ====================
    function closeMobileMenu() {
        if (window.innerWidth <= 768) {
            DOM.hamburger.classList.remove('active');
            DOM.headerControls.classList.remove('active');
        }
    }

    function updateActiveNavLink(category) {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-category="${category}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    async function handleNavClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const category = e.target.dataset.category;
        
        if (fetchInProgress) return;
        
        if (category === 'advanced') {
            currentTopic = 'Advanced Search';
            todayNewsItems = [];
            historicalNewsItems = [];
            loadedDates.clear();
            lastSearchTimestamp = null;
            renderAdvancedSearch();
            updateActiveNavLink(category);
            closeMobileMenu();
            window.location.hash = 'advanced';
            return;
        }
        
        currentTopic = category;
        todayNewsItems = [];
        historicalNewsItems = [];
        loadedDates.clear();
        lastSearchTimestamp = null;
        
        fetchInProgress = true;
        showLoader();
        
        todayNewsItems = await fetchNews(category);
        renderTodayNews(todayNewsItems, category);
        
        hideLoader();
        fetchInProgress = false;
        updateActiveNavLink(category);
        closeMobileMenu();
        window.location.hash = category.toLowerCase();
    }

    // ==================== EVENT LISTENERS ====================
    function setupFontDropdown() {
        FONTS.forEach(font => {
            const option = document.createElement('option');
            option.value = font.name;
            option.textContent = font.name;
            option.style.fontFamily = font.family;
            DOM.fontSelect.appendChild(option);
        });
    }

    function setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', handleNavClick);
        });
        
        DOM.hamburger.addEventListener('click', () => {
            DOM.hamburger.classList.toggle('active'); 
            DOM.headerControls.classList.toggle('active'); 
        });
        
        DOM.themeSelect.addEventListener('change', e => {
            DOM.body.className = e.target.value;
            localStorage.setItem('news_theme', e.target.value);
            closeMobileMenu();
        });
        
        DOM.fontSelect.addEventListener('change', e => {
            const fontObj = FONTS.find(f => f.name === e.target.value);
            if (fontObj) {
                DOM.body.style.fontFamily = fontObj.family;
                localStorage.setItem('news_font', e.target.value);
            }
            closeMobileMenu();
        });
        
        DOM.increaseFont.addEventListener('click', () => {
            currentFontSize = Math.min(24, currentFontSize + 1);
            document.documentElement.style.fontSize = `${currentFontSize}px`;
            localStorage.setItem('news_fontSize', currentFontSize);
            closeMobileMenu();
        });
        
        DOM.decreaseFont.addEventListener('click', () => {
            currentFontSize = Math.max(12, currentFontSize - 1);
            document.documentElement.style.fontSize = `${currentFontSize}px`;
            localStorage.setItem('news_fontSize', currentFontSize);
            closeMobileMenu();
        });
    }

    // ==================== EXTRACT ACTUAL SOURCE FROM RSS ====================
    function extractActualSource(item) {
        // Try to get source from RSS feed's <source> tag
        const sourceElement = item.querySelector('source');
        if (sourceElement) {
            return sourceElement.textContent || sourceElement.getAttribute('url');
        }
        
        // Try to extract from title (Google News format: "Title - Source")
        const title = item.querySelector('title')?.textContent || '';
        const titleParts = title.split(' - ');
        if (titleParts.length > 1) {
            return titleParts[titleParts.length - 1].trim();
        }
        
        // Fallback: Extract from link URL
        const link = item.querySelector('link')?.textContent || '';
        if (link && !link.includes('news.google.com')) {
            return extractSourceName(link);
        }
        
        return 'Unknown';
    }

    // ==================== INITIALIZATION ====================
    async function init() {
        console.log('🎬 Initializing v4.1 - Search Priority Sorting...');
        
        sessionStorage.clear();
        setupFontDropdown();
        
        const savedTheme = localStorage.getItem('news_theme') || CONFIG.DEFAULT_THEME;
        const savedFont = localStorage.getItem('news_font') || CONFIG.DEFAULT_FONT;
        const savedSize = parseInt(localStorage.getItem('news_fontSize')) || 16;
        
        DOM.body.className = savedTheme;
        const fontObj = FONTS.find(f => f.name === savedFont);
        if (fontObj) DOM.body.style.fontFamily = fontObj.family;
        document.documentElement.style.fontSize = `${savedSize}px`;
        currentFontSize = savedSize;
        
        DOM.themeSelect.value = savedTheme;
        DOM.fontSelect.value = savedFont;
        
        fetchInProgress = true;
        showLoader();
        
        todayNewsItems = await fetchNews('Belgaum');
        renderTodayNews(todayNewsItems, 'Belgaum');
        
        hideLoader();
        fetchInProgress = false;
        updateActiveNavLink('Belgaum');
        
        setupEventListeners();
        
        if (!window.location.hash || window.location.hash === '#') {
            window.location.hash = 'belgaum';
        }
        
        console.log('✅ v4.1 Ready! Search results now appear first!');
    }

    init();
})();

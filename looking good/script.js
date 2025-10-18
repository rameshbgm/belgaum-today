/**
 * BELGAUM TODAY - FINAL PRODUCTION VERSION
 * Features: Disabled Preferred News, Timeout countdown redirect, Hash routing
 */
(function() {
    'use strict';

    // ==================== CONFIGURATION ====================
    const CONFIG = {
        PROXIES: [
            { name: 'rss2json', url: 'https://api.rss2json.com/v1/api.json?rss_url=' },
            { name: 'corsproxy', url: 'https://corsproxy.io/?' }
        ],
        NEWS_SOURCES: ['GOOGLE', 'BING'],
        RSS_URLS: {
            GOOGLE: 'https://news.google.com/rss/search?q={QUERY}&hl=en-IN&gl=IN&ceid=IN:en',
            BING: 'https://www.bing.com/news/search?q={QUERY}&format=rss'
        },
        DEFAULT_COUNTRY: 'India',
        DEFAULT_CITY: 'Belgaum',
        DEFAULT_FONT: 'Cormorant Garamond',
        DEFAULT_THEME: 'theme-light',
        MAX_ITEMS_INITIAL: 20,
        MAX_ITEMS_LOAD_MORE: 15,
        CACHE_EXPIRY: 30 * 60 * 1000,
        MAX_CACHE_SIZE: 50,
        LOADER_TIMEOUT: 15000, // 15 seconds
        REDIRECT_COUNTDOWN: 5 // 5 seconds
    };

    // ==================== WORLDWIDE LOCATIONS (SORTED) ====================
    const COUNTRIES_CITIES = {
        "Afghanistan": ["Herat", "Kabul", "Kandahar"],
        "Argentina": ["Buenos Aires", "Córdoba", "Rosario"],
        "Australia": ["Adelaide", "Brisbane", "Melbourne", "Perth", "Sydney"],
        "Austria": ["Graz", "Linz", "Vienna"],
        "Bangladesh": ["Chittagong", "Dhaka", "Khulna"],
        "Belgium": ["Antwerp", "Brussels", "Ghent"],
        "Brazil": ["Brasília", "Rio de Janeiro", "São Paulo"],
        "Canada": ["Calgary", "Montreal", "Toronto", "Vancouver"],
        "Chile": ["Santiago", "Valparaíso"],
        "China": ["Beijing", "Guangzhou", "Shanghai"],
        "Colombia": ["Bogotá", "Cali", "Medellín"],
        "Denmark": ["Aarhus", "Copenhagen"],
        "Egypt": ["Alexandria", "Cairo"],
        "Finland": ["Helsinki", "Tampere"],
        "France": ["Lyon", "Marseille", "Paris", "Toulouse"],
        "Germany": ["Berlin", "Cologne", "Hamburg", "Munich"],
        "Greece": ["Athens", "Thessaloniki"],
        "India": ["Ahmedabad", "Belgaum", "Bengaluru", "Chennai", "Delhi", "Hyderabad", "Jaipur", "Kolkata", "Mumbai", "Pune"],
        "Indonesia": ["Jakarta", "Surabaya"],
        "Ireland": ["Cork", "Dublin"],
        "Israel": ["Jerusalem", "Tel Aviv"],
        "Italy": ["Milan", "Naples", "Rome"],
        "Japan": ["Osaka", "Tokyo", "Yokohama"],
        "Malaysia": ["George Town", "Kuala Lumpur"],
        "Mexico": ["Guadalajara", "Mexico City"],
        "Netherlands": ["Amsterdam", "Rotterdam", "The Hague"],
        "New Zealand": ["Auckland", "Wellington"],
        "Norway": ["Bergen", "Oslo"],
        "Pakistan": ["Karachi", "Lahore"],
        "Philippines": ["Manila", "Quezon City"],
        "Poland": ["Kraków", "Warsaw"],
        "Portugal": ["Lisbon", "Porto"],
        "Russia": ["Moscow", "Saint Petersburg"],
        "Saudi Arabia": ["Jeddah", "Riyadh"],
        "Singapore": ["Singapore"],
        "South Africa": ["Cape Town", "Johannesburg"],
        "South Korea": ["Busan", "Seoul"],
        "Spain": ["Barcelona", "Madrid", "Valencia"],
        "Sweden": ["Gothenburg", "Stockholm"],
        "Switzerland": ["Basel", "Geneva", "Zurich"],
        "Thailand": ["Bangkok", "Chiang Mai"],
        "Turkey": ["Ankara", "Istanbul"],
        "UAE": ["Abu Dhabi", "Dubai"],
        "United Kingdom": ["Birmingham", "Glasgow", "London", "Manchester"],
        "United States": ["Chicago", "Houston", "Los Angeles", "New York", "Phoenix"],
        "Vietnam": ["Hanoi", "Ho Chi Minh City"]
    };

    const FONTS = [
        { name: "Abril Fatface", family: "'Abril Fatface', serif" },
        { name: "Bitter", family: "'Bitter', serif" },
        { name: "Cormorant Garamond", family: "'Cormorant Garamond', serif" },
        { name: "Crimson Text", family: "'Crimson Text', serif" },
        { name: "Dancing Script", family: "'Dancing Script', cursive" },
        { name: "EB Garamond", family: "'EB Garamond', serif" },
        { name: "Georgia", family: "'Georgia', serif" },
        { name: "Indie Flower", family: "'Indie Flower', cursive" },
        { name: "Lora", family: "'Lora', serif" },
        { name: "Merriweather", family: "'Merriweather', serif" },
        { name: "Montserrat", family: "'Montserrat', sans-serif" },
        { name: "Open Sans", family: "'Open Sans', sans-serif" },
        { name: "Pacifico", family: "'Pacifico', cursive" },
        { name: "Playfair Display", family: "'Playfair Display', serif" },
        { name: "Raleway", family: "'Raleway', sans-serif" },
        { name: "Roboto", family: "'Roboto', sans-serif" }
    ];

    const FUNNY_MESSAGES = ["Grabbing chai with reporters...", "Negotiating with the news servers...", "Polishing the headlines...", "Fact-checking politicians..."];
    const TIPS = ["Tip: You can sip coffee while we fetch stories ☕", "Tip: Stay hydrated 💧", "Tip: Stretch while waiting 🤸", "Tip: Take a deep breath 🧘"];

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
        preferredNav: document.getElementById('preferredNav'),
        countrySelect: document.getElementById('countrySelect'),
        citySelect: document.getElementById('citySelect')
    };

    let currentFontSize = 16;
    let messageInterval, tipInterval, loaderTimeout;
    let currentQuery = '';
    let currentOffset = 0;
    let allNewsItems = [];
    let loadedSources = new Set();
    let fetchInProgress = false;

    // ==================== CACHE MANAGEMENT ====================
    class CacheManager {
        constructor(maxSize = 50, expiryTime = 30 * 60 * 1000) {
            this.maxSize = maxSize;
            this.expiryTime = expiryTime;
        }

        set(key, value) {
            try {
                const data = { value, timestamp: Date.now(), expiry: Date.now() + this.expiryTime };
                sessionStorage.setItem(key, JSON.stringify(data));
                this.cleanup();
            } catch (e) { }
        }

        get(key) {
            try {
                const item = sessionStorage.getItem(key);
                if (!item) return null;
                const data = JSON.parse(item);
                if (Date.now() > data.expiry) {
                    sessionStorage.removeItem(key);
                    return null;
                }
                return data.value;
            } catch (e) { return null; }
        }

        cleanup() {
            try {
                const keys = Object.keys(sessionStorage).filter(k => k.startsWith('news_'));
                if (keys.length > this.maxSize) {
                    const sorted = keys.map(k => {
                        const item = JSON.parse(sessionStorage.getItem(k));
                        return { key: k, timestamp: item.timestamp };
                    }).sort((a, b) => a.timestamp - b.timestamp);
                    sorted.slice(0, keys.length - this.maxSize).forEach(item => sessionStorage.removeItem(item.key));
                }
            } catch (e) { }
        }

        clearAll() {
            try {
                const keys = Object.keys(sessionStorage);
                keys.filter(k => k.startsWith('news_')).forEach(k => sessionStorage.removeItem(k));
                console.log('Session cache cleared');
            } catch (e) { }
        }
    }

    const cache = new CacheManager(CONFIG.MAX_CACHE_SIZE, CONFIG.CACHE_EXPIRY);

    // ==================== COUNTDOWN REDIRECT ====================
    function startCountdownRedirect(seconds) {
        let remaining = seconds;
        const countdownEl = document.getElementById('countdown');
        
        const interval = setInterval(() => {
            remaining--;
            if (countdownEl) {
                countdownEl.textContent = remaining;
            }
            
            if (remaining <= 0) {
                clearInterval(interval);
                window.location.hash = 'belgaum';
                location.reload();
            }
        }, 1000);
    }

    // ==================== LOADER WITH AUTO-TIMEOUT ====================
    const showLoader = () => {
        DOM.loaderText.textContent = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
        DOM.loaderTip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
        DOM.loader.classList.add('active');
        
        // Reset progress bar
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
            }, 500);
        }, 6000);
        
        tipInterval = setInterval(() => {
            DOM.loaderTip.textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
        }, 8000);

        // AUTO-TIMEOUT: Hide loader after 15 seconds and show countdown
        loaderTimeout = setTimeout(() => {
            console.warn('Loader timeout - clearing cache and redirecting');
            hideLoader();
            cache.clearAll();
            sessionStorage.clear();
            fetchInProgress = false;
            DOM.mainContent.innerHTML = `
                <h2 class="section-title">⏱️ Request Timed Out</h2>
                <p>The news feed took too long to load. Cache has been cleared.</p>
                <p style="font-size: 1.2rem; margin-top: 1.5rem;">
                    Redirecting to <strong>Belgaum</strong> page in <span id="countdown" style="color: var(--accent-color); font-weight: bold;">${CONFIG.REDIRECT_COUNTDOWN}</span> seconds...
                </p>
            `;
            startCountdownRedirect(CONFIG.REDIRECT_COUNTDOWN);
        }, CONFIG.LOADER_TIMEOUT);
    };

    const hideLoader = () => {
        clearInterval(messageInterval);
        clearInterval(tipInterval);
        if (loaderTimeout) clearTimeout(loaderTimeout);
        DOM.loader.classList.remove('active');
    };

    const stripHTML = (html) => (new DOMParser().parseFromString(html, 'text/html')).body.textContent || "";

    // ==================== SESSION CLEANUP ON PAGE CLOSE ====================
    window.addEventListener('beforeunload', () => {
        sessionStorage.clear();
        console.log('Session data cleared on page close');
    });

    // ==================== RSS FETCHING ====================
    function parseRSSXML(xmlDoc) {
        const items = [];
        const itemElements = xmlDoc.querySelectorAll('item');
        itemElements.forEach(item => {
            const imageUrl = item.querySelector('enclosure')?.getAttribute('url') || 
                           item.querySelector('media\\:thumbnail, thumbnail')?.getAttribute('url') || null;
            items.push({
                title: item.querySelector('title')?.textContent || '',
                link: item.querySelector('link')?.textContent || '',
                description: item.querySelector('description')?.textContent || '',
                pubDate: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
                thumbnail: imageUrl
            });
        });
        return items;
    }

    async function fetchWithProxy(proxy, rssUrl) {
        try {
            let fetchUrl;
            if (proxy.name === 'rss2json') {
                fetchUrl = proxy.url + encodeURIComponent(rssUrl);
            } else {
                fetchUrl = proxy.url + encodeURIComponent(rssUrl);
            }
            
            const response = await fetch(fetchUrl, { signal: AbortSignal.timeout(15000) });
            if (!response.ok) return null;
            
            if (proxy.name === 'rss2json') {
                const data = await response.json();
                if (data.status === 'ok' && data.items?.length > 0) {
                    return data.items;
                }
            } else {
                const text = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');
                const items = parseRSSXML(xmlDoc);
                if (items.length > 0) return items;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    async function fetchFromSource(sourceName, query) {
        const rssUrl = CONFIG.RSS_URLS[sourceName]?.replace('{QUERY}', encodeURIComponent(query));
        if (!rssUrl) return [];

        for (const proxy of CONFIG.PROXIES) {
            const items = await fetchWithProxy(proxy, rssUrl);
            if (items && items.length > 0) {
                return items.map(item => ({ ...item, source: sourceName }));
            }
        }
        
        return [];
    }

    async function fetchNewsParallel(query) {
        if (fetchInProgress) return allNewsItems;

        const cacheKey = `news_${query}`;
        const cached = cache.get(cacheKey);
        if (cached) {
            allNewsItems = cached;
            loadedSources = new Set(cached.map(item => item.source));
            return cached;
        }

        fetchInProgress = true;
        loadedSources.clear();
        let firstBatchShown = false;

        try {
            const promises = CONFIG.NEWS_SOURCES.map(source => 
                fetchFromSource(source, query).then(items => {
                    if (items.length > 0) {
                        loadedSources.add(source);
                        
                        if (!firstBatchShown) {
                            firstBatchShown = true;
                            allNewsItems = items;
                            renderNews(allNewsItems, query);
                            hideLoader();
                        } else {
                            allNewsItems.push(...items);
                            allNewsItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                            renderNews(allNewsItems, query, true);
                        }
                    }
                    return items;
                })
            );

            await Promise.all(promises);

            if (allNewsItems.length > 0) {
                cache.set(cacheKey, allNewsItems);
            } else {
                hideLoader();
                DOM.mainContent.innerHTML = `<h2 class="section-title">No news found for "${query}"</h2><p>Please try another location.</p>`;
            }
        } finally {
            fetchInProgress = false;
        }
        
        return allNewsItems;
    }

    // ==================== RENDERING ====================
    function renderNews(items, category, append = false) {
        if (!append) {
            DOM.mainContent.innerHTML = '';
            const title = document.createElement('h2');
            title.className = 'section-title';
            title.textContent = `${category} News`;
            DOM.mainContent.appendChild(title);
        }

        if (items.length === 0 && !append) {
            DOM.mainContent.innerHTML += `<p>No news found for "${category}".</p>`;
            return;
        }

        let grid = document.querySelector('.news-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.className = 'news-grid';
            DOM.mainContent.appendChild(grid);
        }

        const startIndex = append ? grid.children.length : 0;
        const itemsToShow = items.slice(startIndex, startIndex + (append ? CONFIG.MAX_ITEMS_LOAD_MORE : CONFIG.MAX_ITEMS_INITIAL));
        
        itemsToShow.forEach(item => {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.innerHTML = `
                ${item.thumbnail ? `<img src="${item.thumbnail}" alt="" class="news-image" onerror="this.style.display='none'">` : ''}
                <div class="news-content">
                    ${item.source ? `<div class="news-source">Source: ${item.source}</div>` : ''}
                    <h3 class="news-title">${stripHTML(item.title)}</h3>
                    <p class="news-description">${stripHTML(item.description).substring(0, 120)}...</p>
                    <div class="news-footer">
                        <span class="news-time">${new Date(item.pubDate).toLocaleDateString()}</span>
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="read-more">Read More</a>
                    </div>
                </div>`;
            grid.appendChild(card);
        });

        currentOffset = grid.children.length;

        if (currentOffset < items.length) {
            addLoadMoreButton(items, category);
        } else {
            removeLoadMoreButton();
        }
    }

    function addLoadMoreButton(items, category) {
        removeLoadMoreButton();
        
        const container = document.createElement('div');
        container.className = 'load-more-container';
        container.id = 'loadMoreContainer';
        
        const button = document.createElement('button');
        button.className = 'load-more-btn';
        const remaining = items.length - currentOffset;
        button.textContent = `Load More (${remaining} remaining)`;
        
        button.onclick = async () => {
            button.disabled = true;
            button.textContent = 'Loading...';
            renderNews(items, category, true);
        };
        
        container.appendChild(button);
        DOM.mainContent.appendChild(container);
    }

    function removeLoadMoreButton() {
        const existing = document.getElementById('loadMoreContainer');
        if (existing) existing.remove();
    }

    // ==================== HASH ROUTING (EXCLUDING PREFERRED) ====================
    function updateHash(category) {
        if (category !== 'preferred') {
            window.location.hash = category.toLowerCase().replace(/\s+/g, '-');
        }
    }

    function handleHashChange() {
        const hash = window.location.hash.slice(1);
        if (!hash || hash === 'preferred') return;
        
        const category = hash.replace(/-/g, ' ');
        const navLink = Array.from(document.querySelectorAll('.nav-link')).find(link => 
            link.dataset.category.toLowerCase() === category.toLowerCase()
        );
        
        if (navLink && navLink.dataset.category !== 'preferred') {
            navLink.click();
        }
    }

    window.addEventListener('hashchange', handleHashChange);

    // ==================== UI & EVENT HANDLING ====================
    function updateActiveNavLink(category) {
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        const activeLink = document.querySelector(`.nav-link[data-category="${category}"]`);
        if (activeLink) activeLink.classList.add('active');
    }

    async function handleNavClick(e) {
        e.preventDefault();
        
        const category = e.target.dataset.category;
        
        // DISABLED: Preferred News - Do nothing on click
        if (category === 'preferred') {
            console.log('Preferred News is disabled');
            return;
        }
        
        if (fetchInProgress) return;
        
        // Update hash for routing (excluding preferred)
        updateHash(category);
        
        const query = category;
        
        if (query === currentQuery) return;
        
        currentQuery = query;
        currentOffset = 0;
        allNewsItems = [];
        
        showLoader();
        await fetchNewsParallel(query);
        updateActiveNavLink(category);
        DOM.hamburger.classList.remove('active');
        DOM.headerControls.classList.remove('active');
    }

    function setupDropdowns() {
        const sortedCountries = Object.keys(COUNTRIES_CITIES).sort();
        
        DOM.countrySelect.innerHTML = '<option value="">Select Country</option>';
        sortedCountries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            DOM.countrySelect.appendChild(option);
        });

        DOM.citySelect.innerHTML = '<option value="">Select City</option>';

        DOM.countrySelect.addEventListener('change', async (e) => {
            const country = e.target.value;
            DOM.citySelect.innerHTML = '<option value="">Select City</option>';
            
            if (country) {
                const cities = COUNTRIES_CITIES[country] || [];
                cities.forEach(city => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    DOM.citySelect.appendChild(option);
                });
                
                DOM.preferredNav.textContent = country;
                
                if (fetchInProgress) return;
                
                currentQuery = country;
                currentOffset = 0;
                allNewsItems = [];
                
                showLoader();
                await fetchNewsParallel(country);
            }
        });

        DOM.citySelect.addEventListener('change', async (e) => {
            const city = e.target.value;
            if (!city || fetchInProgress) return;
            
            currentQuery = city;
            currentOffset = 0;
            allNewsItems = [];
            
            showLoader();
            await fetchNewsParallel(city);
        });

        DOM.countrySelect.value = CONFIG.DEFAULT_COUNTRY;
        const defaultCities = COUNTRIES_CITIES[CONFIG.DEFAULT_COUNTRY];
        defaultCities.forEach(city => {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            DOM.citySelect.appendChild(option);
        });
        DOM.citySelect.value = CONFIG.DEFAULT_CITY;
    }

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
            // Disable Preferred News link
            if (link.dataset.category === 'preferred') {
                link.style.opacity = '0.5';
                link.style.cursor = 'not-allowed';
                link.style.pointerEvents = 'none';
            }
            link.addEventListener('click', handleNavClick);
        });
        
        DOM.hamburger.addEventListener('click', () => { 
            DOM.hamburger.classList.toggle('active'); 
            DOM.headerControls.classList.toggle('active'); 
        });
        DOM.themeSelect.addEventListener('change', e => setTheme(e.target.value));
        DOM.fontSelect.addEventListener('change', e => setFont(e.target.value));
        DOM.increaseFont.addEventListener('click', () => setFontSize(currentFontSize + 1));
        DOM.decreaseFont.addEventListener('click', () => setFontSize(currentFontSize - 1));
    }

    // ==================== PREFERENCES ====================
    const setTheme = (theme) => { DOM.body.className = theme; localStorage.setItem('news_theme', theme); };
    const setFont = (fontName) => {
        const fontObj = FONTS.find(f => f.name === fontName);
        if (fontObj) {
            DOM.body.style.fontFamily = fontObj.family;
            localStorage.setItem('news_font', fontName);
        }
    };
    function setFontSize(size) { 
        currentFontSize = Math.max(12, Math.min(24, size)); 
        document.documentElement.style.fontSize = `${currentFontSize}px`; 
        localStorage.setItem('news_fontSize', currentFontSize); 
    }

    // ==================== INITIALIZATION ====================
    async function init() {
        setupFontDropdown();
        
        const savedTheme = localStorage.getItem('news_theme') || CONFIG.DEFAULT_THEME;
        const savedFont = localStorage.getItem('news_font') || CONFIG.DEFAULT_FONT;
        const savedSize = parseInt(localStorage.getItem('news_fontSize')) || 16;
        
        setTheme(savedTheme);
        setFont(savedFont);
        setFontSize(savedSize);
        
        DOM.themeSelect.value = savedTheme;
        DOM.fontSelect.value = savedFont;

        setupDropdowns();
        
        showLoader();
        currentQuery = CONFIG.DEFAULT_CITY;
        await fetchNewsParallel(CONFIG.DEFAULT_CITY);
        
        setupEventListeners();
        
        // Handle initial hash if present (excluding preferred)
        if (window.location.hash && window.location.hash !== '#preferred') {
            handleHashChange();
        } else {
            updateHash('Belgaum');
        }
    }

    init();
})();

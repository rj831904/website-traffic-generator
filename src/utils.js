import { log } from 'crawlee';

export const DEFAULT_REFERRERS = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://t.co/',
    'https://www.facebook.com/',
    'https://www.linkedin.com/',
    'https://duckduckgo.com/',
    'https://www.reddit.com/',
    'https://news.ycombinator.com/',
    'https://search.yahoo.com/',
];

export const DESKTOP_DEVICES = [
    {
        name: 'Desktop Chrome Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        isMobile: false,
    },
    {
        name: 'Desktop Chrome macOS',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        viewport: { width: 1440, height: 900 },
        isMobile: false,
    },
    {
        name: 'Desktop Firefox Windows',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
        viewport: { width: 1366, height: 768 },
        isMobile: false,
    },
];

export const MOBILE_DEVICES = [
    {
        name: 'Mobile Safari iPhone 14',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
        viewport: { width: 390, height: 844 },
        isMobile: true,
    },
    {
        name: 'Mobile Chrome Android Pixel 7',
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
        viewport: { width: 412, height: 915 },
        isMobile: true,
    },
];

/**
 * Pick a random element from an array
 */
export function getRandomElement(arr) {
    if (!arr || arr.length === 0) return null;
    const index = Math.floor(Math.random() * arr.length);
    return arr[index];
}

/**
 * Resolve device profile based on user preference
 */
export function resolveDevice(devicePreference) {
    if (devicePreference === 'DESKTOP') {
        return getRandomElement(DESKTOP_DEVICES);
    }
    if (devicePreference === 'MOBILE') {
        return getRandomElement(MOBILE_DEVICES);
    }
    const all = [...DESKTOP_DEVICES, ...MOBILE_DEVICES];
    return getRandomElement(all);
}

/**
 * Resolve referrer based on custom list
 */
export function resolveReferrer(customReferrers) {
    const list = customReferrers && customReferrers.length > 0 ? customReferrers : DEFAULT_REFERRERS;
    return getRandomElement(list);
}

/**
 * Simulate human scrolling and reading interactions
 */
export async function simulateHumanInteraction(page, dwellTimeSeconds) {
    const endTime = Date.now() + (dwellTimeSeconds * 1000);
    log.info(`[Human Simulation] Starting interaction for ${dwellTimeSeconds}s`);

    try {
        while (Date.now() < endTime) {
            // Random scroll distance between 150px and 500px
            const scrollDelta = Math.floor(Math.random() * 350) + 150;
            // 85% chance scroll down, 15% scroll up to mimic reading
            const direction = Math.random() < 0.85 ? 1 : -1;

            await page.evaluate(({ delta, dir }) => {
                window.scrollBy({
                    top: delta * dir,
                    left: 0,
                    behavior: 'smooth',
                });
            }, { delta: scrollDelta, dir: direction }).catch(() => {});

            // Random reading pause between 1.5s and 3.5s
            const pauseMs = Math.floor(Math.random() * 2000) + 1500;
            const remaining = endTime - Date.now();
            if (remaining <= 0) break;

            await new Promise((resolve) => setTimeout(resolve, Math.min(pauseMs, remaining)));
        }
    } catch (err) {
        log.warning(`[Human Simulation] Notice: ${err.message}`);
    }
}

/**
 * Handle YouTube video playback and consent dialogs
 */
export async function handleYouTubePlayer(page, dwellTimeSeconds) {
    log.info('[YouTube Watcher] Attempting to handle cookie prompts and start playback');
    try {
        // Wait for page load
        await page.waitForLoadState('domcontentloaded');

        // Dismiss common YouTube consent / cookie banners
        const consentSelectors = [
            'button[aria-label*="Accept"]',
            'button[aria-label*="Agree"]',
            'button[aria-label*="accept"]',
            'form[action*="consent"] button',
            '.yt-spec-button-shape-next--filled',
        ];

        for (const selector of consentSelectors) {
            const consentBtn = page.locator(selector).first();
            if (await consentBtn.isVisible({ timeout: 2500 }).catch(() => false)) {
                log.info(`[YouTube Watcher] Clicking consent button: ${selector}`);
                await consentBtn.click().catch(() => {});
                await page.waitForTimeout(1000);
                break;
            }
        }

        // Click play button if needed
        const playSelectors = [
            'button.ytp-large-play-button',
            'button.ytp-play-button',
            '#movie_player',
        ];

        for (const sel of playSelectors) {
            const btn = page.locator(sel).first();
            if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
                log.info(`[YouTube Watcher] Triggering play via selector: ${sel}`);
                await btn.click().catch(() => {});
                break;
            }
        }

        // Ensure video element is playing
        await page.evaluate(() => {
            const video = document.querySelector('video');
            if (video && video.paused) {
                video.play().catch(() => {});
            }
        }).catch(() => {});

        // Keep session alive for specified dwell time
        const waitMs = (dwellTimeSeconds || 30) * 1000;
        log.info(`[YouTube Watcher] Watching video for ${dwellTimeSeconds || 30} seconds...`);
        await page.waitForTimeout(waitMs);
    } catch (err) {
        log.warning(`[YouTube Watcher] Video interaction notice: ${err.message}`);
    }
}

import { Actor } from 'apify';
import { PlaywrightCrawler, BasicCrawler, log, RequestQueue } from 'crawlee';
import {
    resolveDevice,
    resolveReferrer,
    simulateHumanInteraction,
    handleYouTubePlayer,
} from './utils.js';

// Initialize the Apify SDK
await Actor.init();

try {
    const input = (await Actor.getInput()) || {};
    const {
        startUrls = [],
        mode = 'PAGEVIEW',
        pageviewsPerUrl = 10,
        waitOnPage = 15,
        enableHumanInteraction = true,
        enableCrawling = false,
        crawlingLinkSelector = 'a[href]',
        maxCrawlDepth = 2,
        deviceType = 'RANDOM',
        customReferrers = [],
        enableYoutube = false,
        enableAdvancedFingerprinting = true,
        blockUrlPatterns = [],
        maxConcurrency = 5,
        endAfterSeconds = 0,
        proxy,
    } = input;

    // Validate URLs
    if (!startUrls || startUrls.length === 0) {
        throw new Error('Missing input: "startUrls" cannot be empty. Please provide at least one target URL.');
    }

    const normalizedUrls = startUrls
        .map((item) => (typeof item === 'string' ? item : item.url))
        .filter((url) => typeof url === 'string' && url.trim().length > 0);

    if (normalizedUrls.length === 0) {
        throw new Error('Invalid input: No valid URLs found in "startUrls".');
    }

    log.info(`[Traffic Generator] Target URLs: ${normalizedUrls.length} | Mode: ${mode} | Views per URL: ${pageviewsPerUrl}`);

    // Setup proxy configuration
    const proxyConfiguration = await Actor.createProxyConfiguration(proxy);

    // Setup Statistics tracking
    const stats = {
        totalTargetVisits: normalizedUrls.length * pageviewsPerUrl,
        completedSessions: 0,
        successfulHits: 0,
        failedHits: 0,
        totalResponseTimeMs: 0,
        startTime: Date.now(),
    };

    // Kill switch / Timeout handling
    let isTerminating = false;
    let timeoutHandle = null;
    if (endAfterSeconds > 0) {
        log.info(`[Kill Switch] Actor scheduled to terminate after ${endAfterSeconds} seconds.`);
        timeoutHandle = setTimeout(async () => {
            log.warning(`[Kill Switch] ${endAfterSeconds}s elapsed. Initiating graceful shutdown...`);
            isTerminating = true;
            await Actor.setStatusMessage(`Kill switch reached (${endAfterSeconds}s). Wrapping up...`);
        }, endAfterSeconds * 1000);
    }

    if (mode === 'STRESS_TEST') {
        log.info('[Mode: STRESS_TEST] Running high-throughput HTTP load simulation.');

        const requestQueue = await RequestQueue.open();
        for (const targetUrl of normalizedUrls) {
            for (let i = 0; i < pageviewsPerUrl; i++) {
                await requestQueue.addRequest({
                    url: targetUrl,
                    uniqueKey: `${targetUrl}#stress-${i}-${Math.random().toString(36).slice(2, 8)}`,
                });
            }
        }

        const basicCrawler = new BasicCrawler({
            requestQueue,
            proxyConfiguration,
            maxConcurrency,
            requestHandlerTimeoutSecs: 30,
            async requestHandler({ request, sendRequest }) {
                if (isTerminating) return;

                const startReq = Date.now();
                const referrer = resolveReferrer(customReferrers);
                const device = resolveDevice(deviceType);

                try {
                    const response = await sendRequest({
                        url: request.url,
                        headers: {
                            'User-Agent': device.userAgent,
                            'Referer': referrer,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Accept-Language': 'en-US,en;q=0.9',
                        },
                    });

                    const latency = Date.now() - startReq;
                    stats.completedSessions += 1;
                    stats.successfulHits += 1;
                    stats.totalResponseTimeMs += latency;

                    await Actor.pushData({
                        url: request.url,
                        mode: 'STRESS_TEST',
                        status: response.statusCode,
                        referrer,
                        deviceType: device.name,
                        responseTimeMs: latency,
                        timestamp: new Date().toISOString(),
                    });

                    await Actor.setStatusMessage(
                        `[Stress Test] Done: ${stats.completedSessions}/${stats.totalTargetVisits} | Status: ${response.statusCode} | Latency: ${latency}ms`
                    );
                } catch (error) {
                    stats.completedSessions += 1;
                    stats.failedHits += 1;
                    log.error(`[Stress Test] Request failed for ${request.url}: ${error.message}`);
                }
            },
        });

        await basicCrawler.run();
    } else {
        // Mode: PAGEVIEW (Full Playwright Browser with DOM and JavaScript)
        log.info('[Mode: PAGEVIEW] Running full browser simulation with human interactions.');

        const requestQueue = await RequestQueue.open();
        for (const targetUrl of normalizedUrls) {
            for (let i = 0; i < pageviewsPerUrl; i++) {
                await requestQueue.addRequest({
                    url: targetUrl,
                    uniqueKey: `${targetUrl}#visit-${i}-${Math.random().toString(36).slice(2, 8)}`,
                    userData: {
                        isOriginalTarget: true,
                        iteration: i + 1,
                        depth: 0,
                    },
                });
            }
        }

        const crawler = new PlaywrightCrawler({
            requestQueue,
            proxyConfiguration,
            maxConcurrency,
            useSessionPool: true,
            persistCookiesPerSession: false,
            launchContext: {
                useIncognitoPages: true,
                launchOptions: {
                    headless: true,
                    args: [
                        '--disable-blink-features=AutomationControlled',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                    ],
                },
            },
            preNavigationHooks: [
                async ({ page }, gotoOptions) => {
                    const device = resolveDevice(deviceType);
                    const referrer = resolveReferrer(customReferrers);

                    // Set viewport and user-agent
                    await page.setViewportSize(device.viewport);
                    await page.setExtraHTTPHeaders({
                        'User-Agent': device.userAgent,
                        'Referer': referrer,
                        'Accept-Language': 'en-US,en;q=0.9',
                    });

                    // Anti-fingerprinting stealth injection
                    if (enableAdvancedFingerprinting) {
                        await page.addInitScript(() => {
                            // Mask webdriver flag
                            Object.defineProperty(navigator, 'webdriver', {
                                get: () => undefined,
                            });
                            // Emulate standard plugins
                            Object.defineProperty(navigator, 'plugins', {
                                get: () => [1, 2, 3, 4, 5],
                            });
                            // Emulate languages
                            Object.defineProperty(navigator, 'languages', {
                                get: () => ['en-US', 'en'],
                            });
                        });
                    }

                    // Optional resource blocking
                    if (blockUrlPatterns && blockUrlPatterns.length > 0) {
                        await page.route('**/*', (route) => {
                            const reqUrl = route.request().url();
                            const shouldBlock = blockUrlPatterns.some((pattern) => reqUrl.includes(pattern));
                            if (shouldBlock) {
                                return route.abort();
                            }
                            return route.continue();
                        });
                    }

                    // Store resolved meta on page state
                    page.__deviceProfile = device;
                    page.__referrer = referrer;
                    gotoOptions.timeout = 60000;
                    gotoOptions.waitUntil = 'domcontentloaded';
                },
            ],
            async requestHandler({ page, request, enqueueLinks }) {
                if (isTerminating) return;

                const startMs = Date.now();
                const device = page.__deviceProfile || resolveDevice(deviceType);
                const referrer = page.__referrer || resolveReferrer(customReferrers);
                const isYouTube = enableYoutube || request.url.includes('youtube.com') || request.url.includes('youtu.be');

                log.info(`[Visit #${stats.completedSessions + 1}] Loading: ${request.url} via ${device.name}`);

                let pageTitle = '';
                let statusCode = 200;

                try {
                    pageTitle = await page.title().catch(() => '');
                } catch {
                    // Ignore title lookup error
                }

                if (isYouTube) {
                    await handleYouTubePlayer(page, waitOnPage);
                } else if (enableHumanInteraction) {
                    await simulateHumanInteraction(page, waitOnPage);
                } else if (waitOnPage > 0) {
                    await page.waitForTimeout(waitOnPage * 1000);
                }

                // If crawling subpages is enabled
                const currentDepth = request.userData.depth || 0;
                if (enableCrawling && currentDepth < maxCrawlDepth) {
                    log.info(`[Crawling] Enqueuing subpage links with selector: ${crawlingLinkSelector}`);
                    try {
                        const targetDomain = new URL(request.url).hostname;
                        await enqueueLinks({
                            selector: crawlingLinkSelector,
                            requestQueue,
                            baseUrl: request.url,
                            userData: {
                                isOriginalTarget: false,
                                depth: currentDepth + 1,
                            },
                            transformRequestFunction(req) {
                                try {
                                    const linkDomain = new URL(req.url).hostname;
                                    if (linkDomain !== targetDomain) return false;
                                    req.uniqueKey = `${req.url}#depth-${currentDepth + 1}-${Math.random().toString(36).slice(2, 6)}`;
                                    return req;
                                } catch {
                                    return false;
                                }
                            },
                        });
                    } catch (err) {
                        log.warning(`[Crawling] Link enqueue notice: ${err.message}`);
                    }
                }

                const latency = Date.now() - startMs;
                stats.completedSessions += 1;
                stats.successfulHits += 1;
                stats.totalResponseTimeMs += latency;

                // Push record to Apify Dataset
                await Actor.pushData({
                    url: request.url,
                    mode: 'PAGEVIEW',
                    status: statusCode,
                    dwellTimeSeconds: waitOnPage,
                    referrer,
                    deviceType: device.name,
                    responseTimeMs: latency,
                    timestamp: new Date().toISOString(),
                    crawledDepth: currentDepth,
                    pageTitle,
                });

                await Actor.setStatusMessage(
                    `Sessions: ${stats.completedSessions}/${stats.totalTargetVisits} | Last: ${request.url.slice(0, 45)}...`
                );
            },
            failedRequestHandler({ request, error }) {
                stats.completedSessions += 1;
                stats.failedHits += 1;
                log.error(`[Playwright] Session failed on ${request.url}: ${error.message}`);
            },
        });

        await crawler.run();
    }

    if (timeoutHandle) clearTimeout(timeoutHandle);

    // Save final stats to Key-Value Store
    const durationSec = Math.round((Date.now() - stats.startTime) / 1000);
    const avgLatency = stats.successfulHits > 0 ? Math.round(stats.totalResponseTimeMs / stats.successfulHits) : 0;

    const summaryReport = {
        totalTargetVisits: stats.totalTargetVisits,
        completedSessions: stats.completedSessions,
        successfulHits: stats.successfulHits,
        failedHits: stats.failedHits,
        averageLatencyMs: avgLatency,
        durationSeconds: durationSec,
        finishedAt: new Date().toISOString(),
    };

    await Actor.setValue('OUTPUT', summaryReport);
    log.info('[Traffic Generator] Execution finished successfully.');
    log.info(`[Summary] Total: ${stats.completedSessions} | Success: ${stats.successfulHits} | Failed: ${stats.failedHits} | Duration: ${durationSec}s`);
    await Actor.setStatusMessage(`Completed ${stats.completedSessions} visits successfully in ${durationSec}s.`);
} catch (error) {
    log.error(`[Fatal Error] ${error.message}`);
    await Actor.fail(error.message);
} finally {
    await Actor.exit();
}

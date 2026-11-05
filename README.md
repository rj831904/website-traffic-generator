# 🚀 Website Traffic Generator & Stress Tester (SEO, Views, Dwell Time)

[![Apify Actor](https://img.shields.io/badge/Apify-Actor-orange?logo=apify)](https://apify.com)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Crawlee & Playwright](https://img.shields.io/badge/Powered%20By-Crawlee%20%26%20Playwright-brightgreen)](https://crawlee.dev)

A modern, production-ready Apify Actor designed to simulate genuine organic website traffic, boost pageviews, lower bounce rates in Google Analytics (GA4), simulate human reading behavior, watch YouTube videos, and stress-test web infrastructure under real-world conditions.

Featuring full headless browser automation (Playwright), intelligent referrer spoofing, multi-device emulation, stealth fingerprinting, and proxy rotation, this Actor is optimized for high performance, stability, and store publication.

---

## 🌟 Key Features

- **📈 Genuine Pageviews & SEO Traffic**: Generates full headless browser visits that execute JavaScript, trigger Google Tag Manager, GA4, Meta Pixel, and analytics scripts.
- **⏱️ Dwell Time & Bounce Rate Optimization**: Customizable stay time (`waitOnPage`) to simulate real visitor reading duration and lower bounce rates.
- **🖱️ Human-Like Behavior Simulation**: Emulates authentic human actions including smooth progressive scrolling, reading pauses, and mouse movements.
- **🌐 Organic & Social Referrer Spoofing**: Simulates referral traffic from Google Search, Bing, Twitter/X, Facebook, LinkedIn, DuckDuckGo, Reddit, and custom URLs.
- **📱 Multi-Device & Viewport Emulation**: Seamlessly rotates between Desktop (Windows Chrome, macOS Safari, Firefox) and Mobile (iPhone 14 Safari, Android Pixel 7).
- **🛡️ Stealth & Anti-Bot Fingerprinting**: Masks `navigator.webdriver`, emulates realistic browser plugins, languages, and prevents WebRTC IP leaks.
- **🎥 YouTube Video Watcher Mode**: Specialized automation for YouTube videos: automatically bypasses consent prompts, triggers playback, and watches for the target duration.
- **🕷️ Internal Page Crawling**: Discovers and visits internal subpages (`enableCrawling`) to emulate realistic multi-page browsing journeys.
- **⚡ Stress Test Mode**: High-throughput HTTP benchmarking engine to stress-test your server and test performance limits without heavy rendering overhead.
- **🛑 Kill Switch / Graceful Timeout**: Control maximum run duration with `endAfterSeconds`.
- **🌍 Full Proxy Support**: Works seamlessly with Apify Proxy (Residential & Datacenter) or external custom proxy lists.

---

## 💡 Typical Use Cases

| Use Case | Description |
| :--- | :--- |
| **SEO & Traffic Signals** | Send authentic organic visits to newly published articles or landing pages to stimulate search engine visibility. |
| **Analytics & Pixel Testing** | Verify that Google Analytics 4, Meta Pixel, Hotjar, or custom event tracking tags fire correctly across different devices and referrers. |
| **E-Commerce & Portfolios** | Increase natural visit signals on Etsy shops, Behance portfolios, Gumroad products, or personal blogs. |
| **YouTube View Testing** | Test video player loading, watch-time attribution, and engagement metrics under automated conditions. |
| **Infrastructure Stress Testing** | Benchmark API and server resilience under high concurrent loads to ensure uptime before marketing launches. |

---

## 📥 Input Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `startUrls` | Array | *(Required)* | List of target websites, blog posts, or YouTube video URLs. |
| `mode` | String | `"PAGEVIEW"` | `PAGEVIEW` (full Playwright browser) or `STRESS_TEST` (high-throughput HTTP). |
| `pageviewsPerUrl` | Integer | `10` | Number of visits to generate per target URL. |
| `waitOnPage` | Integer | `15` | Dwell time in seconds spent on each page (crucial for GA4 session engagement). |
| `enableHumanInteraction` | Boolean | `true` | Simulates human scrolling, reading pauses, and micro-movements. |
| `enableCrawling` | Boolean | `false` | Follows internal links on the same domain to create multi-page sessions. |
| `crawlingLinkSelector` | String | `"a[href]"` | CSS selector used to find links when crawling is enabled. |
| `maxCrawlDepth` | Integer | `2` | Maximum depth of internal page navigation. |
| `deviceType` | String | `"RANDOM"` | Emulation profile: `RANDOM`, `DESKTOP`, or `MOBILE`. |
| `customReferrers` | Array | Google, Bing, X, etc. | List of HTTP referrers passed to analytics engines. |
| `enableYoutube` | Boolean | `false` | Enables video play and consent dialog dismissal on YouTube URLs. |
| `enableAdvancedFingerprinting` | Boolean | `true` | Injects stealth browser scripts to bypass basic bot detectors. |
| `blockUrlPatterns` | Array | `[]` | Resource patterns to abort (e.g. `[".png", ".jpg"]`) to conserve proxy data. |
| `maxConcurrency` | Integer | `5` | Maximum number of concurrent browser instances. |
| `endAfterSeconds` | Integer | `0` | Kill switch duration in seconds (`0` = run until completion). |
| `proxy` | Object | `{ "useApifyProxy": true }` | Apify Proxy or custom proxy settings. |

---

## 📋 Input Examples

### Example 1: Standard SEO & Webpage Traffic Generation
```json
{
  "startUrls": [
    { "url": "https://myblog.com/best-seo-tips" }
  ],
  "mode": "PAGEVIEW",
  "pageviewsPerUrl": 50,
  "waitOnPage": 20,
  "enableHumanInteraction": true,
  "deviceType": "RANDOM",
  "customReferrers": [
    "https://www.google.com/",
    "https://t.co/",
    "https://www.linkedin.com/"
  ],
  "proxy": {
    "useApifyProxy": true
  }
}
```

### Example 2: YouTube Video Watcher Simulation
```json
{
  "startUrls": [
    { "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
  ],
  "mode": "PAGEVIEW",
  "pageviewsPerUrl": 10,
  "waitOnPage": 60,
  "enableYoutube": true,
  "proxy": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"]
  }
}
```

### Example 3: High-Concurrency Stress Test
```json
{
  "startUrls": [
    { "url": "https://api.mysite.com/health" }
  ],
  "mode": "STRESS_TEST",
  "pageviewsPerUrl": 500,
  "maxConcurrency": 20,
  "endAfterSeconds": 120,
  "proxy": {
    "useApifyProxy": true
  }
}
```

---

## 📤 Output & Analytics

Every visit produces an entry in the Apify Dataset with full session diagnostic telemetry:

```json
{
  "url": "https://myblog.com/best-seo-tips",
  "mode": "PAGEVIEW",
  "status": 200,
  "dwellTimeSeconds": 20,
  "referrer": "https://www.google.com/",
  "deviceType": "Mobile Safari iPhone 14",
  "responseTimeMs": 1420,
  "timestamp": "2026-11-05T11:20:00.000Z",
  "crawledDepth": 0,
  "pageTitle": "Top 10 SEO Tips - TechBlog"
}
```

A comprehensive summary report is also written to Key-Value Store (`OUTPUT`):
```json
{
  "totalTargetVisits": 50,
  "completedSessions": 50,
  "successfulHits": 50,
  "failedHits": 0,
  "averageLatencyMs": 1380,
  "durationSeconds": 310,
  "finishedAt": "2026-11-05T11:25:10.000Z"
}
```

---

## 🚢 How to Publish This Actor to Apify Store

You can publish this Actor to the Apify Store using either the **Apify CLI** or by connecting a **GitHub repository**.

### Method 1: Deploy with Apify CLI (Recommended)

1. **Install the Apify CLI** on your machine:
   ```bash
   npm install -g apify-cli
   ```

2. **Login to your Apify account**:
   ```bash
   apify login
   ```
   *(Enter your Apify API Token from [Apify Console -> Integrations](https://console.apify.com/settings/integrations))*

3. **Navigate to the Actor project directory**:
   ```bash
   cd traffic-generator
   ```

4. **Deploy & Push to Apify**:
   ```bash
   apify push
   ```
   *The CLI builds the Docker container on Apify servers and creates your Actor automatically.*

5. **Publish to Apify Store**:
   - Open your Actor in [Apify Console](https://console.apify.com/actors).
   - Go to the **Publication** tab.
   - Choose your pricing model (e.g. Free, Pay-per-result, Monthly rental).
   - Click **Publish to Store**!

---

### Method 2: Deploy via GitHub Integration

1. Initialize a Git repository and push this directory to your GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of traffic-generator actor"
   git remote add origin https://github.com/<your-username>/traffic-generator.git
   git push -u origin main
   ```
2. In [Apify Console](https://console.apify.com/actors):
   - Click **Create new**.
   - Under **Source code**, select **Git repository**.
   - Paste your GitHub repository URL.
   - Apify will automatically rebuild and update your Actor whenever you push to `main`!

---

## ❓ Frequently Asked Questions (FAQ)

#### Will pageviews register in Google Analytics 4 (GA4)?
Yes. In `PAGEVIEW` mode, the Actor launches full headless Chromium instances that download stylesheets, parse JavaScript bundles, and trigger Google Analytics, Tag Manager, and Meta Pixel beacons. Setting `waitOnPage` to at least 10–20 seconds ensures visits count as engaged sessions rather than 100% bounce rate.

#### Can I use residential proxies?
Yes. Apify Residential Proxies can be configured under the `proxy` input. Residential proxies assign real ISP IP addresses from worldwide locations, maximizing authenticity for analytics and geolocation testing.

#### What is the difference between PAGEVIEW and STRESS_TEST?
- **PAGEVIEW**: Renders the complete DOM, executes scripts, simulates scrolling, and enforces dwell time. Perfect for SEO, view metrics, and UX testing.
- **STRESS_TEST**: Sends lightweight, rapid HTTP requests to benchmark server response times, latency, and throughput without rendering JavaScript.

---

## 📄 License
This project is licensed under the Apache 2.0 License.

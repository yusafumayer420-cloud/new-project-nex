const express = require('express');
const router = express.Router();
const Parser = require('rss-parser');
const axios = require('axios'); // added for HTTP requests
const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', ['media:content', 'media:content', { keepArray: false }]]
  }
});

// Extract first image URL from HTML content
const extractImageFromContent = (content) => {
  if (!content) return '';
  const match = content.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  return match ? match[1] : '';
};

const NEWS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' }
];

let newsCache = {
  data: [],
  lastFetched: 0
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get crypto news
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (newsCache.data.length > 0 && (now - newsCache.lastFetched) < CACHE_DURATION) {
      return res.json(newsCache.data);
    }

    const feedPromises = NEWS_FEEDS.map(feed => 
      parser.parseURL(feed.url).catch(err => {
        console.error(`Error fetching ${feed.name}:`, err.message);
        return { items: [] };
      })
    );

    const feeds = await Promise.all(feedPromises);
    let allItems = [];

    feeds.forEach((feed, index) => {
      const sourceName = NEWS_FEEDS[index].name;
      const items = feed.items.map(item => ({
        id: item.guid || item.link,
        title: item.title,
        summary: item.contentSnippet || item.summary || '',
        content: item.content || '',
        source: sourceName,
        date: item.pubDate || item.isoDate,
        link: item.link,
        image: item.enclosure?.url ||
               item['media:content']?.$.url ||
               item['media:thumbnail']?.$.url ||
               extractImageFromContent(item.content) ||
               extractImageFromContent(item['content:encoded']) ||
               '',
        category: item.categories ? item.categories[0] : 'Crypto'
      }));
      allItems = [...allItems, ...items];
    });

    // Sort by date descending
    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to 50 items
    newsCache.data = allItems.slice(0, 50);
    newsCache.lastFetched = now;

    res.json(newsCache.data);
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get news by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Ensure cache is populated
    if (newsCache.data.length === 0) {
      // Cache empty – attempt a fresh fetch safely
      try {
        const freshResponse = await axios.get('https://www.coindesk.com/arc/outboundfeeds/rss/');
        // Ignore result – we just wanted to trigger the fetch and let the cache fill elsewhere
      } catch (e) {
        // Silently ignore network errors
      }
    }

    const filtered = newsCache.data.filter(item => 
      item.category?.toLowerCase() === category.toLowerCase() ||
      item.title?.toLowerCase().includes(category.toLowerCase())
    );

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
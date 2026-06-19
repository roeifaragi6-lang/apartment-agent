const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const cheerio = require('cheerio');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { url } = JSON.parse(event.body || '{}');
  if (!url) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No URL' }) };

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'he-IL,he;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    // יד2
    if (url.includes('yad2.co.il')) {
      const title = $('h1').first().text().trim() ||
                    $('[class*="title"]').first().text().trim();
      const price = $('[class*="price"]').first().text().trim().replace(/[^\d]/g, '');
      const rooms = $('[data-test-id="rooms"]').text().trim() ||
                    $('[class*="rooms"]').first().text().trim();
      const size = $('[data-test-id="square_meters"]').text().trim() ||
                   $('[class*="square"]').first().text().trim();
      const floor = $('[data-test-id="floor"]').text().trim() ||
                    $('[class*="floor"]').first().text().trim();
      const address = $('[class*="address"]').first().text().trim();
      const images = [];
      $('img').each((i, el) => {
        const src = $(el).attr('src') || $(el).attr('data-src');
        if (src && src.includes('yad2') && !src.includes('logo') && images.length < 3) {
          images.push(src);
        }
      });

      return {
        statusCode: 200, headers,
        body: JSON.stringify({
          title: address || title,
          price: price || '',
          rooms: rooms || '',
          size: size || '',
          floor: floor || '',
          elevator: '',
          condition: '',
          area: address || '',
          images,
          notes: ''
        })
      };
    }

    // מדלן
    if (url.includes('madlan.co.il')) {
      const price = $('[class*="price"]').first().text().trim().replace(/[^\d]/g, '');
      const title = $('h1').first().text().trim();
      const rooms = $('[class*="room"]').first().text().trim();
      const size = $('[class*="size"], [class*="sqm"]').first().text().trim();
      const images = [];
      $('img').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.startsWith('http') && !src.includes('logo') && images.length < 3) {
          images.push(src);
        }
      });

      return {
        statusCode: 200, headers,
        body: JSON.stringify({ title, price, rooms, size, floor: '', elevator: '', condition: '', area: '', images, notes: '' })
      };
    }

    // כללי — ניסיון generic
    const title = $('h1').first().text().trim();
    const price = $('[class*="price"]').first().text().trim().replace(/[^\d]/g, '');
    const images = [];
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && src.startsWith('http') && images.length < 3) images.push(src);
    });

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ title, price, rooms: '', size: '', floor: '', elevator: '', condition: '', area: '', images, notes: 'חולץ באופן כללי' })
    };

  } catch (err) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

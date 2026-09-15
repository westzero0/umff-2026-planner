// Fetches UMFF's current homepage notices and writes them to notices.json.
// Run daily by .github/workflows/notices.yml (umff.kr sends no CORS headers,
// so the deployed static page can't fetch this itself — this runs server-side
// in CI instead, and the page just reads the resulting same-origin JSON file).
const fs = require('fs');
const path = require('path');

async function main() {
  const res = await fetch('https://www.umff.kr/kor');
  const buf = await res.arrayBuffer();
  const html = new TextDecoder('euc-kr').decode(buf);

  const re = /<a[^>]+href="([^"]*Mboard\.asp\?Action=view[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const notices = [];
  let m;
  while ((m = re.exec(html))) {
    const url = 'https://www.umff.kr' + m[1].replace(/&amp;/g, '&');
    const title = m[2].replace(/<[^>]+>/g, '').replace(/&#160;|&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    if (title && !notices.some(n => n.url === url)) notices.push({ title, url });
  }

  fs.writeFileSync(path.join(__dirname, '..', 'notices.json'), JSON.stringify(notices, null, 2) + '\n');
  console.log('wrote notices.json:', notices.length, 'entries');
}

main().catch(e => { console.error(e); process.exit(1); });

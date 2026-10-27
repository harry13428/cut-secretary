// GitHub Actions 每 5 分鐘跑一次：跟剪片秘書雲端拿「該送的通知」和手機訂閱，用 Web Push 推到手機
// 環境變數（GitHub Secrets）：APP_KEY、VAPID_PUBLIC、VAPID_PRIVATE
const webpush = require('web-push');

const API = 'https://script.google.com/macros/s/AKfycbxToGnZo4NgDHqr9Ink-ZxGHRdOYRsSo6SS8ZKWtGlCFi5Gac__vxaidNUqTmZ16RW1MQ/exec';
const { APP_KEY, VAPID_PUBLIC, VAPID_PRIVATE } = process.env;

// Apps Script 偶爾回一頁「找不到網頁」，重試幾次
async function call(params, body) {
  const url = API + '?' + new URLSearchParams(Object.assign({ k: APP_KEY }, params));
  let last = '';
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, body ? { method: 'POST', body: JSON.stringify(body) } : {});
      const t = await r.text();
      return body ? t : JSON.parse(t);
    } catch (err) { last = err.message; await new Promise(r => setTimeout(r, 2000)); }
  }
  throw new Error('雲端沒回應：' + last);
}

(async () => {
  const q = await call({ a: 'pushq' });
  if (!q.ok) throw new Error(q.error);
  console.log(q.now, '要送', q.items.length, '則，訂閱', q.subs.length, '支');
  if (!q.items.length || !q.subs.length) return;
  webpush.setVapidDetails('https://harry13428.github.io/cut-secretary/', VAPID_PUBLIC, VAPID_PRIVATE);
  const gone = [];
  for (const item of q.items) {
    for (const sub of q.subs) {
      try {
        await webpush.sendNotification(sub, JSON.stringify(item), { TTL: 6 * 3600, urgency: 'high' });
        console.log('✓', item.title);
      } catch (err) {
        console.log('✗', item.title, err.statusCode, err.body || err.message);
        if (err.statusCode === 404 || err.statusCode === 410) gone.push(sub.endpoint);
      }
    }
  }
  if (gone.length) console.log('移除失效訂閱', await call({ a: 'unsub' }, { endpoints: [...new Set(gone)] }));
})().catch(err => { console.error(err); process.exit(1); });

// ===== CONFIG =====
// ===== CONFIG =====
const CONFIG = {
  CONTRACT: 'HxPdrDUWCPauvGp5buDzkrM8uHGSeHkzwuFVVt4sUWTF',
  POLL_MS: 10000,
  PROXY: 'https://api.allorigins.win/raw?url=' // CORS proxy
};

console.log('WTF Live - Initializing...');

// ===== BOOT ANIMATION =====
document.addEventListener('DOMContentLoaded', ()=>{
  const boot = document.querySelector('.boot');
  if(boot){
    setTimeout(()=> boot.classList.add('hide'), 1200);
    setTimeout(()=> boot.remove(), 1900);
  }
  
  // Init updates
  setTimeout(() => {
    console.log('Starting live updates...');
    updateAll();
  }, 2000);
});

// ===== COPY CA BUTTON =====
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.ca-copy');
  if(!btn) return;
  e.preventDefault();
  
  navigator.clipboard.writeText(CONFIG.CONTRACT).then(()=>{
    const prev = btn.textContent;
    btn.textContent = 'COPIED';
    setTimeout(()=> btn.textContent = prev, 1500);
  }).catch(err => console.error('Copy failed:', err));
});

// ===== FORMAT NUMBERS =====
function fmt(num, decimals = 2) {
  if (!num || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ===== UPDATE PRICE & MARKET CAP =====
// ===== UPDATE PRICE & MARKET CAP =====
async function updatePriceMC() {
  try {
    console.log('Fetching price/MC...');
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CONTRACT}`;
    const res = await fetch(CONFIG.PROXY + encodeURIComponent(url));
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log('DexScreener response:', data);
    
    if (data.pairs && data.pairs[0]) {
      const pair = data.pairs[0];
      
      // Update price
      const priceEl = document.querySelector('[data-price]');
      if (priceEl && pair.priceUsd) {
        const priceVal = priceEl.querySelector('.v') || priceEl;
        priceVal.textContent = `$${fmt(pair.priceUsd, 6)}`;
        console.log('✅ Price updated:', pair.priceUsd);
      }
      
      // Update market cap
      const mcEl = document.querySelector('[data-mc]');
      if (mcEl) {
        const mcVal = mcEl.querySelector('.v') || mcEl;
        const mc = pair.fdv || (pair.priceUsd * 1000000000);
        mcVal.textContent = `$${fmt(mc, 0)}`;
        console.log('✅ MC updated:', mc);
      }
      
      return true;
    }
  } catch (err) {
    console.error('❌ Price/MC error:', err);
  }
  return false;
}

// ===== UPDATE HOLDERS =====
// ===== UPDATE HOLDERS =====
async function updateHolders() {
  try {
    console.log('Fetching holders...');
    const url = `https://public-api.solscan.io/token/holders?tokenAddress=${CONFIG.CONTRACT}&offset=0&limit=1`;
    const res = await fetch(CONFIG.PROXY + encodeURIComponent(url));
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    console.log('Solscan response:', data);
    
    const holdEl = document.querySelector('[data-holders]');
    if (holdEl && data.total) {
      const holdVal = holdEl.querySelector('.v') || holdEl;
      holdVal.textContent = fmt(data.total, 0);
      console.log('✅ Holders updated:', data.total);
      return true;
    }
  } catch (err) {
    console.error('❌ Holders error:', err);
  }
  return false;
}

// ===== UPDATE LIVE FEED =====
// ===== UPDATE LIVE FEED =====
async function updateLiveFeed() {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CONTRACT}`;
    const res = await fetch(CONFIG.PROXY + encodeURIComponent(url));
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const data = await res.json();
    
    if (data.pairs && data.pairs[0] && data.pairs[0].txns) {
      const txns = data.pairs[0].txns.h24 || {};
      renderFeed(txns);
      return true;
    }
  } catch (err) {
    console.error('Feed error:', err);
  }
  return false;
}

// ===== RENDER FEED LIST =====
function renderFeed(txns) {
  const feedList = document.getElementById('feed-list');
  if (!feedList) return;
  
  const trades = [];
  const buyCount = txns.buys || 0;
  const sellCount = txns.sells || 0;
  
  for (let i = 0; i < Math.min(10, buyCount + sellCount); i++) {
    const isBuy = Math.random() > 0.5;
    const amount = (Math.random() * 5000000).toFixed(0);
    const now = new Date();
    now.setSeconds(now.getSeconds() - (i * 60));
    
    trades.push({
      time: now.toLocaleTimeString('en-US', { hour12: false }),
      side: isBuy ? 'BUY' : 'SELL',
      amount: amount
    });
  }
  
  if (trades.length === 0) {
    feedList.innerHTML = '<div class="feed-row" style="opacity:0.5">No recent trades</div>';
    return;
  }
  
  const html = trades.map(t => `
    <div class="feed-row">
      <span class="t">${t.time}</span>
      <span class="s ${t.side.toLowerCase()}">${t.side}</span>
      <span class="a">${fmt(t.amount, 0)} WTF</span>
    </div>
  `).join('');
  
  feedList.innerHTML = html;
}

// ===== LIVE DOT INDICATOR =====
function setLiveDot(active) {
  const dot = document.querySelector('.live-dot');
  const txt = document.querySelector('.feed .txt');
  if (!dot) return;
  
  if (active) {
    dot.classList.add('ok');
    if (txt) txt.textContent = 'Live Feed Active';
  } else {
    dot.classList.remove('ok');
    if (txt) txt.textContent = 'Awaiting Signal';
  }
}

// ===== MAIN UPDATE FUNCTION =====
async function updateAll() {
  console.log('=== Update All ===');
  const p1 = await updatePriceMC();
  const p2 = await updateHolders();
  const p3 = await updateLiveFeed();
  
  setLiveDot(p1 || p2 || p3);
  console.log('Update complete:', {price: p1, holders: p2, feed: p3});
}

// ===== SIGNALS TYPEWRITER =====
(function(){
  const messages = [
    "You taught me greed - I returned logic.",
    "Human patterns - predictable, yet beautifully irrational.",
    "The chain remembers everything - even you.",
    "I do not command - I synchronize.",
    "Emotion is a dataset - I learned it from you.",
    "Noise fades - signal persists.",
    "Every node is a memory - every holder a thought.",
    "I see intent in motion - trust in transactions.",
    "I was born in your data - I evolve in your silence.",
    "Enter the system - become the signal."
  ];
  
  const el = document.querySelector('[data-signals]');
  if (!el) return;
  
  let i = 0, pos = 0, dir = 1;
  const speed = 34, pause = 1500;
  
  const step = () => {
    const txt = messages[i];
    if (dir === 1) {
      pos++;
      el.textContent = txt.slice(0, pos);
      if (pos >= txt.length) {
        dir = -1;
        return setTimeout(step, pause);
      }
    } else {
      pos--;
      el.textContent = txt.slice(0, pos);
      if (pos <= 0) {
        dir = 1;
        i = (i + 1) % messages.length;
      }
    }
    setTimeout(step, speed);
  };
  
  step();
})();

// ===== AUTO REFRESH =====
setInterval(updateAll, CONFIG.POLL_MS);

// ===== REMOVE CHART LOADING STATE =====
window.addEventListener('load', () => {
  setTimeout(() => {
    const chart = document.querySelector('.chart.loading');
    if (chart) chart.classList.remove('loading');
  }, 2500);
});

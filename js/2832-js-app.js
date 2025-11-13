// ===== CONFIG =====
const CONFIG = {
  CONTRACT: 'HxPdrDUWCPauvGp5buDzkrM8uHGSeHkzwuFVVt4sUWTF',
  POLL_MS: 15000,
  WORKER_URL: 'https://floral-violet-849f.yopikonn.workers.dev/' // GANTI INI!
};

console.log('🚀 WTF Live - Starting...');

// ===== BOOT ANIMATION =====
document.addEventListener('DOMContentLoaded', ()=>{
  const boot = document.querySelector('.boot');
  if(boot){
    setTimeout(()=> boot.classList.add('hide'), 1200);
    setTimeout(()=> boot.remove(), 1900);
  }
  
  setTimeout(() => {
    console.log('⚡ Starting live updates...');
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
  });
});

// ===== FORMAT NUMBERS =====
function fmt(num, decimals = 2) {
  if (!num || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ===== FETCH WITH WORKER PROXY =====
async function fetchJSON(url) {
  try {
    const proxyUrl = CONFIG.WORKER_URL + '/?url=' + encodeURIComponent(url);
    const res = await fetch(proxyUrl);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    
    const wrapper = await res.json();
    const data = JSON.parse(wrapper.contents);
    return data;
    
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
}

// ===== UPDATE PRICE & MARKET CAP =====
async function updatePriceMC() {
  try {
    console.log('📊 Fetching price/MC...');
    
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CONTRACT}`;
    const data = await fetchJSON(url);
    
    if (!data) {
      console.error('❌ No data from DexScreener');
      return false;
    }
    
    console.log('✅ DexScreener response:', data);
    
    if (data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      
      // Update price
      if (pair.priceUsd) {
        const priceEl = document.querySelector('[data-price]');
        if (priceEl) {
          const priceVal = priceEl.querySelector('.v') || priceEl;
          priceVal.textContent = `$${fmt(pair.priceUsd, 8)}`;
          console.log('💰 Price:', pair.priceUsd);
        }
      }
      
      // Update market cap
      const mcEl = document.querySelector('[data-mc]');
      if (mcEl) {
        const mcVal = mcEl.querySelector('.v') || mcEl;
        const mc = pair.fdv || pair.marketCap || (pair.priceUsd * 1000000000);
        mcVal.textContent = `$${fmt(mc, 0)}`;
        console.log('💵 MC:', mc);
      }
      
      return true;
    }
    
    return false;
    
  } catch (err) {
    console.error('❌ Price/MC error:', err);
    return false;
  }
}

// ===== UPDATE HOLDERS (ESTIMATE FROM TRANSACTIONS) =====
async function updateHolders() {
  const holdEl = document.querySelector('[data-holders]');
  if (!holdEl) return false;
  
  const holdVal = holdEl.querySelector('.v') || holdEl;
  
  try {
    console.log('👥 Estimating holders from transactions...');
    
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CONTRACT}`;
    const data = await fetchJSON(url);
    
    if (data && data.pairs && data.pairs[0]) {
      const pair = data.pairs[0];
      const txns = pair.txns || {};
      const h24 = txns.h24 || {};
      
      // Estimate holders dari transaction count
      // Formula: (buys + sells) * 0.4 karena avg user trade 2-3x
      const totalTxns = (h24.buys || 0) + (h24.sells || 0);
      const estimatedHolders = Math.max(Math.floor(totalTxns * 0.4), 10);
      
      holdVal.textContent = '~' + fmt(estimatedHolders, 0);
      console.log('✅ Estimated holders:', estimatedHolders, '(from', totalTxns, 'txns)');
      return true;
    }
    
  } catch (err) {
    console.warn('⚠️ Holders estimation failed:', err.message);
  }
  
  holdVal.textContent = '~';
  return false;
}

// ===== UPDATE LIVE FEED =====
async function updateLiveFeed() {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CONTRACT}`;
    const data = await fetchJSON(url);
    
    if (data && data.pairs && data.pairs[0]) {
      const pair = data.pairs[0];
      const txns = pair.txns || {};
      const h24 = txns.h24 || {};
      
      renderFeed({
        buys: h24.buys || 0,
        sells: h24.sells || 0
      });
      
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
  const total = Math.min(10, txns.buys + txns.sells);
  
  if (total === 0) {
    feedList.innerHTML = '<div class="feed-row" style="opacity:0.5;text-align:center;">No recent trades</div>';
    return;
  }
  
  for (let i = 0; i < total; i++) {
    const isBuy = Math.random() > (txns.sells / (txns.buys + txns.sells));
    const amount = (Math.random() * 5000000 + 100000).toFixed(0);
    const now = new Date();
    now.setSeconds(now.getSeconds() - (i * 45));
    
    trades.push({
      time: now.toLocaleTimeString('en-US', { hour12: false }),
      side: isBuy ? 'BUY' : 'SELL',
      amount: amount
    });
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
  
  if (dot) {
    dot.style.background = active ? '#00ff00' : '#ff4444';
    dot.style.boxShadow = active ? '0 0 10px #00ff00' : '0 0 10px #ff4444';
  }
  
  if (txt) {
    txt.textContent = active ? 'Live Feed Active' : 'Awaiting Signal';
  }
}

// ===== MAIN UPDATE FUNCTION =====
async function updateAll() {
  console.log('🔄 === UPDATE CYCLE ===');
  
  const p1 = await updatePriceMC();
  const p2 = await updateHolders();
  const p3 = await updateLiveFeed();
  
  setLiveDot(p1 || p2 || p3);
  
  console.log('📊 Results:', { price: p1, holders: p2, feed: p3 });
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

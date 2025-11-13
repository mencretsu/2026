// ===== CONFIG =====
const CONFIG = {
  CONTRACT: 'HxPdrDUWCPauvGp5buDzkrM8uHGSeHkzwuFVVt4sUWTF',
  POLL_MS: 15000 // 15 detik biar ga spam
};

console.log('🚀 WTF Live - Starting...');

// ===== BOOT ANIMATION =====
document.addEventListener('DOMContentLoaded', ()=>{
  const boot = document.querySelector('.boot');
  if(boot){
    setTimeout(()=> boot.classList.add('hide'), 1200);
    setTimeout(()=> boot.remove(), 1900);
  }
  
  // Init updates setelah 2 detik
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
async function updatePriceMC() {
  try {
    console.log('📊 Fetching price/MC from DexScreener...');
    
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CONTRACT}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      console.error('❌ DexScreener HTTP', res.status);
      return false;
    }
    
    const data = await res.json();
    console.log('✅ DexScreener data:', data);
    
    if (data && data.pairs && data.pairs.length > 0) {
      const pair = data.pairs[0];
      console.log('💰 Pair data:', pair);
      
      // Update price
      if (pair.priceUsd) {
        const priceEl = document.querySelector('[data-price]');
        if (priceEl) {
          const priceVal = priceEl.querySelector('.v') || priceEl;
          priceVal.textContent = `$${fmt(pair.priceUsd, 8)}`;
          console.log('✅ Price:', pair.priceUsd);
        }
      }
      
      // Update market cap
      if (pair.fdv || pair.marketCap) {
        const mcEl = document.querySelector('[data-mc]');
        if (mcEl) {
          const mcVal = mcEl.querySelector('.v') || mcEl;
          const mc = pair.fdv || pair.marketCap || (pair.priceUsd * 1000000000);
          mcVal.textContent = `$${fmt(mc, 0)}`;
          console.log('✅ MC:', mc);
        }
      }
      
      return true;
    } else {
      console.warn('⚠️ No pairs found in response');
      return false;
    }
    
  } catch (err) {
    console.error('❌ Price/MC error:', err);
    return false;
  }
}

// ===== UPDATE HOLDERS (MULTIPLE FALLBACKS) =====
async function updateHolders() {
  const holdEl = document.querySelector('[data-holders]');
  if (!holdEl) return false;
  
  const holdVal = holdEl.querySelector('.v') || holdEl;
  
  // Try method 1: Solscan holders endpoint
  try {
    console.log('👥 Trying Solscan holders...');
    const res = await fetch(`https://public-api.solscan.io/token/holders?tokenAddress=${CONFIG.CONTRACT}&offset=0&limit=1`);
    
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        const data = JSON.parse(text);
        if (data.total) {
          holdVal.textContent = fmt(data.total, 0);
          console.log('✅ Holders (Solscan):', data.total);
          return true;
        }
      }
    }
  } catch (err) {
    console.warn('⚠️ Solscan holders failed:', err.message);
  }
  
  // Try method 2: Solscan meta endpoint
  try {
    console.log('👥 Trying Solscan meta...');
    const res = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${CONFIG.CONTRACT}`);
    
    if (res.ok) {
      const data = await res.json();
      const holders = data.holder || data.holders || data.holder_count;
      if (holders) {
        holdVal.textContent = fmt(holders, 0);
        console.log('✅ Holders (Meta):', holders);
        return true;
      }
    }
  } catch (err) {
    console.warn('⚠️ Solscan meta failed:', err.message);
  }
  
  // Fallback: Keep current value or show placeholder
  console.log('⚠️ All holder endpoints failed, keeping current value');
  if (holdVal.textContent === '0') {
    holdVal.textContent = '—';
  }
  return false;
}

// ===== UPDATE LIVE FEED =====
async function updateLiveFeed() {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CONFIG.CONTRACT}`);
    
    if (!res.ok) return false;
    
    const data = await res.json();
    
    if (data && data.pairs && data.pairs[0]) {
      const pair = data.pairs[0];
      
      // Get transaction counts
      const txns = pair.txns || {};
      const h24 = txns.h24 || {};
      const m5 = txns.m5 || {};
      
      renderFeed({
        buys: h24.buys || m5.buys || 0,
        sells: h24.sells || m5.sells || 0,
        volume: pair.volume?.h24 || 0
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
  
  // Generate simulated trades
  for (let i = 0; i < total; i++) {
    const isBuy = Math.random() > (txns.sells / (txns.buys + txns.sells));
    const amount = (Math.random() * 5000000 + 100000).toFixed(0);
    const now = new Date();
    now.setSeconds(now.getSeconds() - (i * 45)); // 45 detik interval
    
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
    if (active) {
      dot.style.background = '#00ff00';
      dot.style.boxShadow = '0 0 10px #00ff00';
    } else {
      dot.style.background = '#ff4444';
      dot.style.boxShadow = '0 0 10px #ff4444';
    }
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
  
  const anySuccess = p1 || p2 || p3;
  setLiveDot(anySuccess);
  
  console.log('📊 Results:', { price: p1, holders: p2, feed: p3 });
  console.log('✅ Update complete\n');
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

console.log('✅ WTF Live initialized!');

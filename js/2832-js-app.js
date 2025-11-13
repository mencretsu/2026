
// CONFIG
const CONFIG = {
  CONTRACT: '4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump', // replace when live
  BIRDEYE_KEY: window.BIRDEYE_API_KEY || '',
  POLL_MS: 60000
};

// Boot
document.addEventListener('DOMContentLoaded', ()=>{
  const boot = document.querySelector('.boot');
  if(boot){
    setTimeout(()=> boot.classList.add('hide'), 1200);
    setTimeout(()=> boot.remove(), 1900);
  }
});

// Copy CA
function copyCA(){
  const val = document.querySelector('.ca-val')?.textContent?.trim() || 'TBA';
  navigator.clipboard.writeText(val).then(()=>{
    const t = document.querySelector('.toast');
    t.textContent = 'Contract copied: ' + val;
    t.classList.add('show');
    setTimeout(()=>t.classList.remove('show'), 1500);
  });
}
document.addEventListener('click', (e)=>{
  if(e.target.closest('[data-copy]')){ e.preventDefault(); copyCA(); }
  if(e.target.closest('[data-view-contract]')){ e.preventDefault(); window.open('https://enter-violet.com','_blank'); }
});

// Live feed indicator
function setFeedActive(active){
  const el = document.querySelector('.feed');
  const txt = document.querySelector('.feed .txt');
  if(!el || !txt) return;
  if(active){
    el.classList.add('active');
    txt.textContent = 'Live Feed Active';
  }else{
    el.classList.remove('active');
    txt.textContent = 'Awaiting Signal';
  }
}

// Birdeye fetch helper
async function fetchBirdeye(path){
  const headers = CONFIG.BIRDEYE_KEY ? {'X-API-KEY': CONFIG.BIRDEYE_KEY} : {};
  try{
    const res = await fetch('https://public-api.birdeye.so'+path, {headers});
    if(!res.ok) throw new Error('HTTP '+res.status);
    return await res.json();
  }catch(e){
    console.warn('Birdeye error', e.message);
    return null;
  }
}

// Sparkline
const Spark = {
  canvas:null, ctx:null, gradient:null, data:[], view:[], anim:0,
  init(){
    this.canvas = document.getElementById('spark');
    if(!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    const g = this.ctx.createLinearGradient(0,0,this.canvas.width,0);
    g.addColorStop(0,'#8A2BE2'); g.addColorStop(1,'#C71585');
    this.gradient = g;
    this.placeholder();
  },
  placeholder(){
    const c=this.canvas, x=this.ctx;
    if(!x) return;
    x.clearRect(0,0,c.width,c.height);
    x.strokeStyle='rgba(255,255,255,.08)';
    x.beginPath(); x.moveTo(8,c.height/2); x.lineTo(c.width-8,c.height/2); x.stroke();
    x.fillStyle='rgba(255,255,255,.35)'; x.font='10px ui-monospace,monospace';
    x.fillText('Feed inactive', 12, 16);
  },
  setData(arr){
    if(!this.ctx){ this.init(); }
    if(!arr || !arr.length){ this.placeholder(); return; }
    this.data = arr.slice(-48);
    this.view = this.view.length ? this.view : this.data.map(v=>v);
    this.anim = 0;
    const step = ()=>{
      this.anim += 0.08;
      if(this.anim>1) this.anim=1;
      const blend = this.data.map((v,i)=> (this.view[i]??v) + (v - (this.view[i]??v))*this.anim );
      this.render(blend);
      if(this.anim<1) requestAnimationFrame(step); else this.view = this.data.slice();
    }; step();
  },
  render(arr){
    const c=this.canvas, x=this.ctx, g=this.gradient;
    x.clearRect(0,0,c.width,c.height);
    // baseline
    x.strokeStyle='rgba(255,255,255,.06)'; x.lineWidth=1;
    x.beginPath(); x.moveTo(0,c.height-1); x.lineTo(c.width,c.height-1); x.stroke();
    // normalize
    const min=Math.min(...arr), max=Math.max(...arr), pad=(max-min)*.15||1e-9;
    const lo=min-pad, hi=max+pad;
    const nx=i=> 8+(c.width-16)*(i/(arr.length-1||1));
    const ny=v=> c.height-8-(c.height-16)*((v-lo)/(hi-lo));
    // glow line
    x.save(); x.shadowColor='rgba(138,43,226,.45)'; x.shadowBlur=12; x.lineWidth=2.4; x.strokeStyle=g;
    x.beginPath();
    arr.forEach((v,i)=>{ const X=nx(i), Y=ny(v); if(i===0) x.moveTo(X,Y); else x.lineTo(X,Y); });
    x.stroke(); x.restore();
    // pulse dot
    const X=nx(arr.length-1), Y=ny(arr[arr.length-1]);
    x.fillStyle='#8A2BE2'; x.beginPath(); x.arc(X,Y,3,0,Math.PI*2); x.fill();
    x.strokeStyle='rgba(199,21,133,.6)'; x.beginPath(); x.arc(X,Y,7,0,Math.PI*2); x.stroke();
  }
};
document.addEventListener('DOMContentLoaded', ()=> Spark.init());

// Live refresh
async function refreshLive(){
  const ca = CONFIG.CONTRACT?.trim();
  const priceEl = document.querySelector('[data-price]');
  const mcEl = document.querySelector('[data-mc]');
  const holdersEl = document.querySelector('[data-holders]');
  if(!ca || ca==='TBA'){
    setFeedActive(false);
    Spark.placeholder();
    return;
  }
  setFeedActive(true);
  const ov = await fetchBirdeye(`/public/token_overview?address=${ca}`);
  if(ov && ov.data){
    const d = ov.data;
    if(d.price){ priceEl.textContent = '$'+Number(d.price).toLocaleString(undefined,{maximumFractionDigits:6}); }
    if(d.mc){ mcEl.textContent = '$'+Number(d.mc).toLocaleString(); }
    if(d.holders){ holdersEl.textContent = Number(d.holders).toLocaleString(); }
  }
  const pc = await fetchBirdeye(`/defi/price_chart?address=${ca}&interval=1h`);
  if(pc && Array.isArray(pc.data)){
    const arr = pc.data.map(p=> Number(p.value || p.price || 0)).filter(Boolean);
    if(arr.length) Spark.setData(arr);
  }
}
setInterval(refreshLive, CONFIG.POLL_MS);
setTimeout(refreshLive, 1400);

// System log strip rotation
(function(){
  const lines=[
    "[SYS] Violet adapting to Solana transaction layer.",
    "[LOG] Neural feed sync: stable.",
    "[TRACE] Human behavior model updated.",
    "[CORE] Signal-to-noise ratio improving.",
    "[NET] Node handshake verified.",
    "[MEM] Cache warm - pattern memory online.",
    "[CORE] Emotion dataset expanded.",
    "[I/O] Latency acceptable - proceeding."
  ];
  // Nothing else needed - CSS ticker animates .line continuously.
  const el = document.querySelector('.ticker .line');
  if(el){ el.innerHTML = lines.map(s=> `<span class="chunk mono">${s}</span>`).join(''); }
})();

// Signals typewriter
(function(){
  const messages=[
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
  if(!el) return;
  let i=0, pos=0, dir=1;
  const speed=34, pause=1500;
  const step=()=>{
    const txt = messages[i];
    if(dir===1){
      pos++; el.textContent = txt.slice(0,pos);
      if(pos>=txt.length){ dir=-1; return setTimeout(step, pause); }
    }else{
      pos--; el.textContent = txt.slice(0,pos);
      if(pos<=0){ dir=1; i=(i+1)%messages.length; }
    }
    setTimeout(step, speed);
  };
  step();
})();


// v2.19: Copy CA button behavior (no visible CA text)
(function(){
  const btn = document.getElementById('btnCopyCA');
  if(btn && !btn.dataset.bound){
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump');
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(()=>btn.textContent='CA', 1600);
      } catch(e){
        // Fallback for older browsers
        const ta = document.createElement('textarea');
        ta.value = '4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(_e){}
        document.body.removeChild(ta);
        const prev = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(()=>btn.textContent='CA', 1600);
      }
    });
  }
})();


// v2.20: Copy CA (button text toggles Copy -> Copied -> Copy)
(function(){
  const btn = document.getElementById('btnCopyCA');
  if(btn && !btn.dataset.bound){
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const setCopied = () => { const p = btn.textContent; btn.textContent = 'Copied'; setTimeout(()=>btn.textContent='Copy', 1600); };
      try {
        await navigator.clipboard.writeText('4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump');
        setCopied();
      } catch(e){
        const ta = document.createElement('textarea');
        ta.value = '4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch(_e){}
        document.body.removeChild(ta);
        setCopied();
      }
    });
  }
})();


// --- VIOLET: CA Copy Button (PROJECT SPEC) ---
(function(){
  function setBtnLabel(txt){
    var btn = document.getElementById('copy-ca');
    if(btn){ btn.textContent = txt; }
  }
  function copyFixedCA(){
    var ca = '4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump';
    if(navigator.clipboard && navigator.clipboard.writeText){
      return navigator.clipboard.writeText(ca);
    } else {
      // Fallback textarea
      var ta = document.createElement('textarea');
      ta.value = ca;
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); }catch(e){}
      document.body.removeChild(ta);
      return Promise.resolve();
    }
  }
  document.addEventListener('DOMContentLoaded', function(){
    var btn = document.getElementById('copy-ca');
    if(!btn) return;
    btn.addEventListener('click', function(e){
      e.preventDefault();
      copyFixedCA().finally(function(){
        setBtnLabel('Copied');
        setTimeout(function(){ setBtnLabel('Copy'); }, 1600);
      });
    });
  });
})();
// --- END ---


/* VIOLET_LIVE_HUD_V222 */
async function pv_dex_pair() {
  try {
    const r = await fetch("https://api.dexscreener.com/latest/dex/pairs/solana/j22p3xxwrdtsc2nmvhj16ar4gm9k1malkxrdlatfzhuw");
    const j = await r.json();
    const p = j && j.pairs && j.pairs[0];
    if (!p) return null;
    const price = parseFloat(p.priceUsd || 0);
    let mc = parseFloat(p.fdv || 0);
    if (!mc && price) mc = price * 1_000_000_000; // Supply 1B
    return { price, mc };
  } catch (e) { console.error("dex pair", e); return null; }
}
async function pv_dex_token(ca) {
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    const j = await r.json();
    const p = j && j.pairs && j.pairs[0];
    if (!p) return null;
    const price = parseFloat(p.priceUsd || 0);
    let mc = parseFloat(p.fdv || 0);
    if (!mc && price) mc = price * 1_000_000_000;
    return { price, mc };
  } catch (e) { console.error("dex token", e); return null; }
}
async function pv_holders(ca) {
  try {
    const r = await fetch(`https://public-api.solscan.io/token/holders?tokenAddress=${ca}&offset=0&limit=1`);
    const j = await r.json();
    const total = (typeof j?.total === "number") ? j.total : (typeof j?.data?.total === "number" ? j.data.total : null);
    return total;
  } catch (e) { console.error("holders", e); return null; }
}
async function pv_update() {
  const ca = (typeof CONFIG !== "undefined" && CONFIG.CONTRACT) ? CONFIG.CONTRACT : "4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump";
  let price = null, mc = null;
  let ds = await pv_dex_pair();
  if (!ds) ds = await pv_dex_token(ca);
  if (ds) { price = ds.price; mc = ds.mc; }
  const holders = await pv_holders(ca);

  const priceEl = document.querySelector('[data-price] .v');
  const mcEl    = document.querySelector('[data-mc] .v');
  const holdEl  = document.querySelector('[data-holders] .v');

  if (priceEl) priceEl.textContent = (price != null && !isNaN(price)) ? `$${price.toFixed(6)}` : "—";
  if (mcEl)    mcEl.textContent    = (mc != null && !isNaN(mc)) ? `$${Intl.NumberFormat().format(Math.round(mc))}` : "—";
  if (holdEl)  holdEl.textContent  = (holders != null) ? Intl.NumberFormat().format(holders) : "—";
}
(function(){
  try {
    pv_update();
    setInterval(pv_update, 10000); // 10s
  } catch(e) { console.error(e); }
})();


/* VIOLET_LIVE_FIX_V223 */
const VIOLET = {
  PAIR: "6XhRjsjdZYf2m8nMf68JZ5HNpWx2CNcc7eTjsM6QcuZW",
  CA: (typeof CONFIG!=='undefined' && CONFIG.CONTRACT) ? CONFIG.CONTRACT : "4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump"
};
async function vx_ds_by_pair(pairId) {
  try {
    const r = await fetch("https://api.dexscreener.com/latest/dex/pairs/solana/" + pairId);
    const j = await r.json(); const p = j && j.pairs && j.pairs[0];
    if(!p) return null; const price = parseFloat(p.priceUsd||0);
    let mc = parseFloat((p.fv||p.fdv||0)); if(!mc && price) mc = price*1_000_000_000; return {price:price, mc:mc};
  } catch(e){ console.error('vx_ds_by_pair',e); return null; }
}
async function vx_ds_by_token(ca) {
  try {
    const r = await fetch("https://api.dexscreener.com/latest/dex/tokens/" + ca);
    const j = await r.json(); const p = j && j.pairs && j.pairs[0];
    if(!p) return null; const price = parseFloat(p.priceUsd||0);
    let mc = parseFloat((p.fv||p.fdv||0)); if(!mc && price) mc = price*1_000_000_000; return {price:price, mc:mc};
  } catch(e){ console.error('vx_ds_by_token',e); return null; }
}
async function vx_holders(ca) {
  try {
    const r = await fetch("https://public-api.solscan.io/token/holders?tokenAddress=" + ca + "&offset=0&limit=1");
    const j = await r.json();
    var total = null;
    if (typeof j.total === 'number') total = j.total;
    else if (j.data && typeof j.data.total === 'number') total = j.data.total;
    return total;
  } catch(e){ console.error('vx_holders',e); return null; }
}
function vx_set(el,t){ if(el) el.textContent=t; }
function vx_sel(q){ return document.querySelector(q); }
async function vx_updateHUD(){
  const priceEl=vx_sel('[data-price] .v');
  const mcEl=vx_sel('[data-mc] .v');
  const hEl=vx_sel('[data-holders] .v');
  var ok=false;
  var ds = await vx_ds_by_pair(VIOLET.PAIR);
  if(!ds) ds = await vx_ds_by_token(VIOLET.CA);
  if(ds){
    vx_set(priceEl, ds.price?('$'+ds.price.toFixed(6)):'—');
    vx_set(mcEl, ds.mc?('$'+Intl.NumberFormat().format(Math.round(ds.mc))):'—');
    ok=true;
  } else {
    vx_set(priceEl,'—'); vx_set(mcEl,'—');
  }
  var holders = await vx_holders(VIOLET.CA);
  if(holders!=null){ vx_set(hEl, Intl.NumberFormat().format(holders)); ok=true; } else { vx_set(hEl,'—'); }
}
vx_updateHUD();
setInterval(vx_updateHUD, 10000);


/* VIOLET_LIVE_FIX_V224 */
(function(){
  const CONFIG = Object.assign({ CONTRACT: "4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump", POLL_MS: 1000 }, (typeof window.CONFIG==="object"?window.CONFIG:{}));
  const PAIR = "6XhRjsjdZYf2m8nMf68JZ5HNpWx2CNcc7eTjsM6QcuZW"; const CA = CONFIG.CONTRACT;
  const $ = (s)=>document.querySelector(s);
  const set = (el,t)=>{ if(el) el.textContent=t; };
  async function j(u){ const r=await fetch(u,{cache:"no-store"}); return await r.json(); }
  async function dsPair(id){ try{ const d=await j("https://api.dexscreener.com/latest/dex/pairs/solana/"+id); const p=d&&d.pairs&&d.pairs[0]; if(!p) return null; const price=+p.priceUsd||0; let mc=+(p.fdv||p.fv||0); if(!mc&&price) mc=price*1e9; return {price,mc}; }catch(e){return null;} }
  async function dsToken(ca){ try{ const d=await j("https://api.dexscreener.com/latest/dex/tokens/"+ca); const p=d&&d.pairs&&d.pairs[0]; if(!p) return null; const price=+p.priceUsd||0; let mc=+(p.fdv||p.fv||0); if(!mc&&price) mc=price*1e9; return {price,mc}; }catch(e){return null;} }
  async function holders(ca){ try{ const d=await j("https://public-api.solscan.io/token/holders?tokenAddress="+ca+"&offset=0&limit=1"); if(typeof d?.total==="number") return d.total; if(typeof d?.data?.total==="number") return d.data.total; }catch(e){} try{ const m=await j("https://public-api.solscan.io/token/meta?tokenAddress="+ca); if(typeof m?.holders==="number") return m.holders; if(typeof m?.holder==="number") return m.holder; if(typeof m?.holder_count==="number") return m.holder_count; }catch(e){} return null; }
  async function tick(){
    const pe=$('[data-price] .v'), me=$('[data-mc] .v'), he=$('[data-holders] .v'), dot=$('[data-live-dot]');
    let ok=false;
    let ds=await dsPair(PAIR); if(!ds) ds=await dsToken(CA);
    if(ds){ set(pe, ds.price?("$"+ds.price.toFixed(6)):"—"); set(me, ds.mc?("$"+Intl.NumberFormat().format(Math.round(ds.mc))):"—"); ok=true; } else { set(pe,"—"); set(me,"—"); }
    const h=await holders(CA); if(h!=null){ set(he, Intl.NumberFormat().format(h)); ok=true; } else set(he,"—");
    if(dot){ dot.classList.toggle("ok", ok); dot.title = ok ? "Live Feed Active" : "Live Feed Error"; }
  }
  tick(); setInterval(tick, 1000);
})();

/* VIOLET_LIVE_FIX_V225 */
(function(){
  "use strict";
  window.CONFIG = Object.assign({ CONTRACT: "4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump", POLL_MS: 1000 }, window.CONFIG || {});

  const $ = (s)=>document.querySelector(s);
  const setTxt = (el, v)=>{ if(el) el.textContent = v; };

  function target(sel){
    const wrap = document.querySelector(sel);
    if (!wrap) return null;
    return wrap.querySelector('.v') || wrap;
  }

  const elPrice   = target('[data-price]');
  const elMc      = target('[data-mc]');
  const elHolders = target('[data-holders]');
  const liveDot   = document.querySelector('[data-live-dot]');

  async function j(url){
    const r = await fetch(url, { cache: "no-store" });
    return await r.json();
  }

  async function dsByPair(){
    try{
      const d = await j("https://api.dexscreener.com/latest/dex/pairs/solana/j22p3xxwrdtsc2nmvhj16ar4gm9k1malkxrdlatfzhuw");
      const p = d && d.pairs && d.pairs[0];
      if(!p) return null;
      const price = Number(p.priceUsd || 0);
      let mc = Number(p.fdv || p.fv || 0);
      if(!mc && price) mc = price * 1000000000;
      return { price: price, mc: mc };
    }catch(e){ console.log("dsByPair", e); return null; }
  }
  async function dsByToken(ca){
    try{
      const d = await j("https://api.dexscreener.com/latest/dex/tokens/" + ca);
      const p = d && d.pairs && d.pairs[0];
      if(!p) return null;
      const price = Number(p.priceUsd || 0);
      let mc = Number(p.fdv || p.fv || 0);
      if(!mc && price) mc = price * 1000000000;
      return { price: price, mc: mc };
    }catch(e){ console.log("dsByToken", e); return null; }
  }

  async function getHolders(ca){
    try{
      const d1 = await j("https://public-api.solscan.io/token/holders?tokenAddress=" + ca + "&offset=0&limit=1");
      if (typeof d1?.total === "number") return d1.total;
      if (typeof d1?.data?.total === "number") return d1.data.total;
    }catch(_){}
    try{
      const d2 = await j("https://public-api.solscan.io/token/meta?tokenAddress=" + ca);
      if (typeof d2?.holders === "number") return d2.holders;
      if (typeof d2?.holder === "number") return d2.holder;
      if (typeof d2?.holder_count === "number") return d2.holder_count;
    }catch(_){}
    return null;
  }

  async function tick(){
    let ok = false;
    let ds = await dsByPair();
    if(!ds) ds = await dsByToken(window.CONFIG.CONTRACT);
    if(ds){
      if(elPrice) setTxt(elPrice, ds.price ? ("$"+ds.price.toFixed(6)) : "—");
      if(elMc)    setTxt(elMc, ds.mc    ? ("$"+Intl.NumberFormat().format(Math.round(ds.mc))) : "—");
      ok = true;
    } else {
      if(elPrice) setTxt(elPrice, "—");
      if(elMc)    setTxt(elMc, "—");
    }
    const h = await getHolders(window.CONFIG.CONTRACT);
    if (h != null){
      if(elHolders) setTxt(elHolders, Intl.NumberFormat().format(h));
      ok = true;
    } else {
      if(elHolders) setTxt(elHolders, "—");
    }
    if (liveDot){
      liveDot.classList.toggle("ok", ok);
      liveDot.title = ok ? "Live Feed Active" : "Live Feed Error";
    }
  }
  tick();
  setInterval(tick, window.CONFIG.POLL_MS || 1000);
})();

/* VIOLET_LIVE_FIX_V225 */
(function(){
  "use strict";
  window.CONFIG = Object.assign({ CONTRACT: "4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump", POLL_MS: 1000 }, window.CONFIG || {});

  const $ = (s)=>document.querySelector(s);
  const setTxt = (el, v)=>{ if(el) el.textContent = v; };

  function target(sel){
    const wrap = document.querySelector(sel);
    if (!wrap) return null;
    return wrap.querySelector('.v') || wrap;
  }

  const elPrice   = target('[data-price]');
  const elMc      = target('[data-mc]');
  const elHolders = target('[data-holders]');
  const liveDot   = document.querySelector('[data-live-dot]');

  async function j(url){
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error("HTTP "+r.status);
    return await r.json();
  }

  async function getPriceMc(){
    try{
      const d = await j("https://api.dexscreener.com/latest/dex/tokens/" + window.CONFIG.CONTRACT);
      const p = d && d.pairs && d.pairs[0];
      if(!p) return null;
      const price = Number(p.priceUsd || 0);
      let mc = Number(p.fdv || 0);
      if(!mc && price) mc = price * 1000000000;
      return { price, mc };
    }catch(e){
      console.log("Price/MC err", e);
      return null;
    }
  }

  async function getHolders(){
    const ca = window.CONFIG.CONTRACT;
    const urls = [
      "https://public-api.solscan.io/token/holders?tokenAddress="+ca+"&offset=0&limit=1",
      "https://public-api.solscan.io/token/meta?tokenAddress="+ca
    ];
    for (let u of urls){
      try{
        const d = await j(u);
        if (typeof d?.total === "number") return d.total;
        if (typeof d?.data?.total === "number") return d.data.total;
        if (typeof d?.holders === "number") return d.holders;
        if (typeof d?.holder === "number") return d.holder;
        if (typeof d?.holder_count === "number") return d.holder_count;
      }catch(e){ console.log("holders err on", u, e); }
    }
    return null;
  }

  async function tick(){
    let ok = false;

    const ds = await getPriceMc();
    if(ds){
      if(elPrice) setTxt(elPrice, ds.price ? ("$"+ds.price.toFixed(6)) : "—");
      if(elMc)    setTxt(elMc, ds.mc    ? ("$"+Intl.NumberFormat().format(Math.round(ds.mc))) : "—");
      ok = true;
    } else {
      if(elPrice) setTxt(elPrice, "—");
      if(elMc)    setTxt(elMc, "—");
    }

    const h = await getHolders();
    if (h != null){
      if(elHolders) setTxt(elHolders, Intl.NumberFormat().format(h));
      ok = true;
    } else if (elHolders){
      setTxt(elHolders, "—");
    }

    if (liveDot){
      liveDot.classList.toggle("ok", ok);
      liveDot.title = ok ? "Live Feed Active" : "Live Feed Error";
    }
  }

  tick();
  setInterval(tick, window.CONFIG.POLL_MS || 1000);

  function sizeChart(){
    const wrap = document.querySelector(".chart-wrap .ratio");
    if (!wrap) return;
    const w = wrap.getBoundingClientRect().width;
    const h = Math.max(w*1.2, window.innerHeight*0.66);
    wrap.style.position = "relative";
    wrap.style.paddingTop = "0";
    wrap.style.height = h+"px";
    const iframe = wrap.querySelector("iframe");
    if (iframe){
      iframe.style.height = "100%";
      iframe.style.width  = "100%";
    }
  }
  window.addEventListener("resize", sizeChart, { passive: true });
  sizeChart();

})(); 
/* VIOLET_LIVE_FIX_V225_END */


/* === VIOLET SAFE LIVE (injected) === */
const VSAFE = (function(){
  const WORKER = 'https://empty-silence-880a.7fpghxkwx7.workers.dev';
  const CA = '4JLmssPLSPyE4dueZPM4cWupgPV4xniuQaHt319tpump';
  const POLL_MS = (window.CONFIG && window.CONFIG.POLL_MS) || 15000;
  const TRADES_MS = (window.CONFIG && window.CONFIG.TRADES_POLL_MS) || 5000;

  function q(s){ return document.querySelector(s); }
  function set(el, v){ if(el) el.textContent = v; }
  function nf(n){ return Intl.NumberFormat().format(Math.round(Number(n))); }
  async function jget(u, opt){ try{ const r = await fetch(u, opt); if(!r.ok) throw new Error('HTTP '+r.status); return await r.json(); }catch(e){ console.warn('GET', u, e.message); return null; } }

  async function priceMC(ca){
    // Dexscreener by token
    const j = await jget('https://api.dexscreener.com/latest/dex/tokens/'+ca);
    const p = j && j.pairs && j.pairs[0];
    if(!p) return null;
    const price = parseFloat(p.priceUsd||0);
    let mc = parseFloat(p.fdv||p.fv||0);
    if(!mc && price) mc = price*1_000_000_000;
    return {price, mc};
  }

  async function holders(){
    // Worker first
    let j = await jget(WORKER + '/api/holders', { cache:'no-store' });
    if(j && typeof j.holders === 'number') return j.holders;
    // Solscan fallback
    j = await jget('https://public-api.solscan.io/token/holders?tokenAddress='+CA+'&offset=0&limit=1');
    if(j){ if(typeof j.total==='number') return j.total; if(j.data && typeof j.data.total==='number') return j.data.total; }
    return null;
  }

  async function trades(){
    // Worker first
    let j = await jget(WORKER + '/api/trades', { cache:'no-store' });
    if(j && Array.isArray(j.items)) return j.items;
    return [];
  }

  async function updateHUD(){
    try{
      const priceEl = q('[data-price] .v');
      const mcEl    = q('[data-mc] .v');
      const holdEl  = q('[data-holders] .v');
      set(priceEl, '—'); set(mcEl,'—'); set(holdEl,'—');
      const ds = await priceMC(CA);
      if(ds){ set(priceEl, '$'+Number(ds.price).toFixed(6)); set(mcEl, '$'+nf(ds.mc)); }
      const h = await holders();
      if(h!=null) set(holdEl, nf(h));
      const dot = document.querySelector('.feed .live-dot');
      if(dot) dot.classList.toggle('ok', !!ds || h!=null);
    }catch(e){ console.error('updateHUD', e); }
  }

  function renderTrades(items){
    const list = document.getElementById('feed-list');
    if(!list) return;
    if(!items || !items.length){ list.innerHTML = '<div style="opacity:.7">No recent trades yet</div>'; return; }
    const html = items.slice(0,10).map(t=>{
      const d = new Date(typeof t.ts==='number'?t.ts:Date.now());
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      const ss = String(d.getSeconds()).padStart(2,'0');
      const time = `${hh}:${mm}:${ss}`;
      const side = (t.side||'').toString().replace(/_/g,' ');
      const amt = t.amount?Number(t.amount).toLocaleString():'';
      const price = t.price?('$'+Number(t.price).toFixed(6)):'';
      const qty = t.amount?fmtCompact(Number(t.amount))+' VLT':'';
      const usd = (t.amount && t.price)?fmtUSD(Number(t.amount)*Number(t.price)):'';
      return `<div class="feed-row"><span class="t">${time}</span> <span class="s ${side.toLowerCase().includes('buy')?'buy':'sell'}">${side.toUpperCase()}</span> <span class="a">${qty}</span> <span class="usd">${usd}</span></div>`;
    }).join('');
    list.innerHTML = html;
  }

  async function tickTrades(){
    try{ const items = await trades(); renderTrades(items); }
    catch(e){ console.warn('tickTrades', e.message); }
  }

  function start(){
    updateHUD(); tickTrades();
    setInterval(updateHUD, POLL_MS);
    setInterval(tickTrades, TRADES_MS);
  }
  return { start };
})();
function fmtCompact(n){
  if(!isFinite(n)) return '';
  const abs = Math.abs(n);
  if(abs >= 1e9) return (n/1e9).toFixed(abs<1.5e9?2:1)+'B';
  if(abs >= 1e6) return (n/1e6).toFixed(abs<1.5e6?2:1)+'M';
  if(abs >= 1e3) return (n/1e3).toFixed(1)+'K';
  return n.toFixed(0);
}
function fmtUSD(n){
  if(!isFinite(n)) return '';
  const abs = Math.abs(n);
  if(abs >= 1e9) return '$'+(n/1e9).toFixed(2)+'B';
  if(abs >= 1e6) return '$'+(n/1e6).toFixed(2)+'M';
  if(abs >= 1e3) return '$'+(n/1e3).toFixed(2)+'K';
  return '$'+n.toFixed(2);
}
/* === /VIOLET SAFE LIVE === */


document.addEventListener('DOMContentLoaded', function(){
  try { VSAFE.start(); } catch(e){ console.error('VSAFE start', e); }
});


// Remove chart loading state after iframe paints
window.addEventListener('load', function(){
  setTimeout(function(){
    var c = document.querySelector('.chart.loading');
    if(c) c.classList.remove('loading');
  }, 2500);
});


// CA COPY logic with COPIED feedback
document.addEventListener('click', function(e){
  const btn = e.target.closest('.ca-copy');
  if(!btn) return;
  const ca = btn.getAttribute('data-ca') || (window.CONFIG && window.CONFIG.CONTRACT) || '';
  if(!ca) return;
  try{
    navigator.clipboard.writeText(ca);
    const prev = btn.textContent;
    btn.textContent = 'COPIED';
    setTimeout(()=> btn.textContent = prev, 1400);
  }catch(err){
    console.warn('copy fail', err);
  }
});


// Equalize HUD columns height fallback
function equalizeHUD(){
  const hud = document.querySelector('.hud-grid');
  if(!hud) return;
  const a = hud.children[0], b = hud.children[1];
  if(!a || !b) return;
  a.style.height = b.style.height = 'auto';
  const h = Math.max(a.getBoundingClientRect().height, b.getBoundingClientRect().height);
  a.style.height = b.style.height = h+'px';
}
window.addEventListener('load', equalizeHUD);
window.addEventListener('resize', function(){ clearTimeout(window.__hud_t); window.__hud_t = setTimeout(equalizeHUD, 80); });


// Stronger equalization - match heights exactly and keep synced with content changes
function equalizeHUD(){
  const hud = document.querySelector('.hud-grid');
  if(!hud) return;
  const left = hud.children[0];
  const right = hud.children[1];
  if(!left || !right) return;
  // reset
  left.style.height = right.style.height = 'auto';
  // compute tallest
  const h = Math.max(left.getBoundingClientRect().height, right.getBoundingClientRect().height);
  left.style.height = right.style.height = h + 'px';
  // ensure chart iframe fills
  const ifr = left.querySelector('iframe');
  if(ifr){ ifr.style.height = '100%'; }
}
// Mutation observer to keep equalized
let __hudObs = null;
function observeHUD(){
  const hud = document.querySelector('.hud-grid');
  if(!hud) return;
  if(__hudObs) { __hudObs.disconnect(); __hudObs = null; }
  __hudObs = new MutationObserver(()=>{ equalizeHUD(); });
  __hudObs.observe(hud, {childList:true, subtree:true});
}
window.addEventListener('load', function(){ setTimeout(function(){ observeHUD(); equalizeHUD(); }, 400); });
window.addEventListener('resize', function(){ clearTimeout(window.__hud_r); window.__hud_r = setTimeout(equalizeHUD, 80); });

function equalizeHUDStrong(){
  var hud = document.querySelector('.hud-grid'); if(!hud) return;
  var a = hud.children[0], b = hud.children[1]; if(!a || !b) return;
  // reset
  a.style.height = b.style.height = 'auto';
  // compute including padding
  var h = Math.max(a.offsetHeight, b.offsetHeight);
  a.style.height = h+'px'; b.style.height = h+'px';
  var ifr = a.querySelector('iframe'); if(ifr) ifr.style.height = '100%';
}
window.addEventListener('load', function(){ setTimeout(equalizeHUDStrong, 400); });
window.addEventListener('resize', function(){ clearTimeout(window.__eqT); window.__eqT=setTimeout(equalizeHUDStrong, 80); });

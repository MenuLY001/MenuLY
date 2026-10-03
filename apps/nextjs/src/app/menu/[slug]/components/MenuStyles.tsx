export function MenuStyles() {
  return (
    <style>{`
      .mly-menu-hidden { display: none; }
      .mly-root { min-height:100dvh; background:#0f0f13; color:#f2f2f5; font-family:'Inter',system-ui,-apple-system,sans-serif; padding-bottom:120px; -webkit-font-smoothing:antialiased; }
      
      .mly-container { max-width: 1100px; margin: 0 auto; position: relative; width: 100%; }

      /* Splash */
      .mly-splash { position:fixed; inset:0; z-index:9999; background:#080808; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 32px 48px; overflow:hidden; animation:mlySplashIn .6s ease both; }
      .mly-splash--fading { animation:mlySplashOut .5s ease forwards; }
      .mly-splash__blob { position:absolute; border-radius:50%; pointer-events:none; }
      .mly-splash__blob--1 { width:420px; height:420px; background:radial-gradient(ellipse at center,#c84b0c 0%,#a03808 30%,transparent 70%); filter:blur(60px); top:-120px; right:-120px; opacity:.85; animation:mlyBlobDrift1 9s ease-in-out infinite alternate; }
      .mly-splash__blob--2 { width:380px; height:380px; background:radial-gradient(ellipse at center,#d4620a 0%,#b04a08 35%,transparent 70%); filter:blur(70px); bottom:-80px; left:-100px; opacity:.75; animation:mlyBlobDrift2 11s ease-in-out infinite alternate; }
      .mly-splash__blob--3 { width:260px; height:260px; background:radial-gradient(ellipse at center,#e8720c 0%,#c45a08 40%,transparent 70%); filter:blur(55px); top:38%; right:-60px; opacity:.5; animation:mlyBlobDrift3 13s ease-in-out infinite alternate; }
      .mly-splash__blob--4 { width:300px; height:300px; background:radial-gradient(ellipse at center,#b84208 0%,#8a3006 40%,transparent 70%); filter:blur(80px); top:-60px; left:-80px; opacity:.55; animation:mlyBlobDrift1 14s ease-in-out infinite alternate-reverse; }
      .mly-splash__logo-wrap { margin-bottom:32px; animation:mlySplashItemIn .7s .2s ease both; }
      .mly-splash__logo-card { width:104px; height:104px; border-radius:28px; background:rgba(20,16,14,.75); backdrop-filter:blur(24px); border:1.5px solid rgba(255,255,255,.12); box-shadow:0 12px 48px rgba(0,0,0,.7),inset 0 1px 0 rgba(255,255,255,.1); display:flex; align-items:center; justify-content:center; overflow:hidden; }
      .mly-splash__logo-img { width:100%; height:100%; object-fit:cover; }
      .mly-splash__logo-emoji { font-size:44px; line-height:1; }
      .mly-splash__name { font-size:clamp(32px,8vw,48px); font-weight:900; letter-spacing:-1.5px; color:#f2f2f5; text-align:center; line-height:1.1; margin-bottom:16px; animation:mlySplashItemIn .7s .3s ease both; }
      .mly-splash__tagline { font-size:16px; color:rgba(242,242,245,.55); text-align:center; line-height:1.6; margin-bottom:40px; animation:mlySplashItemIn .7s .4s ease both; }
      .mly-splash__dots { display:flex; gap:8px; margin-bottom:44px; animation:mlySplashItemIn .7s .5s ease both; }
      .mly-splash__dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.2); }
      .mly-splash__dot--active { width:24px; border-radius:4px; }
      .mly-splash__cta { display:inline-flex; align-items:center; gap:8px; padding:16px 36px; color:#fff; font-size:17px; font-weight:700; border-radius:999px; border:none; cursor:pointer; font-family:inherit; transition:transform .2s,opacity .2s; animation:mlySplashItemIn .7s .55s ease both; margin-bottom:0; width:100%; max-width:300px; justify-content:center; }
      .mly-splash__cta:hover { transform:translateY(-2px); opacity:.92; }
      .mly-splash__cta:active { transform:scale(.97); }

      /* Sticky Header */
      .mly-header { position:sticky; top:0; z-index:100; background:rgba(15,15,19,.92); backdrop-filter:blur(16px); border-bottom:1px solid rgba(255,255,255,.06); display:flex; flex-direction:column; }
      .mly-header__top { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; height:60px; max-width: 1100px; margin: 0 auto; width: 100%; box-sizing: border-box; }
      .mly-header__brand { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
      .mly-header__logo { width:36px; height:36px; border-radius:10px; object-fit:cover; border:1px solid rgba(255,255,255,.1); flex-shrink:0; }
      .mly-header__logo-placeholder { width:36px; height:36px; border-radius:10px; background:#1e1e28; display:flex; align-items:center; justify-content:center; font-size:18px; border:1px solid rgba(255,255,255,.1); flex-shrink:0; }
      .mly-header__name { font-size:17px; font-weight:800; letter-spacing:-.4px; color:#f2f2f5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      
      .mly-header__actions { display:flex; align-items:center; gap:6px; flex-shrink:0; }
      .mly-icon-btn { width:40px; height:40px; border-radius:50%; background:none; border:none; color:#f2f2f5; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s; }
      .mly-icon-btn:hover { background:rgba(255,255,255,.08); }

      /* Search Full Width */
      .mly-search-full { display:flex; align-items:center; gap:10px; width:100%; background:rgba(255,255,255,.08); border-radius:999px; padding:0 14px; height:44px; border:1px solid rgba(255,255,255,.1); }
      .mly-search-full__input { flex:1; background:none; border:none; outline:none; color:#fff; font-size:15px; font-family:inherit; }
      .mly-search-full__input::placeholder { color:#888; }
      .mly-search-full__close { background:none; border:none; color:#888; display:flex; align-items:center; justify-content:center; padding:4px; cursor:pointer; }
      .mly-search-full__close:hover { color:#fff; }

      /* Category Bar (Bottom of Header) */
      .mly-header__bottom { padding:0 16px 10px; display:flex; align-items:center; justify-content:space-between; gap:12px; max-width: 1100px; margin: 0 auto; width: 100%; box-sizing: border-box; }
      .mly-cat-bar { display:flex; align-items:center; gap:8px; overflow-x:auto; scrollbar-width:none; scroll-behavior:smooth; flex:1; padding-bottom:4px; scroll-snap-type:x mandatory; }
      .mly-cat-bar::-webkit-scrollbar { display:none; }
      .mly-cat-bar::after { content:''; padding-right:16px; }
      .mly-cat-pill { flex-shrink:0; font-size:13px; font-weight:700; color:rgba(242,242,245,.5); padding:8px 14px; border-radius:999px; background:rgba(255,255,255,.04); border:1px solid transparent; cursor:pointer; transition:all .2s; font-family:inherit; white-space:nowrap; scroll-snap-align:start; }
      .mly-cat-pill:hover { color:#f2f2f5; background:rgba(255,255,255,.08); }
      .mly-cat-pill--active { color:#fff; background:var(--brand,#e67e22); border-color:rgba(255,255,255,.2); box-shadow:0 2px 10px rgba(0,0,0,.2); }

      /* Veg Toggle */
      .mly-veg-filter { display:flex; align-items:center; gap:6px; flex-shrink:0; background:rgba(255,255,255,.04); padding:6px 10px; border-radius:999px; border:1px solid rgba(255,255,255,.06); }
      .mly-veg-toggle { position:relative; width:32px; height:18px; cursor:pointer; display:inline-block; }
      .mly-veg-toggle input { opacity:0; width:0; height:0; position:absolute; }
      .mly-veg-toggle__slider { position:absolute; cursor:pointer; inset:0; background-color:#d1d5db; transition:.2s; border-radius:18px; }
      .mly-veg-toggle__slider:before { position:absolute; content:""; height:14px; width:14px; left:2px; bottom:2px; background-color:white; transition:.2s; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,.3); }
      .mly-veg-toggle input:checked + .mly-veg-toggle__slider { background-color:#22c55e; }
      .mly-veg-toggle input:checked + .mly-veg-toggle__slider:before { transform:translateX(14px); }
      .mly-veg-toggle__label { font-size:11px; font-weight:700; color:#aaa; letter-spacing:.3px; text-transform:uppercase; }

      /* Sections */
      .mly-section-header { padding:24px 16px 12px; }
      .mly-section-title { font-size:20px; font-weight:800; color:#f2f2f5; letter-spacing:-.4px; margin:0; display:flex; align-items:baseline; gap:8px; }
      .mly-section-count { font-size:14px; font-weight:600; color:rgba(255,255,255,.3); letter-spacing:0; }

      /* Special Row */
      .mly-special__scroll { display:flex; gap:16px; overflow-x:auto; padding:4px 16px 16px; scrollbar-width:none; scroll-snap-type:x mandatory; }
      .mly-special__scroll::-webkit-scrollbar { display:none; }
      .mly-special__scroll::after { content:''; padding-right:16px; }
      
      .mly-special-card { flex-shrink:0; width:78vw; max-width:320px; background:rgba(255,255,255,.04); backdrop-filter:blur(16px); border-radius:20px; border:1px solid rgba(255,255,255,.08); box-shadow:inset 0 1px 0 rgba(255,255,255,.08); overflow:hidden; transition:transform .2s,box-shadow .2s; cursor:pointer; position:relative; scroll-snap-align:start; }
      .mly-special-card--soldout { opacity:.5; filter:grayscale(80%); pointer-events:none; }
      .mly-special-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.3); border-color:rgba(255,255,255,.15); }
      .mly-special-card__img-wrap { height:180px; overflow:hidden; position:relative; }
      .mly-special-card__img { width:100%; height:100%; object-fit:cover; transition:transform .4s; }
      .mly-special-card:hover .mly-special-card__img { transform:scale(1.05); }
      .mly-special-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:48px; background:rgba(255,255,255,.03); }
      .mly-special-card__body { padding:14px 16px; }
      .mly-special-card__name { font-size:16px; font-weight:700; color:#f2f2f5; margin-bottom:4px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-special-card__desc { font-size:13px; color:#999; margin-bottom:12px; line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      
      .mly-pop-card__price-group { display:flex; align-items:center; gap:8px; }
      .mly-pop-card__price { font-size:16px; font-weight:800; color:#fff; }

      /* Sold Out Overlay */
      .mly-soldout-overlay { position:absolute; inset:0; background:rgba(0,0,0,.4); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px; font-weight:800; text-transform:uppercase; letter-spacing:1px; z-index:10; }
      .mly-soldout-overlay--small { font-size:11px; }

      /* Veg dot */
      .mly-veg-dot { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; border:1.5px solid; flex-shrink:0; }
      .mly-veg-dot span { width:7px; height:7px; border-radius:50%; display:block; }

      /* List items */
      .mly-main { padding:0 0 16px; }
      .mly-category-section { scroll-margin-top: 120px; }
      .mly-item-list { display:grid; grid-template-columns:1fr; gap:1px; background:rgba(255,255,255,.04); border-top:1px solid rgba(255,255,255,.08); border-bottom:1px solid rgba(255,255,255,.08); }
      
      @media(min-width: 768px) {
        .mly-item-list { grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; background:none; border:none; padding: 0 16px; }
        .mly-item { border-radius:18px !important; border:1px solid rgba(255,255,255,.08) !important; }
      }

      .mly-item { background:#15151a; overflow:hidden; transition:background .2s; cursor:pointer; position:relative; }
      .mly-item:hover { background:#1c1c24; }
      .mly-item--unavailable { opacity:.5; filter:grayscale(80%); pointer-events:none; }
      .mly-item__body { display:flex; gap:14px; padding:16px; align-items:flex-start; }
      
      .mly-item__img-wrap { width:96px; height:96px; border-radius:12px; overflow:hidden; flex-shrink:0; box-shadow:0 4px 12px rgba(0,0,0,.2); position:relative; }
      .mly-item__img { width:100%; height:100%; object-fit:cover; transition:transform .4s; }
      .mly-item:hover .mly-item__img { transform:scale(1.05); }
      .mly-item__img-placeholder { width:100%; height:100%; background:rgba(255,255,255,.03); display:flex; align-items:center; justify-content:center; font-size:32px; }
      
      .mly-item__info { flex:1; min-width:0; display:flex; flex-direction:column; min-height:96px; }
      .mly-item__top-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
      .mly-item__name { font-size:16px; font-weight:700; color:#f2f2f5; line-height:1.3; letter-spacing:-.2px; margin:0 0 4px; }
      .mly-item__desc { font-size:13px; color:rgba(242,242,245,.6); line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0 0 10px; }
      
      .mly-item__footer { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:auto; }
      .mly-item__price { font-size:16px; font-weight:800; color:#fff; }
      .mly-item__add { width:32px; height:32px; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; color:#fff; font-size:18px; line-height:1; cursor:pointer; transition:transform .2s; padding:0; margin:0; }
      .mly-item__add:hover { transform:scale(1.08); }
      .mly-item__add:active { transform:scale(0.92); }
      .mly-item__unavailable { font-size:12px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:1px; }

      .mly-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; padding:80px 20px; color:#888; font-size:16px; text-align:center; }

      /* Footer */
      .mly-footer { padding:40px 20px 60px; text-align:center; }
      .mly-footer__hours { font-size:14px; font-weight:600; color:#fff; margin-bottom:12px; }
      .mly-footer__powered { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:rgba(255,255,255,.4); }
      .mly-footer__powered a { color:var(--brand,#e67e22); font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:5px; }
      .mly-footer__powered img { width:14px; height:14px; border-radius:2px; }

      /* Floating Menu Button */
      .mly-fab { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:900; color:#fff; border:none; padding:12px 24px; border-radius:999px; font-size:15px; font-weight:700; font-family:inherit; display:flex; align-items:center; gap:8px; cursor:pointer; transition:transform .2s; }
      .mly-fab:hover { transform:translateX(-50%) scale(1.03); }
      .mly-fab:active { transform:translateX(-50%) scale(0.97); }

      /* Bottom Sheet General */
      .mly-sheet-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.65); backdrop-filter:blur(6px); animation:mlyFadeIn .25s ease; touch-action:none; }
      .mly-sheet { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:600px; z-index:1001; background:#13131a; border-radius:24px 24px 0 0; max-height:90dvh; overflow-y:auto; overflow-x:hidden; scrollbar-width:none; animation:mlySheetUp .35s cubic-bezier(.32,.72,0,1); box-shadow:0 -4px 40px rgba(0,0,0,.7); padding-bottom:env(safe-area-inset-bottom); }
      .mly-sheet::-webkit-scrollbar { display:none; }
      
      .mly-sheet__header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 12px; position:sticky; top:0; background:rgba(19,19,26,.95); backdrop-filter:blur(12px); z-index:2; }
      .mly-sheet__title { font-size:18px; font-weight:800; color:#fff; margin:0; }
      .mly-sheet__close { width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,.08); border:none; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; }
      
      /* Categories Sheet */
      .mly-cat-sheet__list { padding:8px 12px 24px; display:flex; flex-direction:column; gap:4px; }
      .mly-cat-sheet__item { width:100%; text-align:left; background:none; border:none; padding:16px 20px; font-size:16px; font-weight:600; color:#f2f2f5; font-family:inherit; cursor:pointer; border-radius:14px; transition:background .2s; display:flex; align-items:center; justify-content:space-between; }
      .mly-cat-sheet__item:hover { background:rgba(255,255,255,.06); }
      .mly-cat-sheet__count { font-size:14px; color:#888; font-weight:700; background:rgba(255,255,255,.05); padding:4px 10px; border-radius:999px; }

      /* Item Detail Sheet (Hero) */
      .mly-sheet__hero { position:relative; height:280px; overflow:hidden; background:#0f0f13; border-radius:24px 24px 0 0; }
      .mly-sheet__hero-img { width:100%; height:100%; object-fit:cover; display:block; }
      .mly-sheet__hero-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:72px; background:linear-gradient(135deg,#1a1a24,#0f0f13); }
      .mly-sheet__back { position:absolute; top:16px; left:16px; width:40px; height:40px; border-radius:50%; background:rgba(0,0,0,.55); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; transition:background .2s; }
      
      .mly-sheet__content { padding:24px 24px 40px; }
      .mly-sheet__title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:16px; }
      .mly-sheet__name-line { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:6px; }
      .mly-sheet__name { font-size:24px; font-weight:800; color:#f2f2f5; letter-spacing:-.4px; margin:0; line-height:1.2; }
      .mly-sheet__price { font-size:24px; font-weight:900; white-space:nowrap; color:#fff; }
      .mly-sheet__section-title { font-size:14px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.8px; margin:0 0 12px; }
      .mly-sheet__desc { font-size:15px; color:rgba(242,242,245,.75); line-height:1.65; margin:0 0 24px; }
      .mly-sheet__qty-row { display:flex; align-items:center; justify-content:center; margin:8px 0 24px; }
      .mly-sheet__qty { display:flex; align-items:center; background:#1a1a24; border-radius:999px; border:1px solid rgba(255,255,255,.1); overflow:hidden; }
      .mly-sheet__qty-btn { width:54px; height:54px; background:none; border:none; color:#f2f2f5; font-size:24px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .2s; font-family:inherit; }
      .mly-sheet__qty-btn:hover { background:rgba(255,255,255,.08); }
      .mly-sheet__qty-val { min-width:48px; text-align:center; font-size:20px; font-weight:800; color:#f2f2f5; }
      .mly-sheet__order-btn { width:100%; padding:20px 24px; color:#fff; font-size:17px; font-weight:800; border-radius:18px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; font-family:inherit; transition:transform .2s,opacity .2s; }
      .mly-sheet__order-btn:hover { transform:translateY(-2px); opacity:.92; }
      .mly-sheet__order-btn:active { transform:scale(.98); }
      .mly-sheet__unavailable-banner { width:100%; padding:16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:14px; text-align:center; font-size:15px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:1px; }

      /* Cart Sheet */
      .mly-cart-items { padding:8px 24px 24px; display:flex; flex-direction:column; gap:16px; }
      .mly-cart-empty { text-align:center; padding:40px 0; color:#888; font-size:16px; font-weight:500; }
      .mly-cart-item { display:flex; align-items:center; gap:12px; background:rgba(255,255,255,.04); padding:12px; border-radius:16px; }
      .mly-cart-item__img { width:48px; height:48px; border-radius:10px; object-fit:cover; }
      .mly-cart-item__img-placeholder { width:48px; height:48px; border-radius:10px; background:rgba(255,255,255,.05); display:flex; align-items:center; justify-content:center; font-size:20px; }
      .mly-cart-item__info { flex:1; min-width:0; }
      .mly-cart-item__name { font-size:15px; font-weight:700; color:#f2f2f5; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .mly-cart-item__price { font-size:13px; color:#888; margin-top:2px; }
      .mly-cart-item__controls { display:flex; align-items:center; gap:8px; background:#1a1a24; padding:4px; border-radius:999px; }
      .mly-qty-btn { width:28px; height:28px; border-radius:50%; background:none; border:none; color:#f2f2f5; font-size:18px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:600; transition:background .2s; }
      .mly-qty-btn:hover { background:rgba(255,255,255,.1); }
      .mly-qty-val { font-size:15px; font-weight:800; min-width:20px; text-align:center; color:#fff; }
      .mly-cart-item__subtotal { font-size:15px; font-weight:800; color:#fff; text-align:right; min-width:60px; }
      .mly-cart-footer { padding:20px 24px calc(20px + env(safe-area-inset-bottom)); border-top:1px solid rgba(255,255,255,.08); display:flex; flex-direction:column; gap:16px; }
      .mly-cart-total { display:flex; justify-content:space-between; align-items:center; font-size:16px; font-weight:600; color:#888; }
      .mly-cart-total__price { font-size:24px; font-weight:800; color:#fff; }
      .mly-cart-waiter-btn { width:100%; padding:18px; color:#fff; font-size:17px; font-weight:800; border-radius:16px; border:none; cursor:pointer; transition:transform .2s,opacity .2s; font-family:inherit; }
      .mly-cart-waiter-btn:hover { opacity:.92; transform:translateY(-2px); }
      
      /* Waiter Overlay */
      .mly-waiter-overlay { position:fixed; inset:0; background:#0f0f13; z-index:9999; display:flex; align-items:center; justify-content:center; padding:24px; animation:mlyFadeIn .3s ease; }
      .mly-waiter-card { width:100%; max-width:480px; background:#1a1a24; border-radius:24px; padding:32px 24px; box-shadow:0 24px 64px rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.08); }
      .mly-waiter-header { text-align:center; margin-bottom:20px; }
      .mly-waiter-badge { display:inline-block; background:rgba(255,255,255,.1); color:#fff; font-size:13px; font-weight:700; padding:6px 16px; border-radius:999px; margin-bottom:12px; }
      .mly-waiter-restaurant { font-size:26px; font-weight:900; color:#fff; margin:0; }
      .mly-waiter-divider { height:1px; background:rgba(255,255,255,.08); margin:20px 0; }
      .mly-waiter-items { display:flex; flex-direction:column; gap:14px; max-height:45dvh; overflow-y:auto; scrollbar-width:none; }
      .mly-waiter-items::-webkit-scrollbar { display:none; }
      .mly-waiter-item { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
      .mly-waiter-item__left { display:flex; gap:12px; align-items:flex-start; min-width:0; }
      .mly-waiter-item__qty { font-size:18px; font-weight:900; color:var(--brand); flex-shrink:0; }
      .mly-waiter-item__name { font-size:17px; font-weight:600; color:#fff; line-height:1.4; }
      .mly-waiter-item__price { font-size:18px; font-weight:800; color:#888; flex-shrink:0; text-align:right; }
      .mly-waiter-total { display:flex; justify-content:space-between; align-items:center; font-size:18px; font-weight:700; color:#888; margin-bottom:32px; }
      .mly-waiter-total__price { font-size:32px; font-weight:900; color:#fff; }
      .mly-waiter-done { width:100%; padding:20px; color:#fff; font-size:17px; font-weight:800; border-radius:18px; border:none; cursor:pointer; font-family:inherit; transition:opacity .2s; margin-bottom:12px; }
      .mly-waiter-done:hover { opacity:.9; }
      .mly-waiter-clear { width:100%; padding:14px; background:none; border:none; color:#888; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; transition:color .2s; }
      .mly-waiter-clear:hover { color:#ef4444; }

      @keyframes mlyFadeIn { from{opacity:0;} to{opacity:1;} }
      @keyframes mlySheetUp { from{transform:translate(-50%,100%)} to{transform:translate(-50%,0)} }
      @keyframes mlySplashIn { from{opacity:0} to{opacity:1} }
      @keyframes mlySplashOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.03)} }
      @keyframes mlySplashItemIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mlyBlobDrift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,30px) scale(1.15)} }
      @keyframes mlyBlobDrift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,-25px) scale(.9)} }
      @keyframes mlyBlobDrift3 { from{transform:translate(-50%,-50%) scale(.8)} to{transform:translate(-50%,-50%) scale(1.2)} }
    `}</style>
  );
}

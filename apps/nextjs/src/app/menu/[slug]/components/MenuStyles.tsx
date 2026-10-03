export function MenuStyles() {
  return (
    <style>{`
      .mly-menu-hidden { display: none; }
      .mly-root { min-height:100dvh; background:#0f0f13; color:#f2f2f5; font-family:'Inter',system-ui,-apple-system,sans-serif; padding-bottom:60px; -webkit-font-smoothing:antialiased; }

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

      /* Header */
      .mly-header { padding:20px 20px 16px; position:sticky; top:0; z-index:100; background:rgba(15,15,19,.92); backdrop-filter:blur(16px); border-bottom:1px solid rgba(255,255,255,.06); }
      .mly-header__brand { display:flex; align-items:center; gap:12px; }
      .mly-header__logo { width:44px; height:44px; border-radius:12px; object-fit:cover; border:2px solid rgba(255,255,255,.1); }
      .mly-header__logo-placeholder { width:44px; height:44px; border-radius:12px; background:#1e1e28; display:flex; align-items:center; justify-content:center; font-size:22px; border:2px solid rgba(255,255,255,.1); }
      .mly-header__name { font-size:20px; font-weight:800; letter-spacing:-.5px; color:#f2f2f5; }

      /* Search */
      .mly-search-wrap { padding:12px 16px 8px; }
      .mly-search { display:flex; align-items:center; gap:10px; background:#1a1a24; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:0 16px; height:48px; transition:border-color .2s; }
      .mly-search:focus-within { border-color:var(--brand,#e67e22); }
      .mly-search__icon { color:#666; flex-shrink:0; }
      .mly-search__input { flex:1; background:none; border:none; outline:none; font-size:15px; color:#f2f2f5; font-family:inherit; }
      .mly-search__input::placeholder { color:#555; }
      .mly-search__clear { color:#666; font-size:14px; cursor:pointer; background:none; border:none; padding:0; line-height:1; }

      /* Category Tabs */
      .mly-tabs { padding:10px 0 4px; }
      .mly-tabs__scroll { display:flex; gap:10px; overflow-x:auto; padding:4px 16px 10px; scrollbar-width:none; scroll-behavior:smooth; }
      .mly-tabs__scroll::-webkit-scrollbar { display:none; }
      .mly-tab { flex-shrink:0; min-width:66px; padding:10px 10px 8px; border-radius:18px; cursor:pointer; transition:all .22s; font-family:inherit; white-space:nowrap; display:flex; flex-direction:column; align-items:center; gap:6px; background:rgba(255,255,255,.05); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,.1); box-shadow:inset 0 1px 0 rgba(255,255,255,.07); color:#888; }
      .mly-tab:hover { background:rgba(255,255,255,.1); color:#f2f2f5; border-color:rgba(255,255,255,.22); }
      .mly-tab--active { background:rgba(255,255,255,.1); color:#f2f2f5; }
      .mly-tab__icon { font-size:22px; line-height:1; display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:12px; background:rgba(255,255,255,.07); transition:background .2s; }
      .mly-tab__label { font-size:11px; font-weight:700; letter-spacing:.1px; text-align:center; line-height:1.2; max-width:64px; overflow:hidden; text-overflow:ellipsis; }

      /* Filter bar */
      .mly-filter-bar { display:flex; align-items:center; justify-content:space-between; padding:6px 16px; gap:8px; }
      .mly-filter-pills { display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; }
      .mly-filter-pills::-webkit-scrollbar { display:none; }
      .mly-filter-pill { flex-shrink:0; padding:6px 14px; border-radius:999px; font-size:12px; font-weight:700; color:rgba(242,242,245,.5); background:rgba(255,255,255,.05); backdrop-filter:blur(12px); border:1.5px solid rgba(255,255,255,.08); cursor:pointer; transition:all .22s; font-family:inherit; white-space:nowrap; }
      .mly-filter-pill:hover { color:#f2f2f5; border-color:rgba(255,255,255,.22); background:rgba(255,255,255,.09); }
      .mly-filter-pill--active { color:#fff; }

      /* View toggle */
      .mly-view-toggle { display:flex; gap:2px; background:rgba(255,255,255,.05); backdrop-filter:blur(12px); border-radius:10px; padding:3px; flex-shrink:0; border:1px solid rgba(255,255,255,.08); }
      .mly-view-btn { width:30px; height:30px; border-radius:7px; background:none; border:none; cursor:pointer; color:rgba(242,242,245,.4); display:flex; align-items:center; justify-content:center; transition:all .2s; }
      .mly-view-btn--active { background:rgba(255,255,255,.14); color:#f2f2f5; }

      /* Section */
      .mly-section-header { display:flex; align-items:center; padding:16px 16px 8px; }
      .mly-section-title { font-size:18px; font-weight:700; color:#f2f2f5; letter-spacing:-.3px; }

      /* Special */
      .mly-special { margin-bottom:4px; }
      .mly-special-card { flex-shrink:0; width:200px; background:rgba(255,255,255,.04); backdrop-filter:blur(16px); border-radius:18px; border:1px solid rgba(255,200,50,.3); box-shadow:0 0 20px rgba(255,200,50,.08),inset 0 1px 0 rgba(255,255,255,.08); overflow:hidden; transition:transform .2s,box-shadow .2s; cursor:pointer; position:relative; }
      .mly-special-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(255,200,50,.15); }
      .mly-special-card__badge { position:absolute; top:8px; left:8px; z-index:2; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; font-size:10px; font-weight:800; letter-spacing:.5px; padding:3px 8px; border-radius:999px; box-shadow:0 2px 8px rgba(245,158,11,.4); }
      .mly-special-card__img-wrap { height:120px; overflow:hidden; position:relative; }
      .mly-special-card__img { width:100%; height:100%; object-fit:cover; transition:transform .4s; }
      .mly-special-card:hover .mly-special-card__img { transform:scale(1.06); }
      .mly-special-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; background:rgba(255,200,50,.06); }
      .mly-special-card__body { padding:10px 12px 12px; }
      .mly-special-card__name { font-size:13px; font-weight:700; color:#f2f2f5; margin-bottom:4px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-special-card__desc { font-size:11px; color:#888; margin-bottom:8px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-special-card__footer { display:flex; align-items:center; justify-content:space-between; }

      /* Popular */
      .mly-popular { margin-bottom:4px; }
      .mly-popular__scroll { display:flex; gap:14px; overflow-x:auto; padding:4px 16px 16px; scrollbar-width:none; }
      .mly-popular__scroll::-webkit-scrollbar { display:none; }
      .mly-pop-card { flex-shrink:0; width:150px; background:rgba(255,255,255,.04); backdrop-filter:blur(16px); border-radius:18px; border:1px solid rgba(255,255,255,.1); box-shadow:inset 0 1px 0 rgba(255,255,255,.08); overflow:hidden; transition:transform .2s,box-shadow .2s; cursor:pointer; }
      .mly-pop-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,.5); border-color:rgba(255,255,255,.2); }
      .mly-pop-card__img-wrap { position:relative; height:110px; overflow:hidden; }
      .mly-pop-card__img { width:100%; height:100%; object-fit:cover; transition:transform .4s; }
      .mly-pop-card:hover .mly-pop-card__img { transform:scale(1.06); }
      .mly-pop-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; background:rgba(255,255,255,.04); }
      .mly-pop-card__body { padding:10px 12px 12px; display:flex; flex-direction:column; gap:6px; }
      .mly-pop-card__name { font-size:13px; font-weight:700; color:#f2f2f5; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-pop-card__price-row { display:flex; align-items:center; justify-content:space-between; gap:4px; }
      .mly-pop-card__price { font-size:13px; font-weight:800; }
      .mly-pop-card__price-group { display:flex; align-items:center; gap:5px; }

      /* Veg dot */
      .mly-veg-dot { display:inline-flex; align-items:center; justify-content:center; width:16px; height:16px; border-radius:3px; border:1.5px solid; flex-shrink:0; }
      .mly-veg-dot span { width:7px; height:7px; border-radius:50%; display:block; }

      /* List items */
      .mly-main { padding:0 0 8px; }
      .mly-item-list { display:flex; flex-direction:column; padding:0 16px; gap:10px; }
      .mly-item { background:rgba(255,255,255,.04); backdrop-filter:blur(16px); border-radius:18px; border:1px solid rgba(255,255,255,.1); box-shadow:0 4px 24px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.08); overflow:hidden; animation:mlyFadeIn .35s ease both; transition:border-color .2s,box-shadow .2s,transform .2s; cursor:pointer; position:relative; }
      .mly-item:hover { border-color:rgba(255,255,255,.22); box-shadow:0 8px 32px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.12); transform:translateY(-1px); }
      .mly-item--unavailable { opacity:.42; filter:grayscale(65%); pointer-events:none; }
      .mly-item__special-badge { position:absolute; top:0; left:0; right:0; background:linear-gradient(90deg,rgba(245,158,11,.2),transparent); border-bottom:1px solid rgba(245,158,11,.25); color:#f59e0b; font-size:11px; font-weight:700; padding:4px 14px; letter-spacing:.4px; }
      .mly-item__body { display:flex; gap:14px; padding:14px; align-items:flex-start; }
      .mly-item__img-wrap { width:88px; height:88px; border-radius:14px; overflow:hidden; flex-shrink:0; box-shadow:0 4px 12px rgba(0,0,0,.3); }
      .mly-item__img { width:100%; height:100%; object-fit:cover; transition:transform .4s; }
      .mly-item:hover .mly-item__img { transform:scale(1.07); }
      .mly-item__img-placeholder { width:88px; height:88px; border-radius:14px; background:rgba(255,255,255,.06); display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }
      .mly-item__info { flex:1; min-width:0; display:flex; flex-direction:column; }
      .mly-item__top-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:4px; }
      .mly-item__name { font-size:15px; font-weight:700; color:#f2f2f5; line-height:1.3; letter-spacing:-.2px; margin:0 0 4px; }
      .mly-item__desc { font-size:12px; color:rgba(242,242,245,.55); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0 0 8px; }
      .mly-item__footer { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:auto; }
      .mly-item__price { font-size:16px; font-weight:800; }
      .mly-item__unavailable { font-size:11px; color:#666; font-weight:500; }
      .mly-item__add { width:32px; height:32px; border-radius:50%; color:#fff; font-size:22px; font-weight:700; display:flex; align-items:center; justify-content:center; border:none; cursor:pointer; flex-shrink:0; line-height:1; transition:opacity .15s,transform .15s; }
      .mly-item__add:hover { opacity:.85; }
      .mly-item__add:active { transform:scale(.9); }

      /* Grid */
      .mly-item-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:12px; padding:0 16px; }
      .mly-grid-card { background:rgba(255,255,255,.04); backdrop-filter:blur(16px); border-radius:18px; border:1px solid rgba(255,255,255,.1); box-shadow:0 4px 20px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.08); overflow:hidden; cursor:pointer; position:relative; transition:border-color .2s,box-shadow .2s,transform .2s; animation:mlyFadeIn .35s ease both; }
      .mly-grid-card:hover { transform:translateY(-3px); border-color:rgba(255,255,255,.22); box-shadow:0 10px 28px rgba(0,0,0,.4); }
      .mly-grid-card__img-wrap { height:130px; overflow:hidden; position:relative; }
      .mly-grid-card__img { width:100%; height:100%; object-fit:cover; transition:transform .4s; }
      .mly-grid-card:hover .mly-grid-card__img { transform:scale(1.07); }
      .mly-grid-card__img-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; background:rgba(255,255,255,.04); }
      .mly-grid-card__special { position:absolute; top:8px; left:8px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; font-size:13px; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; }
      .mly-grid-card__body { padding:10px 12px 12px; }
      .mly-grid-card__name { font-size:13px; font-weight:700; color:#f2f2f5; margin-bottom:8px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .mly-grid-card__footer { display:flex; align-items:center; justify-content:space-between; gap:4px; }

      .mly-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px; color:#555; font-size:15px; text-align:center; }

      /* Detail Sheet */
      .mly-sheet-backdrop { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.65); backdrop-filter:blur(6px); animation:mlyFadeIn .25s ease; }
      .mly-sheet { position:fixed; bottom:0; left:0; right:0; z-index:1001; background:#13131a; border-radius:28px 28px 0 0; max-height:92dvh; overflow-y:auto; overflow-x:hidden; scrollbar-width:none; animation:mlySheetUp .35s cubic-bezier(.32,.72,0,1); box-shadow:0 -4px 40px rgba(0,0,0,.7); }
      .mly-sheet::-webkit-scrollbar { display:none; }
      .mly-sheet__hero { position:relative; height:260px; overflow:hidden; background:#0f0f13; }
      .mly-sheet__hero-img { width:100%; height:100%; object-fit:cover; display:block; }
      .mly-sheet__hero-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:72px; background:linear-gradient(135deg,#1a1a24,#0f0f13); }
      .mly-sheet__back { position:absolute; top:16px; left:16px; width:38px; height:38px; border-radius:50%; background:rgba(0,0,0,.55); backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center; color:#fff; cursor:pointer; transition:background .2s; }
      .mly-sheet__back:hover { background:rgba(255,255,255,.15); }
      .mly-sheet__content { padding:20px 20px 40px; }
      .mly-sheet__title-row { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:16px; }
      .mly-sheet__name-line { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
      .mly-sheet__name { font-size:22px; font-weight:800; color:#f2f2f5; letter-spacing:-.4px; margin:0; line-height:1.2; }
      .mly-sheet__price { font-size:22px; font-weight:900; white-space:nowrap; }
      .mly-sheet__section-title { font-size:14px; font-weight:700; color:#888; text-transform:uppercase; letter-spacing:.8px; margin:0 0 8px; }
      .mly-sheet__desc { font-size:14px; color:rgba(242,242,245,.7); line-height:1.65; margin:0 0 20px; }
      .mly-sheet__qty-row { display:flex; align-items:center; justify-content:center; margin:8px 0 24px; }
      .mly-sheet__qty { display:flex; align-items:center; background:#1a1a24; border-radius:999px; border:1px solid rgba(255,255,255,.1); overflow:hidden; }
      .mly-sheet__qty-btn { width:48px; height:48px; background:none; border:none; color:#f2f2f5; font-size:22px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .2s; font-family:inherit; }
      .mly-sheet__qty-btn:hover { background:rgba(255,255,255,.08); }
      .mly-sheet__qty-val { min-width:44px; text-align:center; font-size:18px; font-weight:800; color:#f2f2f5; }
      .mly-sheet__order-btn { width:100%; padding:17px 24px; color:#fff; font-size:16px; font-weight:800; border-radius:18px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; font-family:inherit; transition:transform .2s,opacity .2s; }
      .mly-sheet__order-btn:hover { transform:translateY(-2px); opacity:.92; }
      .mly-sheet__order-btn:active { transform:scale(.98); }
      .mly-sheet__unavailable-banner { width:100%; padding:16px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.1); border-radius:14px; text-align:center; font-size:14px; color:#666; }

      @keyframes mlyFadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mlySheetUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      @keyframes mlySplashIn { from{opacity:0} to{opacity:1} }
      @keyframes mlySplashOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(1.03)} }
      @keyframes mlySplashItemIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mlyBlobDrift1 { from{transform:translate(0,0) scale(1)} to{transform:translate(-40px,30px) scale(1.15)} }
      @keyframes mlyBlobDrift2 { from{transform:translate(0,0) scale(1)} to{transform:translate(30px,-25px) scale(.9)} }
      @keyframes mlyBlobDrift3 { from{transform:translate(-50%,-50%) scale(.8)} to{transform:translate(-50%,-50%) scale(1.2)} }
    `}</style>
  );
}

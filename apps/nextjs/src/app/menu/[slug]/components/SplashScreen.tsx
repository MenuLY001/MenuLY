'use client';
import { useState } from 'react';
import type { Restaurant } from './types';

export function SplashScreen({ restaurant, brand, onDone }: { restaurant: Restaurant; brand: string; onDone: () => void }) {
  const [fading, setFading] = useState(false);
  const go = () => { setFading(true); setTimeout(onDone, 500); };
  
  return (
    <div className={`mly-splash ${fading ? 'mly-splash--fading' : ''}`}>
      <div className="mly-splash__blob mly-splash__blob--1" />
      <div className="mly-splash__blob mly-splash__blob--2" />
      <div className="mly-splash__blob mly-splash__blob--3" />
      <div className="mly-splash__blob mly-splash__blob--4" />
      <div className="mly-splash__logo-wrap">
        <div className="mly-splash__logo-card">
          {restaurant.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={restaurant.logo_url} alt="" className="mly-splash__logo-img" />
            : <span className="mly-splash__logo-emoji">🍽️</span>
          }
        </div>
      </div>
      <h1 className="mly-splash__name">{restaurant.name}</h1>
      <p className="mly-splash__tagline">Explore Flavors<br />At Your Fingertips</p>
      <div className="mly-splash__dots">
        <span className="mly-splash__dot mly-splash__dot--active" />
        <span className="mly-splash__dot" />
        <span className="mly-splash__dot" />
      </div>
      <button className="mly-splash__cta" onClick={go} style={{ background: brand, boxShadow: `0 0 32px ${brand}66,0 8px 24px rgba(0,0,0,.4)` }}>
        Get Started &nbsp;→
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,.3)', marginTop: 16, letterSpacing: '.5px' }}>
        Powered by 
        <a href="https://vyoma.world" target="_blank" rel="noopener noreferrer" style={{ color: brand, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vyoma-logo.jpg" alt="" style={{ width: 14, height: 14, borderRadius: 2 }} />
          vyoma.world
        </a>
      </div>
    </div>
  );
}

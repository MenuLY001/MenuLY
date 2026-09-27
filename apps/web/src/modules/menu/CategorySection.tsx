import React from 'react';
import { Category, MenuItem } from '@qr-menu/types';
import { MenuItemCard } from './MenuItemCard';

interface CategorySectionProps {
  category: Category & { items: MenuItem[] };
  viewMode: 'list' | 'grid';
}

export function CategorySection({ category, viewMode }: CategorySectionProps) {
  if (category.items.length === 0) return null;

  return (
    <section id={`cat-${category.id}`} className="category-section">
      <h2 className="category-section__title">{category.name}</h2>
      <div className={`category-section__grid category-section__grid--${viewMode}`}>
        {category.items.map((item) => (
          <MenuItemCard key={item.id} item={item} viewMode={viewMode} />
        ))}
      </div>

      <style>{`
        .category-section {
          scroll-margin-top: 120px;
        }
        .category-section__title {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          padding: 0 16px 16px;
          position: relative;
        }
        .category-section__title::after {
          content: '';
          display: block;
          width: 40px;
          height: 3px;
          background: var(--brand);
          border-radius: 2px;
          margin-top: 8px;
        }
        .category-section__grid {
          display: grid;
          gap: 16px;
          padding: 0 16px;
        }
        .category-section__grid--list {
          grid-template-columns: 1fr;
        }
        .category-section__grid--grid {
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        }
        
        @media (min-width: 600px) {
          .category-section__grid--list {
            grid-template-columns: repeat(2, 1fr);
          }
          .category-section__grid--grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          }
        }
      `}</style>
    </section>
  );
}

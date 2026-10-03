export function VegDot({ isVeg }: { isVeg?: boolean }) {
  const c = isVeg === false ? '#ef4444' : '#22c55e';
  return (
    <span className="mly-veg-dot" style={{ borderColor: c }}>
      <span style={{ background: c }} />
    </span>
  );
}

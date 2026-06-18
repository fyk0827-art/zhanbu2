export default function PrismBrandSymbol({ size = 72 }: { size?: number }) {
  return (
    <svg viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <circle cx="36" cy="36" r="34" stroke="#E8B951" strokeWidth="0.6" opacity="0.3" />
      <circle cx="36" cy="36" r="28" stroke="#E8B951" strokeWidth="0.4" opacity="0.15" />
      <polygon points="36,10 54,46 18,46" stroke="#E8B951" strokeWidth="1" fill="none" opacity="0.6" />
      <line x1="36" y1="10" x2="36" y2="4" stroke="#E8B951" strokeWidth="0.6" opacity="0.4" />
      <circle cx="36" cy="36" r="3.5" fill="#E8B951" opacity="0.5" />
      <circle cx="36" cy="7" r="1.5" fill="#E8B951" opacity="0.7" />
      <circle cx="56" cy="46" r="1" fill="#E8B951" opacity="0.4" />
      <circle cx="16" cy="46" r="1" fill="#E8B951" opacity="0.4" />
    </svg>
  );
}

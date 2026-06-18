// ===== CIRCULAR LINE DECORATIONS (圆线条装饰) =====

// Rotating concentric circle rings - the core decorative element
export function CircleRings({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 400 400" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outermost ring */}
        <circle cx="200" cy="200" r="195" stroke="rgba(196,162,101,0.12)" strokeWidth="0.5" />
        {/* Dashed ring */}
        <circle cx="200" cy="200" r="175" stroke="rgba(196,162,101,0.08)" strokeWidth="0.5" strokeDasharray="4 8" />
        {/* Main ring */}
        <circle cx="200" cy="200" r="155" stroke="rgba(196,162,101,0.15)" strokeWidth="0.8" />
        {/* Inner dashed */}
        <circle cx="200" cy="200" r="135" stroke="rgba(168,152,184,0.1)" strokeWidth="0.5" strokeDasharray="2 6" />
        {/* Inner solid */}
        <circle cx="200" cy="200" r="115" stroke="rgba(196,162,101,0.12)" strokeWidth="0.5" />
        {/* Center accent ring */}
        <circle cx="200" cy="200" r="95" stroke="rgba(196,162,101,0.08)" strokeWidth="0.3" />
        {/* Small decorative circles at cardinal points */}
        <circle cx="200" cy="5" r="3" fill="rgba(196,162,101,0.15)" />
        <circle cx="200" cy="395" r="3" fill="rgba(196,162,101,0.15)" />
        <circle cx="5" cy="200" r="3" fill="rgba(196,162,101,0.1)" />
        <circle cx="395" cy="200" r="3" fill="rgba(196,162,101,0.1)" />
        {/* Diagonal accent circles */}
        <circle cx="200" cy="55" r="1.5" fill="rgba(168,152,184,0.2)" />
        <circle cx="200" cy="345" r="1.5" fill="rgba(168,152,184,0.2)" />
        <circle cx="55" cy="200" r="1.5" fill="rgba(168,152,184,0.15)" />
        <circle cx="345" cy="200" r="1.5" fill="rgba(168,152,184,0.15)" />
        {/* Arc decorations */}
        <path d="M 80 200 A 120 120 0 0 1 200 80" stroke="rgba(196,162,101,0.06)" strokeWidth="0.5" fill="none" />
        <path d="M 320 200 A 120 120 0 0 0 200 320" stroke="rgba(196,162,101,0.06)" strokeWidth="0.5" fill="none" />
        <path d="M 200 320 A 120 120 0 0 0 80 200" stroke="rgba(168,152,184,0.06)" strokeWidth="0.5" fill="none" />
        <path d="M 200 80 A 120 120 0 0 0 320 200" stroke="rgba(168,152,184,0.06)" strokeWidth="0.5" fill="none" />
      </svg>
    </div>
  );
}

// Rotating circle rings with animation
export function RotatingCircleRings({ size = 360 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative">
      <div className="absolute inset-0 animate-spin-slow">
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <circle cx="200" cy="200" r="198" stroke="rgba(196,162,101,0.08)" strokeWidth="0.4" />
          <circle cx="200" cy="200" r="180" stroke="rgba(196,162,101,0.12)" strokeWidth="0.6" strokeDasharray="3 12" />
          <circle cx="200" cy="200" r="160" stroke="rgba(196,162,101,0.1)" strokeWidth="0.5" />
          <circle cx="200" cy="200" r="140" stroke="rgba(168,152,184,0.08)" strokeWidth="0.4" strokeDasharray="6 10" />
          <circle cx="200" cy="200" r="120" stroke="rgba(196,162,101,0.06)" strokeWidth="0.5" />
        </svg>
      </div>
      {/* Counter-rotating inner */}
      <div className="absolute inset-4" style={{ animation: 'spin-slow 60s linear infinite reverse' }}>
        <svg viewBox="0 0 400 400" className="w-full h-full" fill="none">
          <circle cx="200" cy="200" r="170" stroke="rgba(196,162,101,0.06)" strokeWidth="0.3" strokeDasharray="2 8" />
          <circle cx="200" cy="200" r="150" stroke="rgba(196,155,138,0.08)" strokeWidth="0.4" />
          <circle cx="200" cy="200" r="130" stroke="rgba(196,162,101,0.1)" strokeWidth="0.3" strokeDasharray="4 6" />
        </svg>
      </div>
      {/* Center dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[rgba(196,162,101,0.2)]" />
    </div>
  );
}

// Floating gold dust particles
export function GoldDust() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1.5 + Math.random() * 2,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-star-twinkle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `radial-gradient(circle, rgba(196,162,101,0.5), transparent 70%)`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// Celestial frame with corner decorations (light theme)
export function CelestialFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Corner circles */}
      <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full border border-[rgba(196,162,101,0.3)]" />
      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full border border-[rgba(196,162,101,0.3)]" />
      <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 rounded-full border border-[rgba(196,162,101,0.3)]" />
      <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border border-[rgba(196,162,101,0.3)]" />
      {/* Corner dots */}
      <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-[rgba(196,162,101,0.4)]" />
      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[rgba(196,162,101,0.4)]" />
      <div className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 rounded-full bg-[rgba(196,162,101,0.4)]" />
      <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[rgba(196,162,101,0.4)]" />
      {children}
    </div>
  );
}

// Ornate divider with circles
export function OrnateDivider({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(196,162,101,0.25)] to-transparent" />
      {text ? (
        <span className="text-[10px] tracking-[0.25em] uppercase whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{text}</span>
      ) : (
        <div className="w-1.5 h-1.5 rounded-full bg-[rgba(196,162,101,0.35)]" />
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(196,162,101,0.25)] to-transparent" />
    </div>
  );
}

// Background circle decorations (positioned absolutely)
export function BackgroundCircles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Large circle top-right */}
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full border border-[rgba(196,162,101,0.06)]" />
      <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full border border-[rgba(196,162,101,0.08)]" />
      {/* Large circle bottom-left */}
      <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] rounded-full border border-[rgba(168,152,184,0.05)]" />
      <div className="absolute -bottom-48 -left-48 w-[450px] h-[450px] rounded-full border border-[rgba(168,152,184,0.07)]" />
      {/* Medium accent circles */}
      <div className="absolute top-1/3 -left-20 w-[200px] h-[200px] rounded-full border border-dashed border-[rgba(196,162,101,0.06)]" />
      <div className="absolute bottom-1/4 -right-16 w-[180px] h-[180px] rounded-full border border-dashed border-[rgba(196,162,101,0.05)]" />
      {/* Small filled accent */}
      <div className="absolute top-[15%] right-[10%] w-3 h-3 rounded-full bg-[rgba(196,162,101,0.1)]" />
      <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 rounded-full bg-[rgba(168,152,184,0.15)]" />
      <div className="absolute bottom-[20%] left-[8%] w-2 h-2 rounded-full bg-[rgba(196,155,138,0.1)]" />
      <div className="absolute bottom-[35%] left-[12%] w-1 h-1 rounded-full bg-[rgba(196,162,101,0.2)]" />
    </div>
  );
}

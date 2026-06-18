import { useEffect, useRef } from "react";

export default function PrismBackground({ showOrbits = true }: { showOrbits?: boolean }) {
  const starfieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sf = starfieldRef.current;
    if (!sf || sf.childElementCount > 0) return;
    for (let i = 0; i < 100; i++) {
      const s = document.createElement("div");
      s.className = "prism-star";
      s.style.left = `${Math.random() * 100}%`;
      s.style.top = `${Math.random() * 100}%`;
      s.style.setProperty("--dur", `${2 + Math.random() * 4}s`);
      s.style.animationDelay = `${Math.random() * 4}s`;
      const sz = Math.random() > 0.85 ? 3 : Math.random() > 0.5 ? 2 : 1;
      s.style.width = `${sz}px`;
      s.style.height = `${sz}px`;
      if (sz === 3) s.style.boxShadow = "0 0 4px rgba(232,185,81,0.3)";
      sf.appendChild(s);
    }
  }, []);

  return (
    <>
      <div ref={starfieldRef} className="prism-starfield" aria-hidden />
      <div className="prism-nebula" aria-hidden />
      {showOrbits && (
        <>
          <div className="prism-orbit-ring prism-orbit-ring-1" aria-hidden />
          <div className="prism-orbit-ring prism-orbit-ring-2" aria-hidden />
        </>
      )}
    </>
  );
}

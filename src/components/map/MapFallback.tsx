"use client";

export default function MapFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#050508]">
      {/* Decorative grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Decorative globe outline */}
      <div className="absolute opacity-[0.04]">
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
          <circle cx="250" cy="250" r="200" stroke="white" strokeWidth="0.5" />
          <ellipse cx="250" cy="250" rx="200" ry="80" stroke="white" strokeWidth="0.5" />
          <ellipse cx="250" cy="250" rx="80" ry="200" stroke="white" strokeWidth="0.5" />
          <ellipse cx="250" cy="250" rx="140" ry="200" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="250" x2="450" y2="250" stroke="white" strokeWidth="0.5" />
          <line x1="250" y1="50" x2="250" y2="450" stroke="white" strokeWidth="0.5" />
          <line x1="50" y1="180" x2="450" y2="180" stroke="white" strokeWidth="0.3" />
          <line x1="50" y1="320" x2="450" y2="320" stroke="white" strokeWidth="0.3" />
        </svg>
      </div>

      {/* Content card */}
      <div className="relative z-10 max-w-md px-8 text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/30">
            <path
              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="10"
              r="3"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold tracking-tight text-white/80">
          Mapbox Token Required
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-white/30">
          To display the interactive globe, a Mapbox access token is needed.
          Create a <span className="font-mono text-white/50">.env.local</span> file
          in the project root with your token:
        </p>

        {/* Code block */}
        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left">
          <code className="text-[13px] leading-relaxed text-white/50">
            <span className="text-white/20">NEXT_PUBLIC_MAPBOX_TOKEN</span>
            <span className="text-white/15">=</span>
            <span className="text-emerald-400/50">your_token_here</span>
          </code>
        </div>

        <p className="mt-5 text-xs text-white/20">
          Get a free token at{" "}
          <span className="font-mono text-white/30">account.mapbox.com</span>
        </p>
      </div>
    </div>
  );
}

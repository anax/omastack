import React from 'react';

interface OmaStackLogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
  animated?: boolean;
}

export const OmaStackLogo: React.FC<OmaStackLogoProps> = ({
  className = '',
  size = 28,
  showWordmark = false,
  animated = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 overflow-visible"
        shapeRendering={animated ? 'crispEdges' : 'auto'}
      >
        <defs>
          <filter id="react-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Backlight */}
        <circle cx="256" cy="256" r="200" fill="#7dcfff" fillOpacity="0.15" />

        {/* Pixelated Isometric Corner Brackets when animated in Hero */}
        {animated && (
          <g fill="#00f0ff" opacity="0.75">
            {/* Top pixel crest */}
            <rect x="248" y="24" width="16" height="16" />
            <rect x="232" y="40" width="16" height="16" fill="#bbdd97" />
            <rect x="264" y="40" width="16" height="16" fill="#bbdd97" />
            {/* Left pixel bracket */}
            <rect x="36" y="240" width="16" height="16" fill="#9ece6a" />
            <rect x="52" y="224" width="12" height="12" fill="#00f0ff" />
            <rect x="52" y="260" width="12" height="12" fill="#678549" />
            {/* Right pixel bracket */}
            <rect x="460" y="240" width="16" height="16" fill="#9ece6a" />
            <rect x="448" y="224" width="12" height="12" fill="#00f0ff" />
            <rect x="448" y="260" width="12" height="12" fill="#678549" />
            {/* Bottom pixel crest */}
            <rect x="248" y="468" width="16" height="16" fill="#678549" />
          </g>
        )}

        <g transform="translate(256, 256) scale(0.72) translate(-400, -370)">
          {/* Tier 3: Bottom Container Slab */}
          <g className={animated ? 'omastack-tier-bottom' : ''}>
            <path d="M 220 440 L 400 544 L 400 600 L 220 496 Z" fill="#465a38" />
            <path d="M 400 544 L 580 440 L 580 496 L 400 600 Z" fill="#2d3a24" />
            <path d="M 220 440 L 400 544 L 580 440 L 400 336 Z" fill="#678549" opacity="0.4" />

            {/* Cyan Glowing Active Core */}
            <path
              d="M 230 422 L 400 520 L 570 422 L 400 324 Z"
              fill="#00f0ff"
              opacity="0.9"
              filter="url(#react-glow)"
            />
            <path d="M 230 422 L 400 520 L 400 526 L 230 428 Z" fill="#7dcfff" />
            <path d="M 400 520 L 570 422 L 570 428 L 400 526 Z" fill="#00c8db" />
          </g>

          {/* Tier 2: Middle Container Layer */}
          <g className={animated ? 'omastack-tier-middle' : ''}>
            <path
              fillRule="evenodd"
              d="M 400 246 L 580 350 L 400 454 L 220 350 Z M 400 298 L 310 350 L 400 402 L 490 350 Z"
              fill="#bbdd97"
            />
            <path d="M 220 350 L 400 454 L 400 498 L 220 394 Z" fill="#8cb363" />
            <path d="M 400 454 L 580 350 L 580 394 L 400 498 Z" fill="#678549" />
            <path d="M 400 402 L 490 350 L 490 380 L 400 432 Z" fill="#4d6438" />
            <path d="M 310 350 L 400 402 L 400 432 L 310 380 Z" fill="#5c7542" />

            {/* Neon Light Slit */}
            <path
              d="M 224 336 L 400 438 L 576 336 L 400 234 Z"
              fill="#00f0ff"
              opacity="0.6"
              filter="url(#react-glow)"
            />
          </g>

          {/* Tier 1: Top 'O' Aperture Layer */}
          <g className={animated ? 'omastack-tier-top' : ''}>
            <path d="M 220 260 L 400 364 L 400 314 L 220 210 Z" fill="#bbdd97" />
            <path d="M 400 364 L 580 260 L 580 210 L 400 314 Z" fill="#9ece6a" />
            <path
              fillRule="evenodd"
              d="M 400 106 L 580 210 L 400 314 L 220 210 Z M 400 158 L 310 210 L 400 262 L 490 210 Z"
              fill="#daecc6"
            />

            {/* Inner Well */}
            <path d="M 400 262 L 490 210 L 490 252 L 400 304 Z" fill="#7da153" />
            <path d="M 310 210 L 400 262 L 400 304 L 310 252 Z" fill="#90b861" />

            {/* Inner glowing portal */}
            <path
              d="M 400 240 L 470 280 L 400 320 L 330 280 Z"
              fill="#00f0ff"
              opacity="0.85"
              filter="url(#react-glow)"
            />

            {/* Rising Voxel Data Sparks from the Aperture Portal */}
            {animated && (
              <g className="omastack-voxel-sparks">
                <rect x="390" y="130" width="20" height="20" fill="#00f0ff" />
                <rect x="354" y="168" width="16" height="16" fill="#daecc6" />
                <rect x="430" y="160" width="16" height="16" fill="#7dcfff" />
                <rect x="392" y="78" width="16" height="16" fill="#bbdd97" opacity="0.85" />
              </g>
            )}
          </g>
        </g>

        {animated && (
          <style>{`
            @keyframes omaTierTop {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-14px); }
            }
            @keyframes omaTierMiddle {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-6px); }
            }
            @keyframes omaTierBottom {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(6px); }
            }
            @keyframes omaVoxelSparks {
              0%, 100% { transform: translateY(0px); opacity: 0.95; }
              50% { transform: translateY(-18px); opacity: 0.45; }
            }
            .omastack-tier-top {
              animation: omaTierTop 3.6s steps(6, end) infinite;
            }
            .omastack-tier-middle {
              animation: omaTierMiddle 3.6s steps(6, end) infinite;
            }
            .omastack-tier-bottom {
              animation: omaTierBottom 3.6s steps(6, end) infinite;
            }
            .omastack-voxel-sparks {
              animation: omaVoxelSparks 2.4s steps(4, end) infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .omastack-tier-top,
              .omastack-tier-middle,
              .omastack-tier-bottom,
              .omastack-voxel-sparks {
                animation: none !important;
              }
            }
          `}</style>
        )}
      </svg>

      {showWordmark && (
        <span className="font-mono font-black tracking-wider text-sm flex items-center">
          <span className="text-white">OMA</span>
          <span className="text-[#9ece6a]">STACK</span>
        </span>
      )}
    </div>
  );
};

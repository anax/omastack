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
      >
        <defs>
          <filter id="react-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

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
          </g>
        </g>

        {animated && (
          <style>{`
            @keyframes omaTierTop {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes omaTierMiddle {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-4px); }
            }
            @keyframes omaTierBottom {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(4px); }
            }
            .omastack-tier-top {
              animation: omaTierTop 4.2s ease-in-out infinite;
            }
            .omastack-tier-middle {
              animation: omaTierMiddle 4.2s ease-in-out infinite;
            }
            .omastack-tier-bottom {
              animation: omaTierBottom 4.2s ease-in-out infinite;
            }
            @media (prefers-reduced-motion: reduce) {
              .omastack-tier-top,
              .omastack-tier-middle,
              .omastack-tier-bottom {
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

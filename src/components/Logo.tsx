export default function SkillAtlasLogo({ size = 24, color = "currentColor" }: { size?: number, color?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer bounding hexagon */}
      <path 
        d="M12 2L22 7.5V16.5L12 22L2 16.5V7.5L12 2Z" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="rgba(255,255,255,0.05)"
      />
      {/* Internal Atlas 'A' structure */}
      <path 
        d="M12 6L7 16" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M12 6L17 16" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M8.5 13H15.5" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Node points at intersections */}
      <circle cx="12" cy="6" r="2" fill={color} />
      <circle cx="7" cy="16" r="1.5" fill={color} />
      <circle cx="17" cy="16" r="1.5" fill={color} />
      
      {/* Central node mapping */}
      <circle cx="12" cy="13" r="1.5" fill={color} />
      <path 
        d="M12 13V22" 
        stroke={color} 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeDasharray="2 2"
      />
    </svg>
  );
}

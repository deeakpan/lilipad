interface LilyPadLogoProps {
  className?: string;
  size?: number;
}

export default function LilyPadLogo({ className = "", size = 24 }: LilyPadLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main lilypad leaf - green with realistic shape */}
      <ellipse cx="12" cy="12" rx="9" ry="7" fill="#22c55e" stroke="#16a34a" strokeWidth="0.5"/>
      
      {/* Lilypad center - darker green */}
      <circle cx="12" cy="12" r="3" fill="#16a34a"/>
      
      {/* Center detail */}
      <circle cx="12" cy="12" r="1.5" fill="#15803d"/>
      
      {/* Leaf veins radiating from center */}
      <path d="M12 5 L12 19" stroke="#15803d" strokeWidth="0.3"/>
      <path d="M3 12 L21 12" stroke="#15803d" strokeWidth="0.3"/>
      <path d="M6 6 L18 18" stroke="#15803d" strokeWidth="0.3"/>
      <path d="M18 6 L6 18" stroke="#15803d" strokeWidth="0.3"/>
      
      {/* Small water droplets */}
      <circle cx="8" cy="8" r="0.8" fill="#3b82f6" opacity="0.7"/>
      <circle cx="16" cy="8" r="0.6" fill="#3b82f6" opacity="0.5"/>
      <circle cx="6" cy="16" r="0.7" fill="#3b82f6" opacity="0.6"/>
    </svg>
  );
} 
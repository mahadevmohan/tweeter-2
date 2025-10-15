// components/CountryAvatar.tsx
import React from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = { sm: 32, md: 48, lg: 64, xl: 80 };

function getInitials(country: string) {
  return country
    .split(/\s+/)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 3);
}

function countryToFileName(country: string) {
  // Handle special cases first
  if (country.toLowerCase().includes('united kingdom')) {
    return 'united_kingdom';
  } else if (country.toLowerCase().includes('united arab')) {
    return 'united_arab';
  } else if (country.toLowerCase().includes('north korea')) {
    return 'north_korea';
  } else if (country.toLowerCase().includes('south korea')) {
    return 'south_korea';
  } else if (country.toLowerCase().includes('united states')) {
    return 'united_states';
  } else if (country.toLowerCase().includes('saudi arabia')) {
    return 'saudi_arabia';
  } else if (country.toLowerCase().includes('sri lanka')) {
    return 'sri_lanka';
  } else if (country.toLowerCase().includes('new zealand')) {
    return 'new_zealand';
  } else {
    // For other countries, use the first word (handles "France" -> "france")
    return country.toLowerCase().split(' ')[0];
  }
}

type Props = {
  country: string;           // e.g., "France"
  size?: Size;               // sm | md | lg | xl
  className?: string;
  title?: string;
};

export default function CountryAvatar({ country, size = "md", className, title }: Props) {
  const px = SIZE_PX[size];
  const fileName = countryToFileName(country);

  // Use the correct file naming convention: country_32.png
  const src = `/images/countries/${fileName}_32.png`;


  return (
    <div
      className={`avatar ${className || ''}`}
      style={{ width: px, height: px }}
      aria-label={`${country} avatar`}
      title={title ?? country}
    >
      {/* inset circle to avoid flag touching the outer border */}
      <div className="avatar__inner">
        <img
          src={src}
          alt={`${country} flag`}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
            // Show fallback
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = "flex";
            }
          }}
          onLoad={(e) => {
            // Hide fallback when image loads
            const fallback = (e.currentTarget as HTMLImageElement).nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = "none";
            }
          }}
          loading="lazy"
        />
        <div className="avatar__fallback" style={{ display: "none" }}>{getInitials(country)}</div>
      </div>
    </div>
  );
}

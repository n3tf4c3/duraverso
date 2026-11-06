import type { Locale } from "@/lib/i18n";

// Bandeiras simplificadas em SVG (sem emoji). São decorativas: o nome do
// idioma está sempre escrito ao lado, por isso aria-hidden.
export function Flag({ locale, width = 24 }: { locale: Locale; width?: number }) {
  const height = Math.round((width * 2) / 3);
  const outline = <rect x="0.5" y="0.5" width="29" height="19" fill="none" stroke="#13202C" strokeOpacity="0.35" />;

  return (
    <svg width={width} height={height} viewBox="0 0 30 20" aria-hidden="true" focusable="false" className="shrink-0">
      {locale === "pt" && (
        <>
          <rect width="30" height="20" fill="#009739" />
          <path d="M15 2.2L27.6 10 15 17.8 2.4 10Z" fill="#FEDD00" />
          <circle cx="15" cy="10" r="4.4" fill="#012169" />
          <path d="M10.8 9.1Q15 7.7 19.3 10.7" stroke="#FFFFFF" strokeWidth="0.9" fill="none" />
        </>
      )}
      {locale === "en" && (
        <>
          <rect width="30" height="20" fill="#FFFFFF" />
          <path
            d="M0 0H30V1.54H0ZM0 3.08H30V4.62H0ZM0 6.15H30V7.69H0ZM0 9.23H30V10.77H0ZM0 12.31H30V13.85H0ZM0 15.38H30V16.92H0ZM0 18.46H30V20H0Z"
            fill="#B31942"
          />
          <rect width="12" height="10.77" fill="#0A3161" />
          <path d="M2 2h1v1H2zM5.5 2h1v1h-1zM9 2h1v1H9zM3.7 4.9h1v1h-1zM7.2 4.9h1v1h-1zM2 7.8h1v1H2zM5.5 7.8h1v1h-1zM9 7.8h1v1H9z" fill="#FFFFFF" />
        </>
      )}
      {locale === "es" && (
        <>
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
        </>
      )}
      {outline}
    </svg>
  );
}

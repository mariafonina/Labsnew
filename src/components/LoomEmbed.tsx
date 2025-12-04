interface LoomEmbedProps {
  url: string;
  className?: string;
}

export function LoomEmbed({ url, className = "" }: LoomEmbedProps) {
  console.log('[LoomEmbed] Received URL:', url);
  
  if (!url || !url.includes("loom.com")) {
    console.log('[LoomEmbed] Invalid URL - returning null');
    return null;
  }

  // Normalize /share/ URLs to /embed/ URLs
  let embedUrl = url;
  if (url.includes("/share/")) {
    embedUrl = url.replace("/share/", "/embed/");
  }

  console.log('[LoomEmbed] Using embed URL:', embedUrl);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-100 ${className}`}
      style={{ paddingBottom: "56.25%", height: 0 }}
    >
      <iframe
        src={embedUrl}
        title="Loom Video"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute top-0 left-0 w-full h-full"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

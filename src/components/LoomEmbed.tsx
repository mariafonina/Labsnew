interface LoomEmbedProps {
  url: string;
  className?: string;
}

export function LoomEmbed({ url, className = "" }: LoomEmbedProps) {
  if (!url || !url.includes("loom.com")) {
    return null;
  }

  // Normalize /share/ URLs to /embed/ URLs
  let embedUrl = url;
  if (url.includes("/share/")) {
    embedUrl = url.replace("/share/", "/embed/");
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-100 ${className}`}
      style={{ paddingBottom: "56.25%", height: 0 }}
    >
      <iframe
        src={embedUrl}
        frameBorder="0"
        allowFullScreen
        allow="autoplay; fullscreen; picture-in-picture"
        className="absolute top-0 left-0 w-full h-full"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

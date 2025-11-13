interface LoomEmbedProps {
  url: string;
  className?: string;
}

export function LoomEmbed({ url, className = "" }: LoomEmbedProps) {
  if (!url || !url.includes("loom.com/embed/")) {
    return null;
  }

  return (
    <div 
      className={`relative w-full ${className}`}
      style={{ paddingBottom: "56.25%", height: 0 }}
    >
      <iframe
        src={url}
        frameBorder="0"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}

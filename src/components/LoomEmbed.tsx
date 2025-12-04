import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Button } from "./ui/button";

interface LoomEmbedProps {
  url: string;
  className?: string;
}

export function LoomEmbed({ url, className = "" }: LoomEmbedProps) {
  const [showEmbed, setShowEmbed] = useState(false);
  
  if (!url || !url.includes("loom.com")) {
    return null;
  }

  // Normalize /share/ URLs to /embed/ URLs
  let embedUrl = url;
  let shareUrl = url;
  
  if (url.includes("/share/")) {
    embedUrl = url.replace("/share/", "/embed/");
  } else if (url.includes("/embed/")) {
    shareUrl = url.replace("/embed/", "/share/");
  }
  
  // Add parameters for cleaner embed
  const separator = embedUrl.includes('?') ? '&' : '?';
  const finalUrl = `${embedUrl}${separator}hide_owner=true&hideEmbedTopBar=true`;

  // Show placeholder with play button first, then load iframe on click
  if (!showEmbed) {
    return (
      <div
        className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-100 bg-gradient-to-br from-gray-900 to-gray-800 ${className}`}
        style={{ paddingBottom: "56.25%", height: 0 }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <Button
            onClick={() => setShowEmbed(true)}
            size="lg"
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-full w-20 h-20 p-0"
          >
            <Play className="h-10 w-10 ml-1" fill="white" />
          </Button>
          <p className="text-white/80 text-sm">Нажмите для воспроизведения</p>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Открыть в новой вкладке
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-100 ${className}`}
      style={{ paddingBottom: "56.25%", height: 0 }}
    >
      <iframe
        src={finalUrl}
        title="Loom Video"
        frameBorder="0"
        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        className="absolute top-0 left-0 w-full h-full"
        style={{
          width: "100%",
          height: "100%",
        }}
      />
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-2 rounded-lg transition-colors"
      >
        <ExternalLink className="h-3 w-3" />
        Открыть в Loom
      </a>
    </div>
  );
}

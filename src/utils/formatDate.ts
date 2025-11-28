export function formatDateTimeRu(dateString: string | null | undefined): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "только что";
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 2) return "вчера";
  
  const day = date.getDate();
  const month = date.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  
  return `${day} ${month}., ${year}, ${hours}:${minutes}`;
}

export function formatDateRu(dateString: string | null | undefined): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function formatDateShortRu(dateString: string | null | undefined): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const day = date.getDate();
  const month = date.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "");
  const year = date.getFullYear();
  
  return `${day} ${month}. ${year}`;
}

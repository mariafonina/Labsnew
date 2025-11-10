import logoImage from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

export function Logo({ className = "", size = "md", onClick }: LogoProps) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
    xl: "h-16",
  };

  const content = (
    <img
      src={logoImage}
      alt="ЛАБС"
      className={`${sizes[size]} w-auto object-contain`}
    />
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity ${className}`}
        aria-label="Перейти на главную"
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {content}
    </div>
  );
}
import { ReactNode } from "react";
import { Card } from "./ui/card";

interface AdminFormWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdminFormWrapper({ title, description, children }: AdminFormWrapperProps) {
  return (
    <Card className="p-8 shadow-lg border-2">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h3 className="font-black text-3xl mb-2">{title}</h3>
        {description && (
          <p className="text-gray-500 text-base">{description}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </Card>
  );
}

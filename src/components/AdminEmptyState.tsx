import { ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface AdminEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function AdminEmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: AdminEmptyStateProps) {
  return (
    <Card className="p-16 text-center border-2 border-dashed border-gray-300 bg-gray-50/50">
      <div className="max-w-md mx-auto">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-5">
          {icon}
        </div>
        <h3 className="font-black text-2xl text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-500 text-base mb-6">
          {description}
        </p>
        <Button
          onClick={onAction}
          size="lg"
          className="bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 shadow-md hover:shadow-lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          {actionLabel}
        </Button>
      </div>
    </Card>
  );
}

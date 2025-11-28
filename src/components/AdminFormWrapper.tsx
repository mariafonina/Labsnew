import { ReactNode } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Save, X } from "lucide-react";

interface AdminFormWrapperProps {
  title: string;
  description?: string;
  children: ReactNode;
  onSubmit: () => void;
  onCancel: () => void;
  submitText?: string;
  submitDisabled?: boolean;
}

export function AdminFormWrapper({ title, description, children, onSubmit, onCancel, submitText = "Опубликовать", submitDisabled = false }: AdminFormWrapperProps) {
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

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 h-12"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitText}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-12 hover:bg-gray-100"
          >
            <X className="h-4 w-4 mr-2" />
            Отмена
          </Button>
        </div>
      </div>
    </Card>
  );
}

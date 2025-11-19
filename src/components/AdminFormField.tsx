import { ReactNode } from "react";
import { Label } from "./ui/label";

interface AdminFormFieldProps {
  label: string;
  required?: boolean;
  emoji?: string;
  children: ReactNode;
  helpText?: string;
}

export function AdminFormField({ label, required, emoji, children, helpText }: AdminFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-base font-semibold">
        {emoji && <span className="mr-2">{emoji}</span>}
        {label} {required && <span className="text-pink-500">*</span>}
      </Label>
      {children}
      {helpText && (
        <p className="text-sm text-gray-500 mt-1">{helpText}</p>
      )}
    </div>
  );
}

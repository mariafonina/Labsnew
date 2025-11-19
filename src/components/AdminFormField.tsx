import { ReactNode } from "react";
import { Label } from "./ui/label";

interface AdminFormFieldProps {
  label: string;
  required?: boolean;
  children: ReactNode;
  helpText?: string;
}

export function AdminFormField({ label, required, children, helpText }: AdminFormFieldProps) {
  return (
    <div className="space-y-3">
      <Label className="text-[18px] leading-[28px] tracking-[-0.4395px] font-bold text-neutral-950">
        {label} {required && <span className="text-[#f6339a]">*</span>}
      </Label>
      {children}
      {helpText && (
        <p className="text-sm leading-5 tracking-[-0.1504px] text-[#6a7282] mt-1">{helpText}</p>
      )}
    </div>
  );
}

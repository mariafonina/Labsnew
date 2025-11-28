// Image Uploader Component for ЛАБС
// Based on Replit Object Storage integration (blueprint:javascript_object_storage)

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImagePlus, Upload, X, Loader2 } from "lucide-react";
import { apiClient } from "@/api/client";
import { toast } from "sonner";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  buttonLabel?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "secondary";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  maxFileSize?: number;
  acceptedTypes?: string[];
}

export function ImageUploader({
  onImageUploaded,
  buttonLabel = "Вставить изображение",
  buttonVariant = "outline",
  buttonSize = "sm",
  maxFileSize = 5 * 1024 * 1024,
  acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
}: ImageUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Разрешены только изображения (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > maxFileSize) {
      toast.error(`Файл слишком большой. Максимум ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const uploadData = await apiClient.getObjectUploadUrl("instructions");
      
      const uploadResponse = await fetch(uploadData.uploadURL, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      const confirmResult = await apiClient.confirmObjectUpload(
        uploadData.uploadURL,
        uploadData.objectPath
      );

      const imageUrl = confirmResult.objectPath;
      
      onImageUploaded(imageUrl);
      toast.success("Изображение загружено");
      
      setIsOpen(false);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Не удалось загрузить изображение");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setPreview(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={() => setIsOpen(true)}
      >
        <ImagePlus className="h-4 w-4 mr-2" />
        {buttonLabel}
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Загрузить изображение</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">
                  Перетащите изображение сюда
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  или
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Выбрать файл
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes.join(",")}
                  onChange={handleInputChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-400 mt-4">
                  JPEG, PNG, GIF, WebP. Макс. {Math.round(maxFileSize / 1024 / 1024)}MB
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg border"
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    onClick={handleClear}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p className="font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

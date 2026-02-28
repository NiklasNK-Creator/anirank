import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  bucket: "avatars" | "banners";
  currentUrl: string;
  onUpload: (url: string) => void;
  className?: string;
  aspectRatio?: string;
  placeholder?: string;
}

export default function ImageUpload({
  bucket,
  currentUrl,
  onUpload,
  className = "",
  aspectRatio = "aspect-square",
  placeholder = "Upload Image",
}: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    setPreview(null);
    onUpload(urlData.publicUrl);
    toast.success("Image uploaded!");
    setUploading(false);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div className={`relative group ${className}`}>
      <div
        className={`${aspectRatio} w-full rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer`}
        onClick={() => inputRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <span className="text-xs">{placeholder}</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!uploading && displayUrl && (
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="h-6 w-6 text-foreground" />
          </div>
        )}
      </div>

      {currentUrl && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpload("");
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}

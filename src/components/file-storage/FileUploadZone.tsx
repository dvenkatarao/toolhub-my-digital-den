import { useCallback } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FileUploadZoneProps {
  onUpload: (files: File[]) => void;
}

export function FileUploadZone({ onUpload }: FileUploadZoneProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      onUpload(files);
    },
    [onUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onUpload(files);
    }
  };

  return (
    <Card
      className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <label className="flex flex-col items-center justify-center p-12 cursor-pointer">
        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supported: Images, Videos, Documents, Audio, Archives
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </label>
    </Card>
  );
}

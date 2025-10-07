import { FileItem } from "@/pages/tools/FileStorage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  Trash2, 
  MoreVertical, 
  FileText, 
  Image, 
  Video, 
  Music,
  File,
  Share2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FileCardProps {
  file: FileItem;
  onDelete: (fileId: string, storagePath: string) => void;
  onRefresh: () => void;
}

export function FileCard({ file, onDelete, onRefresh }: FileCardProps) {
  const getFileIcon = () => {
    if (file.type.startsWith("image/")) return <Image className="h-8 w-8" />;
    if (file.type.startsWith("video/")) return <Video className="h-8 w-8" />;
    if (file.type.startsWith("audio/")) return <Music className="h-8 w-8" />;
    if (file.type.includes("pdf") || file.type.includes("document")) 
      return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  const handleDownload = async () => {
    const { data } = await supabase.storage
      .from("user-files")
      .download(file.storage_path);

    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center space-y-3">
        <div className="text-primary">{getFileIcon()}</div>
        <div className="text-center w-full">
          <p className="font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(file.id, file.storage_path)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

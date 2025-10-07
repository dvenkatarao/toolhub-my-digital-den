import { FileItem } from "@/pages/tools/FileStorage";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface FileTableRowProps {
  file: FileItem;
  onDelete: (fileId: string, storagePath: string) => void;
  onRefresh: () => void;
}

export function FileTableRow({ file, onDelete, onRefresh }: FileTableRowProps) {
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
    <TableRow>
      <TableCell className="font-medium">{file.name}</TableCell>
      <TableCell>{file.type.split("/")[1] || "Unknown"}</TableCell>
      <TableCell>{formatFileSize(file.size)}</TableCell>
      <TableCell>
        {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(file.id, file.storage_path)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

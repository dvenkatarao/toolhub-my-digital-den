import { FileItem } from "@/pages/tools/FileStorage";
import { FileCard } from "./FileCard";
import { FileTableRow } from "./FileTableRow";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface FileListProps {
  files: FileItem[];
  viewMode: "grid" | "list";
  loading: boolean;
  onDelete: (fileId: string, storagePath: string) => void;
  onRefresh: () => void;
}

export function FileList({ files, viewMode, loading, onDelete, onRefresh }: FileListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No files found</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onDelete={onDelete}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Modified</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <FileTableRow
            key={file.id}
            file={file}
            onDelete={onDelete}
            onRefresh={onRefresh}
          />
        ))}
      </TableBody>
    </Table>
  );
}

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, Search, Grid, List, SortAsc } from "lucide-react";
import { FileUploadZone } from "@/components/file-storage/FileUploadZone";
import { FileList } from "@/components/file-storage/FileList";
import { StorageStats } from "@/components/file-storage/StorageStats";
import { useToast } from "@/hooks/use-toast";

export type FileItem = {
  id: string;
  name: string;
  size: number;
  type: string;
  storage_path: string;
  folder: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export default function FileStorage() {
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date");
  const [totalStorage, setTotalStorage] = useState(0);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFiles(data || []);
      
      // Calculate total storage used
      const total = data?.reduce((acc, file) => acc + file.size, 0) || 0;
      setTotalStorage(total);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (uploadedFiles: File[]) => {
    if (!user) return;

    const maxSize = isPremium ? 524288000 : 52428800; // 500MB for premium, 50MB for free
    const storageLimit = isPremium ? 10737418240 : 1073741824; // 10GB for premium, 1GB for free

    for (const file of uploadedFiles) {
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the ${isPremium ? "500MB" : "50MB"} limit`,
          variant: "destructive",
        });
        continue;
      }

      if (totalStorage + file.size > storageLimit) {
        toast({
          title: "Storage limit reached",
          description: `Upgrade to premium for more storage`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from("user-files")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase
          .from("files")
          .insert({
            user_id: user.id,
            name: file.name,
            size: file.size,
            type: file.type,
            storage_path: filePath,
            folder: "root",
          });

        if (dbError) throw dbError;

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }

    fetchFiles();
  };

  const handleDeleteFile = async (fileId: string, storagePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("user-files")
        .remove([storagePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "File deleted successfully",
      });

      fetchFiles();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "size":
        return b.size - a.size;
      case "date":
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const storageLimit = isPremium ? 10737418240 : 1073741824;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">File Storage</h1>
          <p className="text-muted-foreground">
            Store and manage your files securely
          </p>
        </div>
      </div>

      <StorageStats 
        totalStorage={totalStorage} 
        storageLimit={storageLimit}
        fileCount={files.length}
        isPremium={isPremium}
      />

      <FileUploadZone onUpload={handleFileUpload} />

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-accent" : ""}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-accent" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
            </select>
          </div>
        </div>

        <FileList
          files={sortedFiles}
          viewMode={viewMode}
          loading={loading}
          onDelete={handleDeleteFile}
          onRefresh={fetchFiles}
        />
      </Card>
    </div>
  );
}

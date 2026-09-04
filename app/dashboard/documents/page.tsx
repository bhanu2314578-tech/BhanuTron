'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Search,
  Upload,
  FileText,
  MoreHorizontal,
  Pencil,
  Download,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { mockDocuments, type MockDocument, type DocStatus } from '@/lib/mock-data';
import { documentService } from '@/services/api.service';
import { statusVariant, statusLabel } from '@/constants/document';
import type { DocumentItem } from '@/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const statusIcon: Record<DocStatus, React.ElementType> = {
  processed: CheckCircle2,
  processing: Loader2,
  failed: AlertCircle,
};

const PAGE_SIZE = 6;

type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc';

export default function DocumentsPage() {
  const [docs, setDocs] = React.useState<MockDocument[]>(mockDocuments);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<SortKey>('date-desc');
  const [page, setPage] = React.useState(1);
  const [dragging, setDragging] = React.useState(false);
  const [renameDoc, setRenameDoc] = React.useState<MockDocument | null>(null);
  const [renameValue, setRenameValue] = React.useState('');
  const [deleteDoc, setDeleteDoc] = React.useState<MockDocument | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<Record<string, number>>({});

  const fetchDocuments = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const apiDocs = await documentService.list();
      const mapped: MockDocument[] = apiDocs.map((d: DocumentItem) => ({
        id: d.id,
        name: d.name,
        pages: d.pages,
        uploadDate: d.uploadDate,
        status: d.status,
        size: d.size,
        type: d.type,
      }));
      setDocs(mapped);
    } catch (err) {
      toast.error('Failed to load documents', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File) => {
    const uploadId = `upload-${Date.now()}`;
    setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }));
    try {
      await documentService.upload(file, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [uploadId]: percent }));
      });
      toast.success(`Uploaded ${file.name}`, {
        description: `${(file.size / 1024).toFixed(0)} KB · Processing now`,
      });
      fetchDocuments();
    } catch (err) {
      toast.error(`Failed to upload ${file.name}`, {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[uploadId];
        return next;
      });
    }
  };

  const filtered = React.useMemo(() => {
    let result = [...docs];
    if (search) {
      result = result.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter((d) => d.status === statusFilter);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.uploadDate.localeCompare(a.uploadDate);
        case 'date-asc':
          return a.uploadDate.localeCompare(b.uploadDate);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
      }
    });
    return result;
  }, [docs, search, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageDocs = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  React.useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    files.forEach((file) => handleUpload(file));
  };

  const handleRename = async () => {
    if (!renameDoc || !renameValue.trim()) return;
    try {
      const updated = await documentService.rename(renameDoc.id, renameValue.trim());
      setDocs((prev) => prev.map((doc) => (doc.id === updated.id ? updated : doc)));
      toast.success('Document renamed');
      setRenameDoc(null);
    } catch (err) {
      toast.error('Failed to rename document', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleDownload = async (doc: MockDocument) => {
    try {
      const url = await documentService.download(doc.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error('Failed to download document', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleDelete = () => {
    if (!deleteDoc) return;
    setDocs((prev) => prev.filter((d) => d.id !== deleteDoc.id));
    toast.success('Document deleted');
    setDeleteDoc(null);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload, manage, and chat with your documents.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDocuments}
          disabled={isLoading}
        >
          <RefreshCw className={cn('mr-1.5 h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Upload area */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files by dragging and dropping or browsing"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('file-upload-input')?.click();
          }
        }}
        className={cn(
          'mb-6 flex flex-col items-center justify-center rounded-[14px] border-2 border-dashed p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border bg-card hover:border-primary/50'
        )}
      >
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Upload className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">
          Drag and drop files here, or{' '}
          <label className="cursor-pointer text-primary hover:underline">
            browse
            <input
              id="file-upload-input"
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                files.forEach((f) => handleUpload(f));
              }}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Supports PDF, DOCX, TXT — up to 50 MB per file
        </p>
      </div>

      {/* Toolbar: search, filter, sort */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest first</SelectItem>
            <SelectItem value="date-asc">Oldest first</SelectItem>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document cards */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : pageDocs.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="No documents found"
          description="Try adjusting your search or filters, or upload a new document."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageDocs.map((doc) => {
            const StatusIcon = statusIcon[doc.status];
            return (
              <Card key={doc.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setRenameDoc(doc);
                            setRenameValue(doc.name);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard/chat">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Chat
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => void handleDownload(doc)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteDoc(doc)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="mt-4 truncate text-sm font-medium" title={doc.name}>
                    {doc.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2">
                    <StatusIcon
                      className={cn(
                        'h-3.5 w-3.5',
                        doc.status === 'processing' && 'animate-spin'
                      )}
                    />
                    <Badge variant={statusVariant[doc.status]} className="text-xs">
                      {statusLabel[doc.status]}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <div>
                      <span className="block font-medium text-foreground">{doc.pages}</span>
                      pages
                    </div>
                    <div>
                      <span className="block font-medium text-foreground">{doc.size}</span>
                      file size
                    </div>
                    <div className="col-span-2">
                      <span className="block font-medium text-foreground">
                        {formatDate(doc.uploadDate)}
                      </span>
                      upload date
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="text-sm font-medium" aria-live="polite">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Rename dialog */}
      <Dialog open={!!renameDoc} onOpenChange={(o) => !o && setRenameDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename document</DialogTitle>
            <DialogDescription>
              Enter a new name for this document.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">{deleteDoc?.name}</span>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

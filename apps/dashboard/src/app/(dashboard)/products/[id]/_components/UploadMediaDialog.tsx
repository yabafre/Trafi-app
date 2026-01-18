'use client'

/**
 * Upload Media Dialog
 *
 * Dialog for uploading new media with drag-and-drop support.
 * Digital Brutalism v2 design pattern.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useState, useCallback, useRef } from 'react'
import { Upload, X, FileImage, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUploadMedia } from '../_hooks'
import { MEDIA_CONSTANTS } from '@trafi/validators'

interface UploadMediaDialogProps {
  productId: string
  variantId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  remainingSlots: number
}

interface FilePreview {
  file: File
  preview: string
  error?: string
}

export function UploadMediaDialog({
  productId,
  variantId,
  open,
  onOpenChange,
  remainingSlots,
}: UploadMediaDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FilePreview[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const { upload, isUploading, progress } = useUploadMedia({
    productId,
    variantId,
    onSuccess: () => {
      // Remove uploaded file from list
      if (uploadingIndex !== null) {
        setFiles((prev) => prev.filter((_, i) => i !== uploadingIndex))
        setUploadingIndex(null)
      }
    },
    onError: () => {
      setUploadingIndex(null)
    },
  })

  const validateFile = useCallback((file: File): string | undefined => {
    // Check file type
    if (!MEDIA_CONSTANTS.ALLOWED_MIME_TYPES.includes(file.type as (typeof MEDIA_CONSTANTS.ALLOWED_MIME_TYPES)[number])) {
      return `Type de fichier non supporte. Utilisez: ${MEDIA_CONSTANTS.ALLOWED_MIME_TYPES.map((t) => t.split('/')[1]).join(', ')}`
    }

    // Check file size
    if (file.size > MEDIA_CONSTANTS.MAX_FILE_SIZE) {
      return `Fichier trop volumineux. Maximum: ${MEDIA_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB`
    }

    return undefined
  }, [])

  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles: FilePreview[] = []
      const available = remainingSlots - files.length

      Array.from(fileList)
        .slice(0, available)
        .forEach((file) => {
          const error = validateFile(file)
          newFiles.push({
            file,
            preview: URL.createObjectURL(file),
            error,
          })
        })

      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, remainingSlots, validateFile]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files)
      }
      // Reset input
      e.target.value = ''
    },
    [handleFiles]
  )

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const file = prev[index]
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const handleUpload = async () => {
    for (let i = 0; i < files.length; i++) {
      const filePreview = files[i]
      if (filePreview.error) continue

      setUploadingIndex(i)
      await upload(filePreview.file)
    }

    // Close if all uploads successful
    if (files.every((f) => f.error)) {
      setFiles([])
    }
  }

  const handleClose = useCallback(() => {
    // Cleanup previews
    files.forEach((f) => URL.revokeObjectURL(f.preview))
    setFiles([])
    onOpenChange(false)
  }, [files, onOpenChange])

  const validFiles = files.filter((f) => !f.error)
  const canUpload = validFiles.length > 0 && !isUploading

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase">
            Ajouter des images
          </DialogTitle>
          <DialogDescription>
            Glissez-deposez vos images ou cliquez pour selectionner des fichiers.
            Maximum {remainingSlots} image{remainingSlots > 1 ? 's' : ''} restante{remainingSlots > 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center border-2 border-dashed border-border p-8 transition-colors',
              isDragOver && 'border-primary bg-primary/5',
              remainingSlots - files.length <= 0 && 'pointer-events-none opacity-50'
            )}
          >
            <Upload className="mb-2 size-8 text-muted-foreground" />
            <p className="font-mono text-sm">
              {isDragOver ? 'Deposez ici' : 'Cliquez ou deposez des images'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPG, GIF, WebP &bull; Max {MEDIA_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={MEDIA_CONSTANTS.ALLOWED_MIME_TYPES.join(',')}
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* File Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {files.map((filePreview, index) => (
                <div
                  key={index}
                  className={cn(
                    'relative aspect-square overflow-hidden border',
                    filePreview.error ? 'border-destructive' : 'border-border',
                    uploadingIndex === index && 'ring-2 ring-primary'
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={filePreview.preview}
                    alt={filePreview.file.name}
                    className={cn(
                      'h-full w-full object-cover',
                      filePreview.error && 'opacity-50'
                    )}
                  />

                  {/* Error Overlay */}
                  {filePreview.error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                      <AlertCircle className="size-6 text-destructive" />
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadingIndex === index && (
                    <div className="absolute inset-x-0 bottom-0 bg-primary/80 px-1 py-0.5">
                      <p className="text-center font-mono text-[10px] text-primary-foreground">
                        {progress}%
                      </p>
                    </div>
                  )}

                  {/* Remove Button */}
                  {!isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(index)
                      }}
                      className="absolute right-0.5 top-0.5 bg-background/80 p-0.5 hover:bg-background"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* File Errors */}
          {files.some((f) => f.error) && (
            <div className="border border-destructive bg-destructive/10 p-2">
              {files
                .filter((f) => f.error)
                .map((f, i) => (
                  <p key={i} className="text-xs text-destructive">
                    {f.file.name}: {f.error}
                  </p>
                ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {isUploading ? (
              <>Telechargement en cours...</>
            ) : (
              <>
                <FileImage className="mr-2 size-4" />
                Telecharger {validFiles.length > 0 && `(${validFiles.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

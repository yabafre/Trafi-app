'use client';

/**
 * Hook to upload media for a product
 *
 * Uses FormData server action because tRPC doesn't handle multipart well.
 *
 * @see Story 3.3 - Product Media Upload
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { uploadMediaFormAction } from '../_actions';
import { MEDIA_QUERY_KEY } from './useMedia';
import type { MediaResponse } from '@trafi/validators';

export interface UseUploadMediaOptions {
  productId: string;
  variantId?: string;
  onSuccess?: (media: MediaResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseUploadMediaReturn {
  upload: (file: File) => Promise<MediaResponse | null>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export function useUploadMedia({
  productId,
  variantId,
  onSuccess,
  onError,
}: UseUploadMediaOptions): UseUploadMediaReturn {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File): Promise<MediaResponse | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('productId', productId);
        if (variantId) {
          formData.append('variantId', variantId);
        }

        // Simulate progress (actual progress tracking would require XHR)
        setProgress(30);

        // Call server action
        const result = await uploadMediaFormAction(formData);

        setProgress(100);

        // Invalidate media cache
        queryClient.invalidateQueries({ queryKey: MEDIA_QUERY_KEY(productId) });
        router.refresh();

        toast.success('Image uploadee avec succes');
        onSuccess?.(result);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        toast.error(error.message || "Erreur lors de l'upload de l'image");
        onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [productId, variantId, queryClient, router, onSuccess, onError]
  );

  return {
    upload,
    isUploading,
    progress,
    error,
  };
}

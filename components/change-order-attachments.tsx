"use client";

import { useEffect, useState } from 'react';

type Attachment = {
  id: string;
  file_name: string;
  file_type: string | null;
  file_size_bytes: number | null;
  public_url: string | null;
  created_at: string;
};

type AttachmentsResponse = {
  ok?: boolean;
  message?: string;
  attachments?: Attachment[];
};

type UploadAttachmentResponse = {
  ok?: boolean;
  message?: string;
  attachment?: Attachment;
};

type ChangeOrderAttachmentsProps = {
  changeOrderId: string;
};

function formatFileSize(bytes: number | null) {
  if (bytes === null || bytes === undefined) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function ChangeOrderAttachments({ changeOrderId }: ChangeOrderAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAttachments() {
      try {
        const response = await fetch(`/api/change-orders/${changeOrderId}/attachments`);
        const result = (await response.json()) as AttachmentsResponse;

        if (!response.ok) {
          if (isMounted) {
            setErrorMessage(result.message ?? 'Something went wrong loading attachments.');
          }
          return;
        }

        if (isMounted) {
          setAttachments(result.attachments ?? []);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Something went wrong loading attachments.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAttachments();

    return () => {
      isMounted = false;
    };
  }, [changeOrderId]);

  async function handleUpload() {
    setUploadErrorMessage(null);

    if (!selectedFile) {
      setUploadErrorMessage('Choose a file to upload.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/change-orders/${changeOrderId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as UploadAttachmentResponse;

      if (!response.ok) {
        setUploadErrorMessage(result.message ?? 'Something went wrong uploading the attachment.');
        return;
      }

      if (result.attachment) {
        setAttachments((current) => [result.attachment as Attachment, ...current]);
      }

      setSelectedFile(null);

      const input = document.getElementById(`attachment-file-${changeOrderId}`) as
        | HTMLInputElement
        | null;
      if (input) {
        input.value = '';
      }
    } catch {
      setUploadErrorMessage('Something went wrong uploading the attachment.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id={`attachment-file-${changeOrderId}`}
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setSelectedFile(file);
          }}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
        />

        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={isUploading}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {uploadErrorMessage ? (
        <p className="mt-2 text-sm text-rose-700">{uploadErrorMessage}</p>
      ) : null}

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-600">Loading attachments...</p>
      ) : null}

      {!isLoading && errorMessage ? (
        <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>
      ) : null}

      {!isLoading && !errorMessage && attachments.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No attachments yet.</p>
      ) : null}

      {!isLoading && !errorMessage && attachments.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.id}
              className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-sm font-medium text-slate-900">{attachment.file_name}</p>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                {attachment.file_type ? <span>{attachment.file_type}</span> : null}
                {formatFileSize(attachment.file_size_bytes) ? (
                  <span>{formatFileSize(attachment.file_size_bytes)}</span>
                ) : null}
                <span>{formatDateTime(attachment.created_at)}</span>
                {attachment.public_url ? (
                  <a
                    href={attachment.public_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-slate-800 underline underline-offset-2"
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

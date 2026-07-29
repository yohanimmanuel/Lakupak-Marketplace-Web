import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

const MAX_PHOTOS = 5;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

type Folder = "returns" | "reviews" | "distributor_reports";

type PhotoUploadGridProps = {
  folder: Folder;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
  label: string;
  hint?: string;
  addLabel: string;
  uploadingLabel: string;
  removeLabel: string;
  uploadErrorLabel: string;
  disabled?: boolean;
};

/**
 * Intended for import from Client Components only.
 * Avoid importing other "use client" modules here so this file is not a
 * Client Component entry (which would ban function props under ts(71007)).
 */
export default function PhotoUploadGrid({
  folder,
  urls,
  onUrlsChange,
  onBusyChange,
  label,
  hint,
  addLabel,
  uploadingLabel,
  removeLabel,
  uploadErrorLabel,
  disabled,
}: PhotoUploadGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_PHOTOS - urls.length;

  function setBusy(next: boolean) {
    setUploading(next);
    onBusyChange?.(next);
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).slice(0, remaining);
    if (list.length === 0) return;

    setBusy(true);
    setError(null);

    const next = [...urls];
    try {
      for (const file of list) {
        if (next.length >= MAX_PHOTOS) break;
        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body,
        });
        const payload = (await response.json()) as {
          url?: string;
          error?: string;
        };

        if (!response.ok || !payload.url) {
          setError(payload.error ?? uploadErrorLabel);
          break;
        }
        next.push(payload.url);
      }
      onUrlsChange(next.slice(0, MAX_PHOTOS));
    } catch {
      setError(uploadErrorLabel);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-laku-muted">{label}</p>
      {hint ? <p className="mt-1 text-xs text-laku-faint">{hint}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        disabled={disabled || uploading || remaining <= 0}
        onChange={(event) => {
          if (event.target.files?.length) void uploadFiles(event.target.files);
        }}
      />

      <div className="mt-3 flex flex-wrap gap-2.5">
        {urls.map((url, index) => (
          <div
            key={`${url}-${index}`}
            className="relative size-[72px] overflow-hidden rounded-xl border border-laku-line bg-laku-chip"
          >
            <Image
              src={url}
              alt=""
              fill
              unoptimized
              sizes="72px"
              className="object-cover"
            />
            <button
              type="button"
              disabled={disabled || uploading}
              aria-label={removeLabel}
              onClick={() => onUrlsChange(urls.filter((_, i) => i !== index))}
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white transition-opacity hover:bg-black/85 disabled:opacity-50"
            >
              <X className="size-3" strokeWidth={2.5} aria-hidden />
            </button>
          </div>
        ))}

        {remaining > 0 ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex size-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-laku-line bg-laku-surface text-laku-muted transition-colors hover:border-laku-blue hover:text-laku-blue disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <ImagePlus className="size-5" aria-hidden />
            )}
            <span className="text-[10px] font-semibold">
              {uploading ? uploadingLabel : addLabel}
            </span>
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-sm font-medium text-laku-alert">{error}</p>
      ) : null}
    </div>
  );
}

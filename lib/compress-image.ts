// Browser-only: shrinks a photo before it's PUT to R2. Scales the long edge
// down to maxEdge and re-encodes as WebP (JPEG where the browser can't encode
// WebP). Re-encoding also drops EXIF metadata such as GPS location.
// Falls back to the original file if anything fails or the result is bigger.
export async function compressImage(
  file: File,
  { maxEdge, quality }: { maxEdge: number; quality: number },
): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file); // applies EXIF orientation
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let blob = await toBlob(canvas, "image/webp", quality);

    // Browsers that can't encode WebP silently return PNG instead.
    if (blob?.type !== "image/webp") {
      // JPEG has no transparency, so flatten onto white first.
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      blob = await toBlob(canvas, "image/jpeg", quality);
    }
    if (!blob || blob.size >= file.size) return file;

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]*$/, "") + `.${extension}`;
    return new File([blob], name, { type: blob.type });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

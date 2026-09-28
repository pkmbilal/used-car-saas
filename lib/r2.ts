import "server-only";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 speaks the S3 API. Files go browser → R2 via presigned PUT
// URLs; this module only signs URLs and cleans up objects.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // The SDK's default checksums add headers the browser won't send, which
  // makes R2 reject presigned PUTs.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// Listing photos live in the public bucket (served from R2_PUBLIC_URL). ID
// documents live in a bucket with no public access, read via presigned GETs.
export const PUBLIC_BUCKET = process.env.R2_BUCKET_NAME!;
export const PRIVATE_BUCKET = process.env.R2_PRIVATE_BUCKET_NAME!;

// Content type and length are part of the signature, so the browser must
// upload exactly the file it asked to upload.
export function presignPut(
  key: string,
  contentType: string,
  contentLength: number,
  bucket = PUBLIC_BUCKET,
) {
  return getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    { expiresIn: 5 * 60 },
  );
}

// Short-lived read link for a private object.
export function presignGet(key: string, bucket = PRIVATE_BUCKET) {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: 5 * 60,
  });
}

export async function deleteObjects(keys: string[], bucket = PUBLIC_BUCKET) {
  if (keys.length === 0) return;
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }),
  );
}

export function publicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

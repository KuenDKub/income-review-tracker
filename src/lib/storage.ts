/**
 * Cloud storage for file uploads.
 * Uses Supabase Storage via S3-compatible API when env vars are set.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export interface UploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

function getSupabaseStorage() {
  const endpoint = process.env.SUPABASE_S3_ENDPOINT;
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "income-review-tracker";
  const publicUrlBase = process.env.SUPABASE_PUBLIC_URL;

  if (!endpoint || !accessKeyId || !secretAccessKey || !publicUrlBase) {
    return null;
  }

  const client = new S3Client({
    region: "us-east-1",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const base = publicUrlBase.endsWith("/")
    ? publicUrlBase.slice(0, -1)
    : publicUrlBase;

  return {
    async upload(
      buffer: Buffer,
      storageKey: string,
      mimeType: string,
      originalFileName: string
    ): Promise<UploadResult> {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: storageKey,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      const publicUrl = `${base}/${bucket}/${storageKey}`;
      return {
        filePath: publicUrl,
        fileName: originalFileName,
        fileSize: buffer.length,
        mimeType,
      };
    },

    async delete(filePath: string): Promise<void> {
      const prefix = `${base}/${bucket}/`;
      if (!filePath.startsWith(prefix)) {
        console.warn("Storage delete: URL does not match expected prefix", filePath);
        return;
      }
      const key = filePath.slice(prefix.length);
      if (!key) return;
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

export function getStorage(): ReturnType<typeof getSupabaseStorage> {
  return getSupabaseStorage();
}

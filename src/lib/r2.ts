import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "noqt-memory";

export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

export async function uploadToR2(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: path,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL}/${path}`;
}

export async function deleteFromR2(path: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: path }));
}

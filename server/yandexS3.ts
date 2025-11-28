import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import path from "path";

const AWS_ENDPOINT_URL = process.env.AWS_ENDPOINT_URL || "https://storage.yandexcloud.net";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || "";
const AWS_SECRET_ACCESS_KEY = process.env.YANDEX_S3_SECRET || "";
const AWS_BUCKET = process.env.AWS_BUCKET || "labs-data";
const AWS_REGION = "ru-central1";

const s3Client = new S3Client({
  endpoint: AWS_ENDPOINT_URL,
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

function generateRandomFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  const randomId = randomUUID().replace(/-/g, "");
  return `${randomId}${ext}`;
}

function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".bmp": "image/bmp",
    ".ico": "image/x-icon",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export async function uploadImageToYandexS3(
  fileBuffer: Buffer,
  originalFileName: string,
  folder: string = "images"
): Promise<UploadResult> {
  try {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      return {
        success: false,
        error: "Yandex S3 credentials not configured",
      };
    }

    const randomFileName = generateRandomFileName(originalFileName);
    const objectKey = folder ? `${folder}/${randomFileName}` : randomFileName;
    const contentType = getContentType(originalFileName);

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const publicUrl = `https://storage.yandexcloud.net/${AWS_BUCKET}/${objectKey}`;

    console.log(`Image uploaded to Yandex S3: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading to Yandex S3:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
}

export async function getPresignedUploadUrl(
  originalFileName: string,
  folder: string = "images",
  ttlSeconds: number = 900
): Promise<{ uploadUrl: string; publicUrl: string } | null> {
  try {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      console.error("Yandex S3 credentials not configured");
      return null;
    }

    const randomFileName = generateRandomFileName(originalFileName);
    const objectKey = folder ? `${folder}/${randomFileName}` : randomFileName;
    const contentType = getContentType(originalFileName);

    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: objectKey,
      ContentType: contentType,
      ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: ttlSeconds });
    const publicUrl = `https://storage.yandexcloud.net/${AWS_BUCKET}/${objectKey}`;

    return {
      uploadUrl,
      publicUrl,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return null;
  }
}

export function isYandexS3Configured(): boolean {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);
}

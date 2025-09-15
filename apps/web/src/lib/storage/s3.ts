import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_PUBLIC!;
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL!; // ör: https://YOUR_BUCKET.s3.amazonaws.com

export async function getSignedUrlForAvatar({ contentType }: { contentType: string }) {
  const key = `avatars/${crypto.randomUUID()}`; // kullanıcı girişi yok → güvenli
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    // ACL kullanmayın: Bucket owner enforced ortamlarında 403 üretir
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 }); // 60 sn
  const publicUrl = `${PUBLIC_BASE}/${key}`;
  return { uploadUrl, publicUrl };
}

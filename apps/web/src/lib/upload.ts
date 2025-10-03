type PresignPost = { uploadUrl: string; fields: Record<string, string>; key: string; fileUrl: string };
type PresignPut  = { url: string; method?: 'PUT'; fileUrl: string };

// Backend folder mapping
const FolderMap = {
  avatar: 'profiles',     // profil foto
  cv: 'documents',        // CV (pdf/doc/docx)
  portfolio: 'portfolios',// görsel & video
  jobImage: 'jobs',       // iş ilanı görseli (varsa)
  verification: 'documents/verification', // agency verification documents
} as const;

export async function uploadWithPresigned(file: File, type: 'avatar'|'cv'|'portfolio'|'jobImage'|'verification') {
  const presignRes = await fetch('/api/proxy/api/v1/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ 
      filename: file.name, 
      contentType: file.type || 'application/octet-stream', 
      folder: FolderMap[type] 
    }),
  });
  if (!presignRes.ok) throw new Error(`presign failed: ${presignRes.status}`);
  const presign = await presignRes.json() as PresignPost & PresignPut;

  if ((presign as PresignPost).fields) {
    const { uploadUrl, fields, fileUrl } = presign as PresignPost;
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append('file', file);
    const r = await fetch(uploadUrl, { method: 'POST', body: fd });
    if (!r.ok) {
      const t = await r.text().catch(()=>'');
      throw new Error(`upload failed: ${r.status} ${t}`);
    }
    return { fileUrl };
  } else {
    const { url, fileUrl } = presign as PresignPut;
    const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
    if (!r.ok) {
      const t = await r.text().catch(()=>'');
      throw new Error(`upload failed: ${r.status} ${t}`);
    }
    return { fileUrl };
  }
}

// Convenience wrappers
export async function uploadAvatar(file: File) {
  return uploadWithPresigned(file, 'avatar');
}

export async function uploadCv(file: File) {
  return uploadWithPresigned(file, 'cv');
}

export async function uploadVerificationDocument(file: File) {
  return uploadWithPresigned(file, 'verification');
}


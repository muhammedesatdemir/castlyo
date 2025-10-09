// Presigned URL helper with profile fallbacks
type PresignedPut = { type: 'PUT'; putUrl: string; fileUrl: string; contentType?: string };
type PresignedPost = { url: string; fields: Record<string, string>; fileUrl?: string };

function guessMime(name: string) {
  const n = name.toLowerCase();
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function slugify(s: string) {
  return s.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase();
}

export async function getPresignedWithProfileFallbacks(
  file: File, 
  profileId: string, 
  purpose: string = "profile_image",
  folder: string = "profiles"
) {
  // Backend DTO: fileName, fileType, folder (profiles | portfolios | documents | jobs)
  // CV için folder'ı documents yap
  const actualFolder = purpose === "cv" ? "documents" : "profiles";
  
  const payload = {
    fileName: `${profileId}/${Date.now()}-${slugify(file.name)}`,
    fileType: file.type || guessMime(file.name),
    folder: actualFolder, // 'profiles' veya 'documents' - backend enum'u
  };

  console.log(`[UPLOAD] Presigned payload:`, payload);
  
  const res = await fetch("/api/proxy/api/v1/upload/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = "";
    try {
      const j = await res.json();
      errorMsg = j?.message || JSON.stringify(j);
    } catch {
      errorMsg = await res.text();
    }
    console.log(`[UPLOAD] Presigned failed (${res.status}):`, errorMsg);
    throw new Error(errorMsg || "Presigned URL alınamadı.");
  }

  console.log(`[UPLOAD] Presigned URL success!`);
  return res.json() as Promise<PresignedPut | PresignedPost>;
}

export async function uploadFileWithPresigned(
  file: File, 
  profileId: string, 
  purpose: string = "profile_image",
  folder: string = "profiles"
) {
  // Boyut kontrolü
  const maxSize = purpose === "cv" ? 5 * 1024 * 1024 : 2 * 1024 * 1024; // 5MB for CV, 2MB for images
  if (file.size > maxSize) {
    throw new Error(`Dosya boyutu ${Math.round(maxSize / 1024 / 1024)}MB'ı aşamaz`);
  }

  // Uzantı kontrolü
  const allowedExtensions = purpose === "cv" 
    ? [".pdf"] 
    : [".jpg", ".jpeg", ".png", ".webp"];
  
  const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExt)) {
    throw new Error(`Desteklenen dosya formatları: ${allowedExtensions.join(", ")}`);
  }

  // Content-Type validation
  const allowedTypes = purpose === "cv" 
    ? ["application/pdf"] 
    : ["image/jpeg", "image/png", "image/webp"];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Desteklenen dosya türleri: ${allowedTypes.join(", ")}`);
  }

  const presigned = await getPresignedWithProfileFallbacks(file, profileId, purpose, folder);

  // Backend yanıtı: { type: 'PUT', putUrl: string, fileUrl: string, contentType: string }
  const putResponse = presigned as PresignedPut;
  if (putResponse.type === 'PUT' && putResponse.putUrl) {
    console.log("[UPLOAD] Using PUT method with Content-Type:", putResponse.contentType);
    const put = await fetch(putResponse.putUrl, {
      method: "PUT",
      headers: { 
        "Content-Type": putResponse.contentType || file.type || guessMime(file.name) 
      },
      body: file,
    });
    if (!put.ok) {
      const errorText = await put.text();
      console.error("[UPLOAD] PUT failed:", put.status, errorText);
      throw new Error(`Dosya yüklenemedi (HTTP ${put.status}): ${errorText}`);
    }
    return putResponse.fileUrl;
  }

  throw new Error("Beklenmeyen presigned yanıtı.");
}

export async function saveProfileAvatar(fileUrl: string) {
  // Doğru endpoint: /talents/me (profiles/talent/me değil)
  const res = await fetch("/api/proxy/api/v1/talents/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      avatar_url: fileUrl,
      photo_url: fileUrl,
      profile_photo_url: fileUrl 
    }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Profil güncellenemedi: ${errorText}`);
  }
  
  return res.json();
}

export async function saveProfileCV(fileUrl: string) {
  // Doğru endpoint: /talents/me
  const res = await fetch("/api/proxy/api/v1/talents/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      cv_url: fileUrl,
      experience: `CV: ${fileUrl}` // Experience alanına CV URL'i ekle
    }),
    credentials: "include",
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`CV kaydedilemedi: ${errorText}`);
  }
  
  return res.json();
}

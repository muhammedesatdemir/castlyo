// Re-export the new presigned upload functions
export { 
  uploadFileWithPresigned, 
  saveProfileAvatar, 
  saveProfileCV 
} from './upload-presigned';

// Legacy wrapper for backward compatibility
export async function uploadWithPresigned(file: File, type: 'avatar'|'cv'|'portfolio'|'jobImage'|'verification') {
  // Get profile ID from current user context
  // This is a simplified approach - in real implementation you might want to pass profileId explicitly
  const profileId = 'current-user'; // This should be replaced with actual profile ID
  
  const folderMap = {
    avatar: 'profiles/images',
    cv: 'documents',
    portfolio: 'portfolios',
    jobImage: 'jobs',
    verification: 'documents/verification',
  } as const;

  const purposeMap = {
    avatar: 'profile_image',
    cv: 'cv',
    portfolio: 'portfolio',
    jobImage: 'job_image',
    verification: 'verification_document',
  } as const;

  const { uploadFileWithPresigned } = await import('./upload-presigned');
  const fileUrl = await uploadFileWithPresigned(
    file, 
    profileId, 
    purposeMap[type], 
    folderMap[type]
  );

  return { fileUrl };
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


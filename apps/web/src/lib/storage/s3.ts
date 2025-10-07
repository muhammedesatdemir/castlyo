// AWS S3 storage is optional - only used when AWS SDK is available
export async function getSignedUrlForAvatar({ contentType }: { contentType: string }) {
  // For now, return a mock response since AWS SDK is not installed
  // This should be implemented when AWS S3 is properly configured
  throw new Error('AWS S3 is not configured. Please use local storage or configure AWS SDK.');
}

import { useState } from 'react'
import { uploadApi } from '@/lib/api'

interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

export function useFileUpload() {
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const uploadFiles = async (
    files: File[],
    folder: 'profiles' | 'portfolios' | 'documents' | 'jobs'
  ): Promise<string[]> => {
    setIsUploading(true)
    
    // Initialize upload progress
    const initialUploads: UploadProgress[] = files.map(file => ({
      file,
      progress: 0,
      status: 'pending'
    }))
    setUploads(initialUploads)

    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Update status to uploading
        setUploads(prev => prev.map((upload, index) => 
          index === i ? { ...upload, status: 'uploading' } : upload
        ))

        try {
          // Get presigned URL
          const presignedResponse = await uploadApi.getPresignedUrl({
            fileName: file.name,
            fileType: file.type,
            folder
          })

          const { url, fields, fileUrl } = presignedResponse.data

          // For development, we'll simulate upload progress
          // In production, this would be actual S3 upload with progress tracking
          await simulateUpload(file, i, fileUrl)

          uploadedUrls.push(fileUrl)

          // Update status to completed
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { 
              ...upload, 
              status: 'completed', 
              progress: 100,
              url: fileUrl
            } : upload
          ))

        } catch (error) {
          console.error(`Error uploading file ${file.name}:`, error)
          
          setUploads(prev => prev.map((upload, index) => 
            index === i ? { 
              ...upload, 
              status: 'error',
              error: 'Upload failed'
            } : upload
          ))
        }
      }

      return uploadedUrls
    } finally {
      setIsUploading(false)
    }
  }

  const simulateUpload = async (file: File, index: number, fileUrl: string): Promise<void> => {
    // Simulate upload progress for development
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100))
      
      setUploads(prev => prev.map((upload, i) => 
        i === index ? { ...upload, progress } : upload
      ))
    }
  }

  const deleteFile = async (fileUrl: string): Promise<void> => {
    try {
      await uploadApi.deleteFile(fileUrl)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  const resetUploads = () => {
    setUploads([])
    setIsUploading(false)
  }

  return {
    uploads,
    isUploading,
    uploadFiles,
    deleteFile,
    resetUploads
  }
}

"use client"

import type React from "react"

import { useState } from "react"
import { useSupabase } from "@/lib/supabase-provider"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { FileIcon, Loader2, Trash2, Upload } from "lucide-react"

interface FileUploadProps {
  reservationId: string
  onUploadComplete: () => void
}

export function FileUpload({ reservationId, onUploadComplete }: FileUploadProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${reservationId}/${Date.now()}.${fileExt}`

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage.from("meeting-attachments").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        onUploadProgress: (progress) => {
          setProgress(Math.round((progress.loaded / progress.total) * 100))
        },
      })

      if (uploadError) throw uploadError

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("meeting-attachments").getPublicUrl(fileName)

      // Save file metadata to database
      const { error: dbError } = await supabase.from("attachments").insert({
        reservation_id: reservationId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: fileName,
        public_url: publicUrl,
      })

      if (dbError) throw dbError

      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully",
      })

      setFile(null)
      onUploadComplete()
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">Attachment</Label>
        <div className="flex items-center gap-2">
          <Input id="file" type="file" onChange={handleFileChange} disabled={uploading} className="flex-1" />
          <Button type="button" onClick={handleUpload} disabled={!file || uploading} size="icon">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-center text-gray-500">Uploading: {progress}%</p>
        </div>
      )}

      {file && !uploading && (
        <div className="flex items-center justify-between p-2 border rounded">
          <div className="flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )}
    </div>
  )
}

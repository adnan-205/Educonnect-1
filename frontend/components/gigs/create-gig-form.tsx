'use client';

import { useState, useRef } from 'react';
import { gigsApi, uploadsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Upload, Image as ImageIcon } from 'lucide-react';

export default function CreateGigForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file for thumbnail');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Thumbnail file size must be less than 5MB');
        return;
      }

      setThumbnailFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
      setError(''); // Clear any previous errors
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const gigData = {
      title: formData.get('title'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      category: formData.get('category'),
      duration: Number(formData.get('duration')),
      availability: {
        days: formData.getAll('days'),
        times: formData.getAll('times'),
      },
    };

    try {
      // First create the gig
      const createdGig = await gigsApi.createGig(gigData);
      const gigId = createdGig.data._id;

      // If thumbnail is selected, upload it
      if (thumbnailFile && gigId) {
        setUploading(true);
        try {
          await uploadsApi.uploadGigThumbnail(thumbnailFile, gigId, 'educonnect/gigs/thumbnails');
        } catch (uploadErr: any) {
          console.error('Thumbnail upload failed:', uploadErr);
          // Don't fail the entire process if thumbnail upload fails
          setError('Gig created successfully, but thumbnail upload failed. You can add a thumbnail later.');
        } finally {
          setUploading(false);
        }
      }

      setSuccess(true);
      e.currentTarget.reset();
      setThumbnailFile(null);
      setThumbnailPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create gig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold">Create a New Gig</h2>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>Gig created successfully!</AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title
            </label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Enter gig title"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              required
              placeholder="Enter gig description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1">
                Price ($)
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                placeholder="Enter price"
              />
            </div>
            <div>
              <label htmlFor="duration" className="block text-sm font-medium mb-1">
                Duration (minutes)
              </label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="15"
                step="15"
                required
                placeholder="Enter duration"
              />
            </div>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <Input
              id="category"
              name="category"
              required
              placeholder="Enter category"
            />
          </div>
          
          {/* Thumbnail Upload Section */}
          <div>
            <Label htmlFor="thumbnail" className="block text-sm font-medium mb-2">
              Gig Thumbnail (Optional)
            </Label>
            <div className="space-y-4">
              <Input
                ref={fileInputRef}
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {thumbnailFile ? thumbnailFile.name : "Choose Thumbnail Image"}
              </Button>
              
              {thumbnailFile && (
                <div className="text-sm text-muted-foreground">
                  File: {thumbnailFile.name} ({(thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
              
              {thumbnailPreview && (
                <div className="mt-4">
                  <Label className="block text-sm font-medium mb-2">Preview:</Label>
                  <div className="relative w-32 h-20 bg-muted rounded-lg overflow-hidden">
                    <img
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading || uploading}>
            {loading ? (uploading ? 'Creating & Uploading...' : 'Creating...') : 'Create Gig'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { gigs } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CreateGigForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      await gigs.create(gigData);
      setSuccess(true);
      e.currentTarget.reset();
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Gig'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { gigsApi } from '@/services/api';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Star } from 'lucide-react';
import Link from 'next/link';

interface Gig {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  duration: number;
  thumbnailUrl?: string;
  averageRating?: number;
  reviewsCount?: number;
  teacher: {
    name: string;
    email: string;
  };
}

export default function GigsList() {
  const [gigsList, setGigsList] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadGigs();
  }, []);

  const loadGigs = async () => {
    try {
      const response = await gigsApi.getAllGigs();
      setGigsList(response.data);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {gigsList.map((gig) => (
        <Card key={gig._id} className="overflow-hidden">
          {/* Thumbnail */}
          <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-purple-500/10 grid place-items-center overflow-hidden">
            {gig.thumbnailUrl ? (
              <img
                src={gig.thumbnailUrl}
                alt={gig.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <BookOpen className="h-12 w-12 text-primary/50" />
            )}
          </div>
          <CardHeader>
            <h3 className="text-lg font-semibold">{gig.title}</h3>
            <p className="text-sm text-gray-500">by {gig.teacher.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span>{(gig.averageRating ?? 0).toFixed(1)} / 5</span>
              <span className="text-gray-400">·</span>
              <span>{gig.reviewsCount ?? 0} reviews</span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">{gig.description}</p>
            <div className="flex justify-between text-sm">
              <span>Duration: {gig.duration} mins</span>
              <span className="font-semibold">${gig.price}</span>
            </div>
            <div className="mt-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                {gig.category}
              </span>
            </div>
          </CardContent>
          <CardFooter>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Link href={`/gigs/${gig._id}`} className="col-span-1">
                <Button variant="outline" className="w-full">View Details</Button>
              </Link>
              {user?.role === 'student' && (
                <Link href={`/book/${gig._id}`} className="col-span-1">
                  <Button className="w-full">Book Now</Button>
                </Link>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { gigsApi } from '@/services/api';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';

interface Gig {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  duration: number;
  thumbnailUrl?: string;
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
            {user?.role === 'student' && (
              <Button 
                className="w-full"
                onClick={() => {
                  // Handle booking logic
                }}
              >
                Book Now
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

'use client';
import { cleanText, fetchCityName } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import {
  CircleX,
  Nfc,
  CalendarDays,
  FileUser,
  PersonStanding,
  MapPin,
  TrendingUp,
  Loader2,
  Check,
} from 'lucide-react';
import CustomTimeline from './Timeline';
import GoogleMap from './GoogleMap';
import toast from 'react-hot-toast';

interface Post {
  _id: string;
  Name: string;
  Location: string;
  'Preferred way of contact': string;
  'Contact info': string;
  'Frequency of domestic violence': string;
  'Relationship with perpetrator': string;
  'Severity of domestic violence': string;
  'Nature of domestic violence': string;
  'Impact on children': string;
  'Culprit details': string;
  'Other info': string;
  status: string;
}

function PostDetail({ id }: { id: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    const fetchPostById = async () => {
      try {
        const response = await fetch(`/api/postbyid/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      }
    };

    fetchPostById();
  }, [id]);

  useEffect(() => {
    if (post) {
      const cleanLoc = cleanText(post.Location);
      const [lat, lng] = cleanLoc.split(',').map(Number);

      const fetchCity = async () => {
        try {
          const cityName = await fetchCityName(lat, lng);
          setCity(cityName);
        } catch (err) {
          console.error('Failed to fetch city name:', err);
        }
      };

      fetchCity();
    }
  }, [post]);

  if (error) {
    return <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">Error: {error}</div>;
  }

  if (!post) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }
  const cleanLoc = cleanText(post.Location);
  const [lat, lng] = cleanLoc.split(',').map(Number);

  const handleCloseIssue = async (issueId: string) => {
    try {
      const response = await fetch('/api/closeIssue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issueId }),
      });

      if (!response.ok) {
        throw new Error('Failed to close issue');
      }

      // const data = await response.json();
      toast.success('Issue closed successfully');
      setPost((prevPost) =>
        prevPost ? { ...prevPost, status: 'closed' } : null
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-3 py-4 sm:p-5">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <h1 className="break-words text-2xl font-bold sm:text-3xl">{post.Name}</h1>
        {post.status === 'pending' && (
          <Button
            onClick={() => handleCloseIssue(post._id)}
            className="flex items-center space-x-2"
          >
            <CircleX />
            Close Issue
          </Button>
        )}
        {post.status === 'closed' && (
          <Button className="flex items-center space-x-2 bg-green-500 text-white hover:bg-green-600">
            <Check />
            Issue Closed
          </Button>
        )}
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="max-w-sm w-full rounded-md border flex flex-col gap-3 border-gray-400 p-3">
          <div className="flex items-center justify-between w-full gap-5">
            <h2 className="text-lg font-semibold">Preferred way of contact</h2>
            <Nfc className="text-gray-700" />
          </div>
          <p>{post['Preferred way of contact']}</p>
          <p>{post['Contact info']}</p>
        </div>
        <div className="max-w-sm w-full rounded-md border flex flex-col gap-3 border-gray-400 p-3">
          <div className="flex items-center justify-between w-full gap-5">
            <h2 className="text-lg font-semibold">Frequency of Incidents</h2>
            <CalendarDays className="text-gray-700" />
          </div>
          <p>{post['Frequency of domestic violence']}</p>
          <p>{post['Relationship with perpetrator']}</p>
        </div>
        <div className="max-w-sm w-full rounded-md border flex flex-col gap-3 border-gray-400 p-3">
          <div className="flex items-center justify-between w-full gap-5">
            <h2 className="text-lg font-semibold">
              Nature of Incident
            </h2>
            <PersonStanding className="text-gray-700" />
          </div>
          <p>{post['Impact on children']}</p>
          <p>{post['Severity of domestic violence']}</p>
        </div>
        <div className="max-w-sm w-full rounded-md border flex flex-col gap-3 border-gray-400 p-3">
          <div className="flex items-center justify-between w-full gap-5">
            <h2 className="text-lg font-semibold">Culprit details</h2>
            <FileUser className="text-gray-700" />
          </div>
          <p>{post['Culprit details']}</p>
          <p>{post['Other info']}</p>
        </div>
        <div className="max-w-sm w-full rounded-md border flex flex-col gap-3 border-gray-400 p-3">
          <div className="flex items-center justify-between w-full gap-5">
            <h2 className="text-lg font-semibold">Location</h2>
            <MapPin className="text-gray-700" />
          </div>
          <p>{post['Location']}</p>
          <p>{city}</p>
        </div>
        <div className="max-w-sm w-full rounded-md border flex flex-col gap-3 border-gray-400 p-3">
          <div className="flex items-center justify-between w-full gap-5">
            <h2 className="text-lg font-semibold">Current Status</h2>
            <TrendingUp className="text-gray-700" />
          </div>
          <p>{post.status}</p>
          <p>
            Resolve this issue by contacting the person and providing necessary
          </p>
        </div>
      </div>
      <div className="mt-5 flex w-full flex-col gap-3 lg:flex-row">
        <div className="rounded-md w-full">
          <GoogleMap
            lat={lat}
            lng={lng}
            label={city || post.Location}
            height="360px"
            zoom={15}
          />
        </div>
        <div className="h-[370px] w-full overflow-y-auto rounded-md border border-gray-400 p-3 sm:p-4">
          <h1 className="text-center text-lg font-semibold mb-4">
            Recent Activities
          </h1>
          <CustomTimeline />
        </div>
      </div>
    </div>
  );
}

export default PostDetail;

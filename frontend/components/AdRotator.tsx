'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Ad {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  link?: string;
}

const AdRotator = ({ targetAudience = 'doctor' }: { targetAudience?: string }) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const fetchAds = async () => {
    try {
      const response = await api.get(`/ads?targetAudience=${targetAudience}&limit=10`);
      setAds(response.data.ads);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (adId: string, link?: string) => {
    try {
      await api.post(`/ads/${adId}/click`);
      if (link) {
        window.open(link, '_blank');
      }
    } catch (error) {
      console.error('Error tracking ad click:', error);
      if (link) {
        window.open(link, '_blank');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div
        className="cursor-pointer transition-opacity duration-500"
        onClick={() => handleAdClick(currentAd.id, currentAd.link)}
      >
        {currentAd.imageUrl ? (
          <img
            src={currentAd.imageUrl}
            alt={currentAd.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
            <div className="text-center p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {currentAd.title}
              </h3>
              {currentAd.description && (
                <p className="text-gray-600">{currentAd.description}</p>
              )}
            </div>
          </div>
        )}
      </div>
      {ads.length > 1 && (
        <div className="flex justify-center gap-2 p-3 bg-gray-50">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-teal-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AdRotator;


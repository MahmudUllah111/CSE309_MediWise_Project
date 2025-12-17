'use client';

import { useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

interface AdsPanelProps {
  position: 'left' | 'right';
  departmentId?: string;
}

export default function AdsPanel({ position, departmentId }: AdsPanelProps) {
  const [ads, setAds] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAds();
  }, [departmentId]);

  useEffect(() => {
    if (ads.length > 1) 
    {
      intervalRef.current = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % ads.length);
      }, Math.random() * 2000 + 4000); // 4000-6000ms
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ads.length]);

  const fetchAds = async () => {
    try {
      const deptParam = departmentId ? `&departmentId=${departmentId}` : '';
      const response = await api.get(`/ads?limit=50&targetAudience=doctor${deptParam}`);
      
      console.log('Ads API response:', response.data);
      
      if (response.data && response.data.success !== false) {
        const fetchedAds = response.data.ads || [];
        console.log(`Fetched ${fetchedAds.length} total ads for ${position} side`);
        
        // Filter ads based on position: left = new medicines, right = old medicines
        let filteredAds: any[] = [];
        
        if (position === 'left') {
          // Left side: Show new medicines (isNewMedicine = true)
          filteredAds = fetchedAds.filter((ad: any) => ad.isNewMedicine === true || ad.isNewMedicine === 'true');
          console.log(`Left side: ${filteredAds.length} new medicine ads out of ${fetchedAds.length} total`);
        } else {
          // Right side: Show old medicines (isNewMedicine = false)
          filteredAds = fetchedAds.filter((ad: any) => ad.isNewMedicine === false || ad.isNewMedicine === 'false' || ad.isNewMedicine === null || ad.isNewMedicine === undefined);
          console.log(`Right side: ${filteredAds.length} old medicine ads out of ${fetchedAds.length} total`);
        }
        
        // If no ads match the position filter, use all ads
        if (filteredAds.length === 0 && fetchedAds.length > 0) {
          console.log(`No ${position} ads found, showing all ${fetchedAds.length} ads`);
          setAds(fetchedAds);
        } else {
          setAds(filteredAds);
        }
      } else {
        console.log('No ads returned or API error');
        setAds([]);
      }
    } catch (error: any) {
      console.error('Error fetching ads:', error);
      // Set empty array on error to prevent UI issues
      setAds([]);
    }
  };

  const handleAdClick = async (ad: any) => {
    if (ad.link) {
      window.open(ad.link, '_blank');
    }
    try {
      await api.post(`/ads/${ad.id}/click`);
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  if (ads.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        No ads available
      </div>
    );
  }

  const currentAd = ads[currentAdIndex];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-3">
      <div
        onClick={() => handleAdClick(currentAd)}
        className="w-full max-w-[260px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-600"
      >
        {/* Medicine Image - First (Bigger) */}
        {currentAd.imageUrl && (
          <div className="w-full mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center p-2.5 shadow-inner">
            <img
              src={currentAd.imageUrl}
              alt={currentAd.medicineName || currentAd.title}
              className="w-full h-48 object-contain drop-shadow-lg"
            />
          </div>
        )}
        
        {/* Medicine Name - Large, Bold */}
        <div className="mb-4">
          <h3 className="font-extrabold text-gray-900 dark:text-gray-100 text-xl leading-tight text-center mb-3 tracking-tight">
            {currentAd.medicineName || currentAd.title}
          </h3>
          
          {/* Indications - For Which Diseases */}
          {currentAd.indications && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300 font-semibold text-center">
                For: <span className="font-bold">{currentAd.indications}</span>
              </p>
            </div>
          )}
          
          {/* Description */}
          {currentAd.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3 text-left font-medium">
              {currentAd.description}
            </p>
          )}
        </div>
        
        {/* New Badge - Bottom Left */}
        {currentAd.isNewMedicine && (
          <div className="flex justify-start mt-3">
            <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full font-bold shadow-lg">
              ✨ New Medicine
            </span>
          </div>
        )}
      </div>
      
      {/* Ad indicator dots */}
      {ads.length > 1 && (
        <div className="flex gap-2 mt-4">
          {ads.map((_, index) => (
            <div
              key={index}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentAdIndex
                  ? 'bg-teal-600 shadow-lg scale-125'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
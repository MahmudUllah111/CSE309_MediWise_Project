'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FiExternalLink } from 'react-icons/fi';

interface MedicineAd {
  id: string;
  title: string;
  medicineName?: string;
  indications?: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  category?: string;
  departmentId?: string;
}

const BottomAdPanel = () => {
  const [ads, setAds] = useState<MedicineAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 4000); // Rotate every 4 seconds

      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const setDefaultAds = () => {
    setAds([
      {
        id: '1',
        title: 'MediTech Pro',
        description: 'Advanced medical equipment for modern healthcare',
        category: 'Medical Equipment',
        link: '#',
      },
      {
        id: '2',
        title: 'HealthCare Plus',
        description: 'Complete healthcare management solution',
        category: 'Software',
        link: '#',
      },
      {
        id: '3',
        title: 'LabConnect',
        description: 'Seamless laboratory test integration',
        category: 'Laboratory',
        link: '#',
      },
    ]);
  };

  const fetchAds = async () => {
    try {
      // Fetch old medicines (isNewMedicine=false) for bottom panel
      const response = await api.get('/ads?targetAudience=doctor&isNewMedicine=false&limit=10');
      const fetchedAds = response.data?.ads || [];
      if (fetchedAds.length > 0) {
        setAds(fetchedAds);
      } else {
        // If no ads returned, use default ads
        setDefaultAds();
      }
    } catch (error: any) {
      // Silently handle errors and use default ads
      setDefaultAds();
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (adId: string, link?: string) => {
    try {
      await api.post(`/ads/${adId}/click`);
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
    if (link && link !== '#') {
      window.open(link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="hidden lg:block fixed bottom-0 left-[476px] right-0 h-[180px] bg-white border-t border-gray-200 shadow-lg z-40 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <div className="animate-pulse space-y-2 flex-1">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  return (
    <div className="hidden lg:block fixed bottom-0 left-[200px] right-0 h-[150px] bg-white border-t border-gray-200 shadow-lg z-30 overflow-hidden pointer-events-auto">
      <div className="max-w-7xl mx-auto h-full px-4 py-2">
        <div
          className="h-full bg-gradient-to-br from-indigo-50 to-purple-50 p-3 border-2 border-indigo-200 cursor-pointer hover:shadow-md transition-all rounded-lg overflow-hidden flex items-center"
          onClick={() => handleAdClick(currentAd.id, currentAd.link)}
        >
          {/* Horizontal Layout: Image -> Name -> Description */}
          <div className="flex items-center gap-4 flex-1 min-h-0 overflow-hidden w-full h-full">
            {/* Image/Icon - Left */}
            {currentAd.imageUrl ? (
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-white flex-shrink-0">
                <img
                  src={currentAd.imageUrl}
                  alt={currentAd.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                <div className="text-2xl font-bold text-indigo-600">
                  {currentAd.title?.charAt(0) || 'A'}
                </div>
              </div>
            )}

            {/* Name Section - Middle */}
            <div className="flex flex-col justify-center min-w-0 flex-shrink-0">
              {/* Panel Label - Old Medicine */}
              <div className="mb-1">
                <span className="inline-block px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded uppercase">
                  Old Medicine
                </span>
              </div>
              
              {/* Medicine Name */}
              <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight">
                {currentAd.medicineName || currentAd.title}
              </h3>

              {/* Conditions */}
              {currentAd.indications ? (
                <div>
                  <p className="text-[10px] text-gray-500 font-medium mb-1">Conditions:</p>
                  <div className="flex flex-wrap gap-1">
                    {currentAd.indications.split(',').slice(0, 2).map((indication, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-semibold rounded"
                      >
                        {indication.trim()}
                      </span>
                    ))}
                    {currentAd.indications.split(',').length > 2 && (
                      <span className="text-[10px] text-gray-500">+{currentAd.indications.split(',').length - 2} more</span>
                    )}
                  </div>
                </div>
              ) : currentAd.category ? (
                <div>
                  <p className="text-[10px] text-gray-500 font-medium mb-1">Category:</p>
                  <span className="inline-block px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-semibold rounded">
                    {currentAd.category}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Description Section - Right */}
            {currentAd.description && (
              <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center">
                <p className="text-[10px] text-gray-500 font-medium mb-1">Description:</p>
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                  {currentAd.description}
                </p>
              </div>
            )}

            {/* Learn More Link - Far Right */}
            <div className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-[11px] font-semibold flex-shrink-0">
              <span>Learn more</span>
              <FiExternalLink className="text-[11px]" />
            </div>
          </div>

          {/* Ad Indicator Dots */}
          {ads.length > 1 && (
            <div className="flex justify-center gap-1 mt-1 flex-shrink-0">
              {ads.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`h-1 w-1 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-indigo-600 w-3' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to ad ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottomAdPanel;


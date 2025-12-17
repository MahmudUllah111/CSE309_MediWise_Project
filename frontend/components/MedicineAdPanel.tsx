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

interface MedicineAdPanelProps {
  targetAudience?: 'patient' | 'doctor';
}

const MedicineAdPanel = ({ targetAudience = 'patient' }: MedicineAdPanelProps) => {
  const [ads, setAds] = useState<MedicineAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [targetAudience]);

  useEffect(() => {
    if (ads.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000); // Rotate every 5 seconds

      return () => clearInterval(interval);
    }
  }, [ads.length]);

  const setDefaultAds = () => {
    if (targetAudience === 'doctor') {
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
    } else {
      setAds([
        {
          id: '1',
          title: 'NeuroCalm',
          description: 'Advanced neurological support for better brain health',
          category: 'Neurology',
          link: '#',
        },
        {
          id: '2',
          title: 'CardioCare Plus',
          description: 'Complete heart health solution for cardiovascular wellness',
          category: 'Cardiology',
          link: '#',
        },
        {
          id: '3',
          title: 'OrthoFlex',
          description: 'Joint and bone support for active lifestyle',
          category: 'Orthopedics',
          link: '#',
        },
      ]);
    }
  };

  const fetchAds = async () => {
    try {
      // For doctor panel, fetch new medicines (isNewMedicine=true)
      // For patient panel, fetch all medicines
      const queryParams = targetAudience === 'doctor' 
        ? `targetAudience=${targetAudience}&isNewMedicine=true&limit=10`
        : `targetAudience=${targetAudience}&limit=10`;
      
      const response = await api.get(`/ads?${queryParams}`);
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
      <div className="hidden lg:block fixed left-64 top-0 h-screen w-[220px] bg-white border-r border-gray-200 shadow-lg z-40 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentIndex];

  return (
    <div className="hidden lg:block fixed left-0 top-0 h-screen w-[220px] bg-white border-r border-gray-200 shadow-lg z-50 overflow-hidden">
      <div className="h-full flex flex-col overflow-y-auto">
        <div className="p-4 flex-shrink-0 flex items-center justify-center min-h-screen">
          <div className="w-full">
            {/* Ad Container */}
            <div
              className="bg-gradient-to-br from-teal-50 to-indigo-50 rounded-xl p-4 border-2 border-teal-200 shadow-md hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleAdClick(currentAd.id, currentAd.link)}
            >
              {/* Medicine Image */}
              {currentAd.imageUrl ? (
                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-white">
                  <img
                    src={currentAd.imageUrl}
                    alt={currentAd.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-32 mb-3 rounded-lg bg-gradient-to-br from-teal-100 to-indigo-100 flex items-center justify-center">
                  <div className="text-4xl font-bold text-teal-600">
                    {currentAd.title?.charAt(0) || 'M'}
                  </div>
                </div>
              )}

              {/* Panel Label - New Medicine (only for doctor) */}
              {targetAudience === 'doctor' && (
                <div className="mb-2">
                  <span className="inline-block px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded uppercase">
                    New Medicine
                  </span>
                </div>
              )}
              
              {/* Medicine Name */}
              <h3 className="font-bold text-gray-900 text-base mb-2 leading-tight">
                {currentAd.medicineName || currentAd.title}
              </h3>

              {/* Indications - Conditions */}
              {currentAd.indications && (
                <div className="mb-2">
                  <p className="text-[10px] text-gray-500 font-medium mb-1">Conditions:</p>
                  <div className="flex flex-wrap gap-1">
                    {currentAd.indications.split(',').map((indication, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-0.5 bg-teal-600 text-white text-[10px] font-semibold rounded-full"
                      >
                        {indication.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Category Badge */}
              {currentAd.category && !currentAd.indications && (
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full">
                    {currentAd.category}
                  </span>
                </div>
              )}

              {/* Divider Line */}
              {(currentAd.description || currentAd.indications) && (
                <div className="border-t border-gray-300 my-2"></div>
              )}

              {/* Description - with proper line breaks */}
              {currentAd.description && (
                <div className="mb-3">
                  <p className="text-[10px] text-gray-500 font-medium mb-1">Description:</p>
                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                    {currentAd.description}
                  </p>
                </div>
              )}

              {/* Learn More Link */}
              <div className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-semibold mt-2">
                <span>Learn more</span>
                <FiExternalLink className="text-xs" />
              </div>
            </div>

            {/* Ad Indicator Dots */}
            {ads.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {ads.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-teal-600 w-4' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to ad ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Sponsored Label */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-400">Sponsored</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineAdPanel;

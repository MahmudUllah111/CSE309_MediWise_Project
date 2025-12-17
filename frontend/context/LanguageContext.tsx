'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Language = 'en' | 'bn' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    bn: string;
    hi: string;
  };
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Translations = {
  'dashboard': { en: 'Dashboard', bn: 'ড্যাশবোর্ড', hi: 'डैशबोर्ड' },
  'users': { en: 'Users', bn: 'ব্যবহারকারী', hi: 'उपयोगकर्ता' },
  'doctors': { en: 'Doctors', bn: 'ডাক্তার', hi: 'डॉक्टर' },
  'appointments': { en: 'Appointments', bn: 'অ্যাপয়েন্টমেন্ট', hi: 'अपॉइंटमेंट' },
  'prescriptions': { en: 'Prescriptions', bn: 'প্রেসক্রিপশন', hi: 'नुस्खे' },
  'advertisements': { en: 'Advertisements', bn: 'বিজ্ঞাপন', hi: 'विज्ञापन' },
  'chats': { en: 'Chats', bn: 'চ্যাটস', hi: 'चैट' },
  'welcome_back': { en: 'Welcome back', bn: 'ফিরে আসার জন্য স্বাগতম', hi: 'वापसी पर स्वागत है' },
  'total_users': { en: 'Total Users', bn: 'মোট ব্যবহারকারী', hi: 'कुल उपयोगकर्ता' },
  'total_doctors': { en: 'Total Doctors', bn: 'মোট ডাক্তার', hi: 'कुल डॉक्टर' },
  'total_appointments': { en: 'Appointments', bn: 'অ্যাপয়েন্টমেন্ট', hi: 'अपॉइंटमेंट' },
  'pending_doctors': { en: 'Pending Doctors', bn: 'অপেক্ষমাণ ডাক্তার', hi: 'लंबित डॉक्टर' },
  'recent_appointments': { en: 'Recent Appointments', bn: 'সাম্প্রতিক অ্যাপয়েন্টমেন্ট', hi: 'हाल के अपॉइंटमेंट' },
  'top_doctors': { en: 'Top Doctors', bn: 'শীর্ষ ডাক্তার', hi: 'शीर्ष डॉक्टर' },
  'view_all': { en: 'View All', bn: 'সব দেখুন', hi: 'सभी देखें' },
  'search_placeholder': { en: 'Search for anything here...', bn: 'এখানে যেকোনো কিছু খুঁজুন...', hi: 'यहाँ कुछ भी खोजें...' },
  'profile_settings': { en: 'Profile Settings', bn: 'প্রোফাইল সেটিংস', hi: 'प्रोफ़ाइल सेटिंग' },
  'account_settings': { en: 'Account Settings', bn: 'অ্যাকাউন্ট সেটিংস', hi: 'खाता सेटिंग' },
  'logout': { en: 'Logout', bn: 'লগআউট', hi: 'लॉगआउट' },
  'dark_mode': { en: 'Dark Mode', bn: 'ডার্ক মোড', hi: 'डार्क मोड' },
  'toggle_dark_theme': { en: 'Toggle dark theme', bn: 'ডার্ক থিম টগল করুন', hi: 'डार्क थीम टॉगल करें' },
  'language': { en: 'Language', bn: 'ভাষা', hi: 'भाषा' },
  'choose_language': { en: 'Choose your language', bn: 'আপনার ভাষা নির্বাচন করুন', hi: 'अपनी भाषा चुनें' },
  'notification_sound': { en: 'Notification Sound', bn: 'বিজ্ঞপ্তি শব্দ', hi: 'सूचना ध्वनि' },
  'enable_sound_alerts': { en: 'Enable sound alerts', bn: 'শব্দ সতর্কতা সক্রিয় করুন', hi: 'ध्वनि अलर्ट सक्षम करें' },
  'auto_refresh': { en: 'Auto-refresh', bn: 'স্বয়ংক্রিয় রিফ্রেশ', hi: 'स्वचालित ताज़ा करना' },
  'auto_refresh_desc': { en: 'Auto-refresh data every 30s', bn: 'প্রতি 30 সেকেন্ডে ডেটা স্বয়ংক্রিয় রিফ্রেশ', hi: 'हर 30s में डेटा स्वचालित रूप से ताज़ा करें' },
  'data_preferences': { en: 'Data Preferences', bn: 'ডেটা পছন্দ', hi: 'डेटा प्राथमिकताएं' },
  'save_search_history': { en: 'Save search history', bn: 'অনুসন্ধান ইতিহাস সংরক্ষণ করুন', hi: 'खोज इतिहास सहेजें' },
  'enable_analytics': { en: 'Enable analytics', bn: 'বিশ্লেষণ সক্রিয় করুন', hi: 'एनालिटिक्स सक्षम करें' },
  'calendar': { en: 'Calendar', bn: 'ক্যালেন্ডার', hi: 'कैलेंडर' },
  'today': { en: 'Today', bn: 'আজ', hi: 'आज' },
  'calendar_today': { en: 'Jumped to today', bn: 'আজকের তারিখে যাওয়া হয়েছে', hi: 'आज पर कूद गया' },
  'dashboard_overview': { en: "Here's an overview of your system", bn: 'এখানে আপনার সিস্টেমের একটি ওভারভিউ রয়েছে', hi: 'यहाँ आपके सिस्टम का एक अवलोकन है' },
  'flagged_items': { en: 'Flagged items', bn: 'চিহ্নিত আইটেম', hi: 'चिह्नित आइटम' },
};

// Default context value to prevent errors during SSR
const defaultLanguageContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'bn' || savedLanguage === 'hi')) {
        setLanguageState(savedLanguage);
      } else {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'bn' || browserLang === 'hi') {
          setLanguageState(browserLang as Language);
        }
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    // Update document lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    // Set initial lang attribute
    if (typeof document !== 'undefined' && language) {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[key]?.[language] || translations[key]?.['en'] || key;
  };

  // Always provide context value, even during SSR
  const contextValue = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  // Always return context - it has safe defaults if provider not mounted
  return context;
};

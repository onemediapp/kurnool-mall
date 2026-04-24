'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@kurnool-mall/supabase-client/browser';
import { ArrowRight } from 'lucide-react';
import { useUIMode } from '@/lib/hooks/use-ui-mode';
import ShoppingHomeContent from './_components/shopping-home-content';
import ServicesHomeContent from './_components/services-home-content';

export const revalidate = 60;

export default function HomePage() {
  const supabase = createClient();
  const { mode } = useUIMode();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shop mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const shoppingColors = {
    bg: 'bg-shop-light',
    bgDark: 'bg-shop',
    button: 'bg-shop hover:bg-shop-dark',
  };

  const servicesColors = {
    bg: 'bg-service-light',
    bgDark: 'bg-service',
    button: 'bg-service hover:bg-service-dark',
  };

  const colors = mode === 'shopping' ? shoppingColors : servicesColors;

  return (
    <div className="min-h-screen bg-white">
      {/* Content Area */}
      <div className={`${colors.bg} min-h-screen transition-colors duration-300`}>
        {mode === 'shopping' ? (
          <ShoppingHomeContent />
        ) : (
          <ServicesHomeContent />
        )}
      </div>

      {/* Footer Call-to-Action */}
      <div className={`${colors.bgDark} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {mode === 'shopping'
              ? 'Discover Amazing Deals'
              : 'Find Expert Services'}
          </h2>
          <p className="mb-6 text-opacity-90">
            {mode === 'shopping'
              ? 'Browse our extensive collection of products from local vendors'
              : 'Connect with verified service providers near you'}
          </p>
          <button
            className={`inline-flex items-center gap-2 ${colors.button} text-white px-8 py-3 rounded-lg font-semibold transition-all`}
          >
            Explore {mode === 'shopping' ? 'Products' : 'Services'}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

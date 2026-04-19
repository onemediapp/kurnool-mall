'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShoppingBag, Wrench, ArrowRight } from 'lucide-react';
import ShoppingHomeContent from './_components/shopping-home-content';
import ServicesHomeContent from './_components/services-home-content';

type Section = 'shopping' | 'services';

export const revalidate = 60;

export default function HomePage() {
  const supabase = createClient();
  const [activeSection, setActiveSection] = useState<Section>('shopping');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const shoppingColors = {
    bg: 'bg-blue-50',
    bgDark: 'bg-blue-600',
    border: 'border-blue-200',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
    accent: 'bg-blue-100',
    accentText: 'text-blue-800',
    button: 'bg-blue-600 hover:bg-blue-700',
    badge: 'bg-blue-100 text-blue-800',
  };

  const servicesColors = {
    bg: 'bg-orange-50',
    bgDark: 'bg-orange-600',
    border: 'border-orange-200',
    text: 'text-orange-600',
    textDark: 'text-orange-700',
    accent: 'bg-orange-100',
    accentText: 'text-orange-800',
    button: 'bg-orange-600 hover:bg-orange-700',
    badge: 'bg-orange-100 text-orange-800',
  };

  const colors = activeSection === 'shopping' ? shoppingColors : servicesColors;

  return (
    <div className="min-h-screen bg-white">
      {/* Section Tabs Header */}
      <div className={`${colors.bg} border-b ${colors.border} sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Welcome Message */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeSection === 'shopping' ? '🛍️ Shopping' : '🔧 Services'}
            </h1>
            {user && (
              <p className={`${colors.text} text-sm mt-1`}>
                Welcome back, {user.user_metadata?.name || user.email}!
              </p>
            )}
          </div>

          {/* Section Toggle Tabs */}
          <div className="flex gap-2">
            {/* Shopping Tab */}
            <button
              onClick={() => setActiveSection('shopping')}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition-all ${
                activeSection === 'shopping'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-blue-200 hover:bg-blue-50'
              }`}
            >
              <ShoppingBag size={20} />
              <span>Shopping</span>
            </button>

            {/* Services Tab */}
            <button
              onClick={() => setActiveSection('services')}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition-all ${
                activeSection === 'services'
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-orange-200 hover:bg-orange-50'
              }`}
            >
              <Wrench size={20} />
              <span>Services</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={`${colors.bg} min-h-screen transition-colors duration-300`}>
        {activeSection === 'shopping' ? (
          <ShoppingHomeContent />
        ) : (
          <ServicesHomeContent />
        )}
      </div>

      {/* Footer Call-to-Action */}
      <div className={`${colors.bgDark} text-white py-12`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">
            {activeSection === 'shopping'
              ? 'Discover Amazing Deals'
              : 'Find Expert Services'}
          </h2>
          <p className="mb-6 text-opacity-90">
            {activeSection === 'shopping'
              ? 'Browse our extensive collection of products from local vendors'
              : 'Connect with verified service providers near you'}
          </p>
          <button
            className={`inline-flex items-center gap-2 ${colors.button} text-white px-8 py-3 rounded-lg font-semibold transition-all`}
          >
            Explore {activeSection === 'shopping' ? 'Products' : 'Services'}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

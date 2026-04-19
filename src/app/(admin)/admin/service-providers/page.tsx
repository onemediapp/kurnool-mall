'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Edit2, Trash2, Search, Star } from 'lucide-react';

interface ServiceProvider {
  id: string;
  name: string;
  category_id: string;
  service_type: string;
  phone: string | null;
  rating: number;
  total_reviews: number;
  verified: boolean;
  is_active: boolean;
}

interface Category {
  id: string;
  name_en: string;
}

export default function ServiceProvidersAdmin() {
  const supabase = createClient();

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);

      // Fetch providers
      const { data: providersData } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });
      setProviders(providersData || []);

      // Fetch categories
      const { data: categoriesData } = await supabase.from('categories').select('id, name_en');
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_providers')
        .update({ verified: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('service_providers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Delete this provider?')) return;

    try {
      const { error } = await supabase.from('service_providers').delete().eq('id', id);

      if (error) throw error;
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name_en || 'Unknown';
  };

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.service_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterVerified === 'all' ||
      (filterVerified === 'verified' && provider.verified) ||
      (filterVerified === 'unverified' && !provider.verified);

    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Service Providers</h1>
        <p className="text-gray-600 mt-2">Manage and verify service providers</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm">Total Providers</p>
          <p className="text-2xl font-bold">{providers.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm">Verified</p>
          <p className="text-2xl font-bold text-green-600">{providers.filter((p) => p.verified).length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm">Unverified</p>
          <p className="text-2xl font-bold text-orange-600">{providers.filter((p) => !p.verified).length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm">Active</p>
          <p className="text-2xl font-bold text-blue-600">{providers.filter((p) => p.is_active).length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Providers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4">Provider Name</th>
              <th className="text-left p-4">Service Type</th>
              <th className="text-left p-4">Category</th>
              <th className="text-center p-4">Rating</th>
              <th className="text-center p-4">Verified</th>
              <th className="text-center p-4">Active</th>
              <th className="text-center p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.map((provider) => (
              <tr key={provider.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{provider.name}</td>
                <td className="p-4 text-sm">{provider.service_type}</td>
                <td className="p-4 text-sm">{getCategoryName(provider.category_id)}</td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{provider.rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-600">({provider.total_reviews})</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => toggleVerification(provider.id, provider.verified)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      provider.verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {provider.verified ? (
                      <>
                        <CheckCircle size={16} /> Verified
                      </>
                    ) : (
                      <>
                        <XCircle size={16} /> Unverified
                      </>
                    )}
                  </button>
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => toggleActive(provider.id, provider.is_active)}
                    className={`px-3 py-1 rounded text-sm ${
                      provider.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {provider.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-2 hover:bg-blue-100 rounded">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteProvider(provider.id)}
                      className="p-2 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProviders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No providers found matching your criteria
        </div>
      )}
    </div>
  );
}

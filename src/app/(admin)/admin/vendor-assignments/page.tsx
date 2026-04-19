'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus, Trash2, Search } from 'lucide-react';

interface Vendor {
  id: string;
  user_id: string;
  shop_name: string;
  category_ids: string[];
}

interface Category {
  id: string;
  name_en: string;
  name_te: string;
}

interface Assignment {
  id: string;
  vendor_id: string;
  category_id: string;
  subcategory_id: string | null;
}

export default function VendorAssignments() {
  const supabase = createClientComponentClient();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);

      // Fetch vendors
      const { data: vendorsData } = await supabase.from('vendors').select('*');
      setVendors(vendorsData || []);

      // Fetch categories
      const { data: categoriesData } = await supabase.from('categories').select('*');
      setCategories(categoriesData || []);

      // Fetch assignments
      const { data: assignmentsData } = await supabase
        .from('category_vendor_assignments')
        .select('*');
      setAssignments(assignmentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  const addAssignment = async () => {
    if (!selectedVendor || !selectedCategory) return;

    try {
      const { error } = await supabase
        .from('category_vendor_assignments')
        .insert({
          vendor_id: selectedVendor,
          category_id: selectedCategory,
        });

      if (error) throw error;

      setSelectedCategory(null);
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add assignment');
    }
  };

  const removeAssignment = async (id: string) => {
    if (!confirm('Remove this assignment?')) return;

    try {
      const { error } = await supabase
        .from('category_vendor_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove assignment');
    }
  };

  const filteredVendors = vendors.filter((vendor) =>
    vendor.shop_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVendorAssignments = (vendorId: string) => {
    return assignments.filter((a) => a.vendor_id === vendorId);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name_en || 'Unknown';
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Vendor Assignments</h1>
        <p className="text-gray-600 mt-2">Assign categories to vendors</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add Assignment Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Add New Assignment</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedVendor || ''}
              onChange={(e) => setSelectedVendor(e.target.value || null)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="">Select Vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.shop_name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-2 border rounded-lg"
              disabled={!selectedVendor}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_en}
                </option>
              ))}
            </select>

            <button
              onClick={addAssignment}
              disabled={!selectedVendor || !selectedCategory}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              <Plus size={20} /> Assign
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* Vendors List */}
      <div className="space-y-4">
        {filteredVendors.map((vendor) => {
          const vendorAssignments = getVendorAssignments(vendor.id);
          return (
            <div key={vendor.id} className="border rounded-lg p-4">
              <h3 className="font-bold text-lg mb-3">{vendor.shop_name}</h3>
              {vendorAssignments.length === 0 ? (
                <p className="text-gray-500 text-sm">No category assignments yet</p>
              ) : (
                <div className="space-y-2">
                  {vendorAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded"
                    >
                      <span className="font-medium">{getCategoryName(assignment.category_id)}</span>
                      <button
                        onClick={() => removeAssignment(assignment.id)}
                        className="p-2 hover:bg-red-100 rounded"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

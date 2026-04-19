'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

interface Section {
  id: string;
  name_en: string;
  name_te: string;
  type: 'shopping' | 'services';
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

interface Category {
  id: string;
  name_en: string;
  name_te: string;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
  section_id?: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name_en: string;
  name_te: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function CategoryManager() {
  const supabase = createClient();

  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'shopping' | 'services'>('all');

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'section' | 'category' | 'subcategory'>('section');

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);

      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('sort_order');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch subcategories
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .order('sort_order');

      if (subcategoriesError) throw subcategoriesError;
      setSubcategories(subcategoriesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleItemStatus = async (type: 'section' | 'category' | 'subcategory', id: string, currentStatus: boolean) => {
    try {
      const tableName =
        type === 'section' ? 'sections' :
        type === 'category' ? 'categories' :
        'subcategories';

      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Refresh data
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const deleteItem = async (type: 'section' | 'category' | 'subcategory', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const tableName =
        type === 'section' ? 'sections' :
        type === 'category' ? 'categories' :
        'subcategories';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const filteredSections = sections.filter(section => {
    const matchesSearch = section.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         section.name_te.includes(searchTerm);
    const matchesFilter = filterType === 'all' || section.type === filterType;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Category Manager</h1>
        <button
          onClick={() => {
            setModalType('section');
            setEditingItem(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} /> Add Section
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Types</option>
            <option value="shopping">Shopping</option>
            <option value="services">Services</option>
          </select>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <div key={section.id} className="border rounded-lg overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100"
              onClick={() => toggleSection(section.id)}>
              <div className="flex items-center gap-4 flex-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSection(section.id);
                  }}
                  className="p-1"
                >
                  {expandedSections.has(section.id) ? <ChevronUp /> : <ChevronDown />}
                </button>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{section.name_en}</h3>
                  <p className="text-sm text-gray-600">{section.name_te}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {section.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItemStatus('section', section.id, section.is_active);
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    section.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {section.is_active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingItem(section);
                    setModalType('section');
                    setShowAddModal(true);
                  }}
                  className="p-2 hover:bg-blue-100 rounded"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteItem('section', section.id);
                  }}
                  className="p-2 hover:bg-red-100 rounded"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>

            {/* Categories */}
            {expandedSections.has(section.id) && (
              <div className="bg-white border-t">
                <div className="p-4 space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="border-l-4 border-blue-200 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{category.name_en}</h4>
                          <p className="text-sm text-gray-600">{category.name_te}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleItemStatus('category', category.id, category.is_active)}
                            className={`px-2 py-1 rounded text-xs ${
                              category.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {category.is_active ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(category);
                              setModalType('category');
                              setShowAddModal(true);
                            }}
                            className="p-1 hover:bg-blue-100 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteItem('category', category.id)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditingItem({ category_id: section.id });
                      setModalType('subcategory');
                      setShowAddModal(true);
                    }}
                    className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Plus size={18} /> Add Subcategory
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal would go here */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">
              {editingItem ? 'Edit' : 'Add'} {modalType}
            </h2>
            <p className="text-gray-600">Modal form would be implemented here</p>
            <button
              onClick={() => setShowAddModal(false)}
              className="mt-4 w-full bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

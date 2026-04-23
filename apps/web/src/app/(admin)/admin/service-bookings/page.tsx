'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@kurnool-mall/supabase-client/browser';
import { Eye, Trash2, Search, Filter, Calendar } from 'lucide-react';

interface ServiceBooking {
  id: string;
  customer_id: string;
  provider_id: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  notes: string | null;
  rating: number | null;
  created_at: string;
}

interface ServiceProvider {
  id: string;
  name: string;
}

export default function ServiceBookingsAdmin() {
  const supabase = createClient();

  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [providers, setProviders] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<ServiceBooking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      setLoading(true);

      // Fetch bookings
      const { data: bookingsData } = await supabase
        .from('service_bookings')
        .select('*')
        .order('booking_date', { ascending: false });
      setBookings(bookingsData || []);

      // Fetch providers for mapping
      const { data: providersData } = await supabase.from('service_providers').select('id, name');
      const providerMap: Record<string, string> = {};
      (providersData || []).forEach((p) => {
        providerMap[p.id] = p.name;
      });
      setProviders(providerMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (bookingId: string, newStatus: ServiceBooking['status']) => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      fetchAllData();
      setShowDetails(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Delete this booking?')) return;

    try {
      const { error } = await supabase.from('service_bookings').delete().eq('id', id);

      if (error) throw error;
      fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const getStatusColor = (status: ServiceBooking['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || booking.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const statusStats = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold">Service Bookings</h1>
        <p className="text-gray-600 mt-2">Manage all service bookings</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm">Total</p>
          <p className="text-2xl font-bold">{bookings.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{statusStats.pending}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Confirmed</p>
          <p className="text-2xl font-bold text-blue-600">{statusStats.confirmed}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-600">{statusStats.completed}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{statusStats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4">Service Type</th>
              <th className="text-left p-4">Provider</th>
              <th className="text-left p-4">Date & Time</th>
              <th className="text-center p-4">Price</th>
              <th className="text-center p-4">Status</th>
              <th className="text-center p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking.id} className="border-b hover:bg-gray-50">
                <td className="p-4 font-medium">{booking.service_type}</td>
                <td className="p-4 text-sm">{providers[booking.provider_id] || 'Unknown'}</td>
                <td className="p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {booking.booking_date} {booking.booking_time}
                  </div>
                </td>
                <td className="p-4 text-center font-semibold">₹{booking.price}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetails(true);
                      }}
                      className="p-2 hover:bg-blue-100 rounded"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => deleteBooking(booking.id)}
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

      {filteredBookings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No bookings found matching your criteria
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <h2 className="text-2xl font-bold">Booking Details</h2>
            <div className="space-y-2">
              <p>
                <span className="font-bold">Service:</span> {selectedBooking.service_type}
              </p>
              <p>
                <span className="font-bold">Provider:</span> {providers[selectedBooking.provider_id] || 'Unknown'}
              </p>
              <p>
                <span className="font-bold">Date:</span> {selectedBooking.booking_date} {selectedBooking.booking_time}
              </p>
              <p>
                <span className="font-bold">Price:</span> ₹{selectedBooking.price}
              </p>
              <p>
                <span className="font-bold">Status:</span>{' '}
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </p>
              {selectedBooking.notes && (
                <p>
                  <span className="font-bold">Notes:</span> {selectedBooking.notes}
                </p>
              )}
              {selectedBooking.rating && (
                <p>
                  <span className="font-bold">Rating:</span> {selectedBooking.rating}/5
                </p>
              )}
            </div>

            {selectedBooking.status !== 'completed' && selectedBooking.status !== 'cancelled' && (
              <div className="space-y-2">
                <p className="font-bold text-sm">Update Status:</p>
                <div className="flex gap-2">
                  {selectedBooking.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'confirmed')}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                    >
                      Confirm
                    </button>
                  )}
                  <>
                    {selectedBooking.status === 'confirmed' && (
                      <button
                        onClick={() => updateStatus(selectedBooking.id, 'completed')}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'cancelled')}
                      className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowDetails(false)}
              className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

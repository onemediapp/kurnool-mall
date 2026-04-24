import { useEffect, useMemo, useState } from 'react'
import { FlatList, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Search as SearchIcon } from 'lucide-react-native'
import type { Product } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/ProductCard'
import { EmptyState } from '@/components/EmptyState'
import { Spinner } from '@/components/Spinner'

export default function SearchTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<Product & { vendor_id: string }>>([])
  const [loading, setLoading] = useState(false)

  const debouncedQuery = useDebounced(query, 350)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    setLoading(true)
    supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .eq('is_deleted', false)
      .or(`name_en.ilike.%${debouncedQuery}%,name_te.ilike.%${debouncedQuery}%`)
      .limit(40)
      .then(({ data }) => {
        if (cancelled) return
        setResults((data as Array<Product & { vendor_id: string }> | null) ?? [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-11">
          <SearchIcon size={18} color="#6B7280" />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search products"
            className="flex-1 ml-2 text-base text-gray-900"
          />
        </View>
      </View>
      {loading ? (
        <Spinner />
      ) : !query.trim() ? (
        <EmptyState Icon={SearchIcon} title="Search for products" description="Type to find groceries, electronics, and more." />
      ) : results.length === 0 ? (
        <EmptyState Icon={SearchIcon} title={`No products found for "${query}"`} description="Try a different search." />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          renderItem={({ item }) => (
            <View className="w-1/2 p-1">
              <ProductCard product={item} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return v
}

import { useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import type { Category, Product } from '@kurnool-mall/shared-types'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/ProductCard'
import { Spinner } from '@/components/Spinner'
import { EmptyState } from '@/components/EmptyState'
import { Package } from 'lucide-react-native'

export default function CategoryPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Array<Product & { vendor_id: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    async function load() {
      const { data: cat } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()
      setCategory((cat as Category | null) ?? null)
      if (cat) {
        const { data: prods } = await supabase
          .from('products')
          .select('*')
          .eq('category_id', (cat as Category).id)
          .eq('is_available', true)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
        setProducts((prods as Array<Product & { vendor_id: string }> | null) ?? [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) return <Spinner />

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="bg-white px-4 py-3 border-b border-gray-100 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={22} color="#111827" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">{category?.name_en ?? 'Category'}</Text>
      </View>
      {products.length === 0 ? (
        <EmptyState Icon={Package} title="No products yet" description="Check back soon." />
      ) : (
        <FlatList
          data={products}
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

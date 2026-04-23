import { cn } from '@/lib/utils'

function Block({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-card">
      <Block className="aspect-square w-full rounded-none" />
      <div className="p-2.5 space-y-1.5">
        <Block className="h-3 w-12" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Block className="h-4 w-14" />
          <Block className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryChipSkeleton() {
  return (
    <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
      <Block className="h-14 w-14 rounded-full" />
      <Block className="h-3 w-12" />
    </div>
  )
}

export function CategoryRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryChipSkeleton key={i} />
      ))}
    </div>
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Block className="h-4 w-24" />
        <Block className="h-5 w-16 rounded-full" />
      </div>
      <Block className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Block className="h-4 w-20" />
        <Block className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  )
}

export function BannerSkeleton() {
  return <Block className="h-32 w-full rounded-2xl" />
}

export function BannerCarouselSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="px-4 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <BannerSkeleton key={i} />
      ))}
    </div>
  )
}

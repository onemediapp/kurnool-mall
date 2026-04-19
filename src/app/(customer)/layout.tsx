import { BottomNav } from '@/components/customer/bottom-nav'
import { FloatingCartPill } from '@/components/shared'
import { Toaster } from '@/components/shared/toast'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-frame relative">
      <main className="pb-20">{children}</main>
      <FloatingCartPill />
      <BottomNav />
      <Toaster />
    </div>
  )
}

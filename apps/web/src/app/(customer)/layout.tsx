import { ModeToggleHeader } from '@/components/shared/mode-toggle-header'
import { ContextAwareBottomNav } from '@/components/customer/bottom-nav-dual'
import { FloatingCartPill } from '@/components/shared'
import { Toaster } from '@/components/shared/toast'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-frame relative">
      <ModeToggleHeader />
      <main className="pb-20">{children}</main>
      <FloatingCartPill />
      <ContextAwareBottomNav />
      <Toaster />
    </div>
  )
}

'use client'

import { Bell, MessageCircle, Mail, Monitor, Image as ImageIcon } from 'lucide-react'
import type { CampaignType, CampaignContent } from '@kurnool-mall/shared-types'

interface CampaignPreviewProps {
  type: CampaignType
  content: CampaignContent
  lang?: 'en' | 'te'
}

export function CampaignPreview({ type, content, lang = 'en' }: CampaignPreviewProps) {
  const title = lang === 'te' ? content.title_te : content.title_en
  const body = lang === 'te' ? content.body_te : content.body_en
  const cta = lang === 'te' ? content.cta_label_te : content.cta_label_en

  if (type === 'push') {
    return (
      <div className="p-4 bg-gray-100 rounded-2xl max-w-sm mx-auto">
        <div className="bg-white rounded-xl p-3 shadow-sm flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#1A56DB] flex items-center justify-center flex-shrink-0">
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-gray-700">KURNOOL MALL</p>
              <span className="text-[10px] text-gray-400">now</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{title || 'Title'}</p>
            <p className="text-xs text-gray-600 line-clamp-2">{body || 'Message body'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'whatsapp') {
    return (
      <div className="p-4 bg-[#E5DDD5] rounded-2xl max-w-sm mx-auto">
        <div className="flex items-start gap-2">
          <MessageCircle className="h-5 w-5 text-green-700 flex-shrink-0 mt-1" />
          <div className="bg-white rounded-xl p-3 shadow-sm flex-1">
            <p className="text-sm font-semibold text-gray-900">{title || 'Title'}</p>
            <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{body || 'Message body'}</p>
            {cta && (
              <button className="mt-2 w-full text-sm text-green-700 font-medium border-t border-gray-100 pt-2">
                {cta}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'email') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <p className="text-xs text-gray-500">no-reply@kurnoolmall.com</p>
        </div>
        {content.image_url && (
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={content.image_url} alt="" className="max-h-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900">{title || 'Title'}</h3>
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">{body || 'Message body'}</p>
          {cta && (
            <button className="mt-4 bg-[#1A56DB] text-white text-sm font-medium px-4 py-2 rounded-lg">
              {cta}
            </button>
          )}
        </div>
      </div>
    )
  }

  // banners
  return (
    <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-sm">
      <div className="relative bg-gradient-to-br from-[#1A56DB] to-[#8B5CF6] p-5 text-white min-h-[140px] flex flex-col justify-center">
        <div className="flex items-start gap-3">
          <Monitor className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold leading-tight">{title || 'Banner title'}</h3>
            <p className="text-xs text-white/90 mt-1 line-clamp-2">{body || 'Banner message'}</p>
            {cta && (
              <button className="mt-2 bg-white text-[#1A56DB] text-xs font-semibold px-3 py-1.5 rounded-lg">
                {cta}
              </button>
            )}
          </div>
        </div>
        {!content.image_url && (
          <ImageIcon className="absolute right-4 bottom-4 h-8 w-8 text-white/20" />
        )}
      </div>
    </div>
  )
}

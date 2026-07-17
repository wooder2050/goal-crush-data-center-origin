'use client';

import { Link2, Share2, Twitter } from 'lucide-react';
import { useCallback, useState } from 'react';

import { trackShare } from '@/lib/analytics';

interface ShareButtonsProps {
  url?: string;
  title: string;
  description?: string;
  /** GA share 이벤트의 content_type (예: 'match') */
  contentType?: string;
  /** GA share 이벤트의 item_id (예: match_id) */
  itemId?: string;
}

export function ShareButtons({
  url,
  title,
  description,
  contentType = 'page',
  itemId,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopyLink = useCallback(async () => {
    let succeeded = true;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      succeeded = document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    if (!succeeded) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    trackShare({ method: 'copy_link', contentType, itemId });
  }, [shareUrl, contentType, itemId]);

  const handleTwitterShare = useCallback(() => {
    const text = `${title}${description ? `\n${description}` : ''}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    const popup = window.open(twitterUrl, '_blank', 'width=550,height=420');
    if (popup) {
      trackShare({ method: 'twitter', contentType, itemId });
    }
  }, [title, description, shareUrl, contentType, itemId]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
        trackShare({ method: 'native', contentType, itemId });
      } catch {
        // 사용자가 공유 취소한 경우 무시
      }
    } else {
      // Web Share API 미지원 시 링크 복사 폴백
      await handleCopyLink();
    }
  }, [title, description, shareUrl, handleCopyLink, contentType, itemId]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTwitterShare}
        className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
        aria-label="트위터에 공유"
      >
        <Twitter className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">트위터</span>
      </button>
      <button
        onClick={handleNativeShare}
        className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
        aria-label="공유하기"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">공유</span>
      </button>
      <button
        onClick={handleCopyLink}
        className="flex min-h-[44px] items-center gap-1.5 rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
        aria-label="링크 복사"
      >
        <Link2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">
          {copied ? '복사됨!' : '링크 복사'}
        </span>
      </button>
    </div>
  );
}

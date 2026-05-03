'use client';

import { Link2, Share2, Twitter } from 'lucide-react';
import { useCallback, useState } from 'react';

interface ShareButtonsProps {
  url?: string;
  title: string;
  description?: string;
}

export function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    url || (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleTwitterShare = useCallback(() => {
    const text = `${title}${description ? `\n${description}` : ''}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  }, [title, description, shareUrl]);

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: shareUrl,
        });
      } catch {
        // 사용자가 공유 취소한 경우 무시
      }
    } else {
      // Web Share API 미지원 시 링크 복사 폴백
      await handleCopyLink();
    }
  }, [title, description, shareUrl, handleCopyLink]);

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

'use client';

import { Link2, MessageCircle, Twitter } from 'lucide-react';
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
      // fallback
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

  const handleKakaoShare = useCallback(() => {
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(shareUrl)}`;
    window.open(kakaoUrl, '_blank', 'width=550,height=420');
  }, [shareUrl]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTwitterShare}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
        aria-label="트위터에 공유"
      >
        <Twitter className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">트위터</span>
      </button>
      <button
        onClick={handleKakaoShare}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
        aria-label="카카오스토리에 공유"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">카카오</span>
      </button>
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
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

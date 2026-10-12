export type ChannelVideoItem = {
  video_id: number;
  youtube_id: string;
  youtube_url: string;
  title: string;
  video_type: string;
  match_id: number | null;
  published_at: string;
};

export const VIDEO_TYPE_LABEL: Record<string, string> = {
  preview: '프리뷰',
  recap: '리뷰',
  stats: '기록',
  etc: '쇼츠',
};

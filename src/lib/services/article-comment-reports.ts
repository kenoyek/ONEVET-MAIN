import { supabase } from '@/integrations/supabase/client';

export const reportReasons = {
  spam: 'Spam',
  abuse: 'Harassment or abuse',
  privacy: 'Personal information',
  other: 'Other',
};

export type ReportReason = keyof typeof reportReasons;
export type ReportedComment = {
  comment_id: string;
  article_id: string;
  author_name: string;
  body: string;
  article_title: string;
  report_count: number;
  reasons: ReportReason[];
};

export async function reportComment(id: string, reason: ReportReason) {
  const { error } = await supabase.rpc('report_article_comment', {
    target_comment: id,
    report_reason: reason,
  });
  if (error) throw error;
}

export async function listReportedComments() {
  const { data, error } = await supabase.rpc('list_article_comment_reports');
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Comment reports unavailable');
  return data as unknown as ReportedComment[];
}

export const MAX_DECISION_NOTE_LENGTH = 500;

export async function resolveCommentReports(id: string, remove: boolean, note: string | null) {
  const { error } = await supabase.rpc('resolve_article_comment_reports', {
    target_comment: id,
    remove_comment: remove,
    decision_note: note,
  });
  if (error) throw error;
}

export type CommentReview = {
  id: number;
  article_title: string;
  moderator_name: string;
  action: 'dismissed' | 'removed';
  report_count: number;
  reviewed_at: string;
  note?: string | null;
};

const reviewPageSize = 50;

export async function listCommentReviews(before?: number) {
  const { data, error } = await supabase.rpc(
    'list_article_comment_review_history',
    before === undefined ? {} : { before_id: before },
  );
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error('Comment review history unavailable');

  const reviews = data as unknown as CommentReview[];
  return { reviews: reviews.slice(0, reviewPageSize), hasOlder: reviews.length > reviewPageSize };
}

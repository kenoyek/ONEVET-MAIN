import {supabase} from '@/integrations/supabase/client';
export type ArticleComment={id:string;ordinal:number;author_name:string;body:string;created_at:string;mine:boolean};
export type ArticleEngagement={likes:number;liked:boolean;comment_count:number;has_older:boolean;comments:ArticleComment[]};
export const articleEngagementService={
 async get(id:string,before?:number){const{data,error}=await supabase.rpc('get_article_engagement',{article_uuid:id,...(before===undefined?{}:{before_ordinal:before})});if(error)throw error;if(!data)throw Error('Engagement unavailable');return data as unknown as ArticleEngagement;},
 async like(id:string,liked:boolean){const{error}=await supabase.rpc('set_article_like',{article_uuid:id,liked});if(error)throw error;},
 async comment(id:string,body:string,nonce:string){const{data,error}=await supabase.rpc('add_article_comment',{article_uuid:id,comment_id:nonce,comment_body:body.trim()});if(error)throw error;if(!data)throw Error('Comment result unavailable');},
 async remove(id:string,comment:string){const{error}=await supabase.rpc('remove_article_comment',{article_uuid:id,comment_id:comment});if(error)throw error;},
};

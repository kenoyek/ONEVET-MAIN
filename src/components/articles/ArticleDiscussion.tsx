import {useEffect,useRef,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {useQuery,useQueryClient} from '@tanstack/react-query';
import {Heart,MessageCircle} from 'lucide-react';
import {useAuth} from '@/lib/auth-context';
import {articleEngagementService as service} from '@/lib/services/article-engagement-service';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
export function ArticleDiscussion({articleId, moderation = false}:{articleId:string; moderation?:boolean}){
 const {user,role} = useAuth();
 if (moderation && (!user || role !== 'admin')) return null;
 return <Discussion key={`${articleId}:${user?.id??'guest'}`} articleId={articleId} moderation={moderation}/>;
}
function Discussion({articleId,moderation}:{articleId:string; moderation:boolean}){
 const{user,role}=useAuth();const location=useLocation();const[draft,setDraft]=useState('');const[cursors,setCursors]=useState<number[]>([]);const[busy,setBusy]=useState(false);const[error,setError]=useState('');const[feedback,setFeedback]=useState('');const[removing,setRemoving]=useState<string|null>(null);const lock=useRef(false);const retry=useRef({body:'',id:''});
 const queryClient = useQueryClient();
 const query=useQuery({queryKey:['article-engagement',articleId,user?.id,cursors.at(-1)],queryFn:()=>service.get(articleId,cursors.at(-1))});
 useEffect(()=>{if(!moderation&&location.hash==='#article-discussion'){const section=document.getElementById('article-discussion');section?.scrollIntoView?.({block:'start'});section?.focus({preventScroll:true});}},[location.hash,moderation]);
 async function perform(action:()=>Promise<void>,success:string){
  if(lock.current||!user)return;lock.current=true;setBusy(true);setError('');setFeedback('');
  try{await action();setFeedback(success);try{const result=await query.refetch();if(result.isError)setFeedback(`${success} Refresh the discussion to update the counts.`);}catch{setFeedback(`${success} Refresh the discussion to update the counts.`);}}
  catch(cause){const code=typeof cause==='object'&&cause&&'code'in cause?cause.code:'';setError(code==='23514'?'Please wait a minute before posting another comment.':code==='42501'?'Please sign in with an active account and try again.':moderation?'Could not confirm removal. Refresh the discussion and try again.':'Could not confirm your update. Your comment draft is retained. Retry the same action safely.');}
  finally{lock.current=false;setBusy(false);}
 }
 function removeComment(commentId: string) {
  return perform(async () => {
   await service.remove(articleId, commentId);
   setRemoving(null);
   await queryClient.invalidateQueries({
    queryKey: ['article-engagement', articleId],
    refetchType: 'none',
   });
  }, 'Comment removed.');
 }
 return <section id={moderation ? undefined : "article-discussion"} tabIndex={-1} aria-label={moderation ? "Comment moderation" : undefined} aria-labelledby={moderation ? undefined : "article-discussion-title"} className={moderation ? "space-y-4" : "my-12 rounded-3xl border bg-card p-5 sm:p-8 scroll-mt-28 space-y-6"}>
  {!moderation && <div><p className="eyebrow mb-2">The 1Vet community</p><h2 id="article-discussion-title" className="text-2xl sm:text-3xl">Join the conversation</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Share what you found helpful or ask a general question. Comments and your profile name are public. Keep personal contact details private. For urgent animal health concerns, contact a vet.</p></div>}
  {query.isPending?<p role="status">Loading likes and comments…</p>:query.isError?<div><p role="alert">Likes and comments are temporarily unavailable.</p><Button variant="outline" disabled={query.isFetching} onClick={()=>void query.refetch()}>Retry discussion</Button></div>:query.data&&<>
   <div className="flex flex-wrap items-center gap-4 border-y py-4">
    {!moderation && <Button variant={query.data.liked?'default':'outline'} aria-pressed={query.data.liked} disabled={!user||busy||query.isFetching} onClick={()=>void perform(()=>service.like(articleId,!query.data!.liked),query.data!.liked?'Like removed.':'Thanks for liking this article.')}><Heart aria-hidden="true" className={`mr-2 h-4 w-4 ${query.data.liked?'fill-current':''}`}/>{query.data.likes} {query.data.likes===1?'like':'likes'}</Button>}
    <p className="flex items-center gap-2 text-sm text-muted-foreground"><MessageCircle aria-hidden="true" className="h-4 w-4"/>{query.data.comment_count} {query.data.comment_count===1?'comment':'comments'}</p>
    <Button variant="ghost" disabled={busy||query.isFetching} onClick={()=>void query.refetch()}>Refresh discussion</Button>
   </div>
   {!moderation && (!user?<p className="text-sm"><Link className="text-primary underline font-medium" to="/auth" state={{from:{pathname:location.pathname,search:location.search,hash:'#article-discussion'}}}>Sign in to like or leave a comment</Link>. New here? You can create an account on the sign-in page.</p>:<form className="space-y-3" onSubmit={event=>{event.preventDefault();const body=draft.trim();if(!body||body.length>1000)return;void perform(async()=>{if(retry.current.body!==body)retry.current={body,id:crypto.randomUUID()};await service.comment(articleId,body,retry.current.id);setDraft('');retry.current={body:'',id:''};setCursors([]);},'Your comment has been posted.');}}>
    <Label htmlFor="article-comment">Your comment</Label><Textarea id="article-comment" value={draft} onChange={event=>setDraft(event.target.value)} disabled={busy} required maxLength={1000} rows={4} placeholder="What would you like to share?"/>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{draft.length}/1,000 characters · Please be kind and stay on topic.</p><Button disabled={busy||!draft.trim()} type="submit">{busy?'Saving…':'Post comment'}</Button></div>
   </form>)}
   <div className="space-y-4"><h3 className="text-lg font-semibold">Reader comments</h3>{cursors.length>0&&<Button variant="outline" disabled={busy} onClick={()=>setCursors(previous=>previous.slice(0,-1))}>View newer comments</Button>}
    {query.data.comments.length===0?<p className="text-sm text-muted-foreground">{moderation ? 'No comments on this page.' : 'No comments on this page yet. Be the first to start the conversation.'}</p>:<ol className="space-y-4" aria-label="Article comments">{query.data.comments.map(comment=><li key={comment.id} className="rounded-2xl border p-4 sm:p-5"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold break-words">{comment.author_name}{comment.mine?' · You':''}</p><time dateTime={comment.created_at} className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</time></div><p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{comment.body}</p>{user&&(comment.mine||role==='admin')&&<div className="mt-3">{removing===comment.id?<div className="flex flex-wrap items-center gap-2"><span className="text-sm">Remove this public comment?</span><Button variant="destructive" size="sm" disabled={busy} onClick={() => void removeComment(comment.id)}>Confirm removal</Button><Button variant="ghost" size="sm" disabled={busy} onClick={()=>setRemoving(null)}>Keep comment</Button></div>:<Button variant="ghost" size="sm" disabled={busy} onClick={()=>setRemoving(comment.id)}>Remove comment</Button>}</div>}</li>)}</ol>}
    {query.data.has_older&&<Button variant="outline" disabled={busy||query.isFetching} onClick={()=>{const cursor=query.data?.comments.at(-1)?.ordinal;if(cursor!==undefined)setCursors(previous=>previous.at(-1)===cursor?previous:[...previous,cursor]);}}>View older comments</Button>}
   </div>
  </>}
  {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{feedback&&<p role="status" className="text-sm text-primary">{feedback}</p>}
 </section>;
}

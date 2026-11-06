import { useEffect, useId, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { inboxService, type InboxNotification } from '@/lib/services/inbox-service';
export type Notification = InboxNotification;
export function useNotificationInbox(page=0, unreadOnly=false, pageSize=20) {
  const {user}=useAuth();const userId=user?.id;const cache=useQueryClient();const instance=useId();
  const account=useRef(userId);account.current=userId;
  const action=useRef<string|null>(null);
  const [mutation,setMutation]=useState<{userId:string;busy:boolean;error:string}|null>(null);
  const list=useQuery({queryKey:['notifications',userId,'list',pageSize,page,unreadOnly],enabled:!!userId,staleTime:0,refetchInterval:30_000,queryFn:()=>inboxService.list(userId!,page,pageSize,unreadOnly)});
  const count=useQuery({queryKey:['notifications',userId,'unread-count'],enabled:!!userId,staleTime:0,refetchInterval:30_000,queryFn:()=>inboxService.unread(userId!)});
  useEffect(()=>{
    if(!userId)return;
    let active=true;
    const channel=supabase.channel(`notification-inbox:${userId}:${instance}`).on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},()=>{
      if(active)void cache.invalidateQueries({queryKey:['notifications',userId]});
    }).subscribe();
    return()=>{active=false;void supabase.removeChannel(channel);};
  },[userId,instance,cache]);
  async function markRead(id?:string){
    if(!userId || action.current===userId)return;
    const actor=userId;action.current=actor;setMutation({userId:actor,busy:true,error:''});
    try{await inboxService.markRead(actor,id);await cache.invalidateQueries({queryKey:['notifications',actor]});}
    catch(cause){if(account.current===actor)setMutation({userId:actor,busy:false,error:'Could not mark notifications as read. Please try again.'});throw cause;}
    finally{if(action.current===actor)action.current=null;if(account.current===actor)setMutation(previous=>previous?.userId===actor?{...previous,busy:false}:previous);}
  }
  return {
    notifications:userId?list.data?.rows ?? []:[],hasNext:!!userId&&!!list.data?.hasNext,
    unreadCount:userId?count.data ?? 0:0,countUnavailable:!!userId&&count.isError,
    loading:!!userId&&list.isPending,error:!!userId&&list.isError,
    mutationError:mutation && mutation.userId===userId?mutation.error:'',busy:!!mutation&&mutation.userId===userId&&mutation.busy,
    markAsRead:(id:string)=>markRead(id),markAllAsRead:()=>markRead(),
    refetch:async()=>{if(!userId)return;await Promise.all([list.refetch(),count.refetch()]);},
  };
}
export function useInAppNotifications(){return useNotificationInbox(0,false,10);}

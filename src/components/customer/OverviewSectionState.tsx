import type {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
type SectionQuery={isPending:boolean;isError:boolean;isFetching:boolean;refetch:()=>Promise<unknown>};
export function OverviewSectionState({query,label,children}:{query:SectionQuery;label:string;children:ReactNode}){
 if(query.isPending)return <p role="status" className="py-5 text-sm text-muted-foreground">Loading {label}…</p>;
 if(query.isError)return <div role="alert"><p className="text-sm text-muted-foreground">Could not load {label}. Your other dashboard sections are still available.</p><Button className="mt-4" variant="outline" disabled={query.isFetching} onClick={()=>void query.refetch()}>Retry {label}</Button></div>;
 return <>{children}</>;
}

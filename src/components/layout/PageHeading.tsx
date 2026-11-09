import type {ReactNode} from 'react';
import {cn} from '@/lib/utils';

type PageHeadingProps={
 title:ReactNode;
 eyebrow?:string;
 description?:ReactNode;
 actions?:ReactNode;
 size?:'display'|'workspace'|'compact';
 className?:string;
};

/** Shared hierarchy for public journeys and operational workspaces. */
export function PageHeading({title,eyebrow,description,actions,size='workspace',className}:PageHeadingProps){
 return <div className={cn('page-heading',`page-heading-${size}`,className)}>
  <div className="page-heading-copy">
   {eyebrow&&<p className="page-heading-eyebrow">{eyebrow}</p>}
   <h1>{title}</h1>
   {description&&<p className="page-heading-description">{description}</p>}
  </div>
  {actions&&<div className="page-heading-actions">{actions}</div>}
 </div>;
}

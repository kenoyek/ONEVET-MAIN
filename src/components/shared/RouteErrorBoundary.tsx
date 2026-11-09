import type {ReactNode} from 'react';
import {useLocation} from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

/** A broken page must not trap navigation to a different, healthy route. */
export function RouteErrorBoundary({children}:{children:ReactNode}){
 const {pathname}=useLocation();
 return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>;
}

import {Link,useLocation} from 'react-router-dom';
import {MailCheck} from 'lucide-react';
import {Button} from '@/components/ui/button';
export function RegistrationConfirmation({email,onSignIn}:{email:string;onSignIn?:()=>void}){
 const {state}=useLocation();
 return <section className="space-y-5 text-center" aria-live="polite">
  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"><MailCheck size={26} aria-hidden="true"/></span>
  <h2 className="text-2xl font-medium">Check your email to continue</h2>
  <p className="text-sm leading-relaxed text-muted-foreground">If confirmation is needed, you’ll receive a link at <strong className="text-foreground break-all">{email}</strong>. Open it to finish signing up.</p>
  <p className="text-sm text-muted-foreground">Check your spam folder too. If you already have an account, sign in instead.</p>
  <Link className="block text-sm text-primary underline underline-offset-4" to="/auth?mode=confirm" state={{...(state && typeof state==='object'?state:{}),confirmationEmail:email}}>Request another confirmation link</Link>
  <Button className="w-full" onClick={onSignIn} asChild={!onSignIn}>{onSignIn?'Back to sign in':<a href="/auth">Back to sign in</a>}</Button>
 </section>;
}

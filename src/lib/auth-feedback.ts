export function authErrorMessage(error:unknown,action:'signin'|'signup'|'reset'|'password'){
 const value=error&&typeof error==='object'?error as {code?:string;message?:string}:{};
 const message=value.message?.toLowerCase()||'';
 if(value.code==='email_not_confirmed'||message.includes('email not confirmed'))return 'Please confirm your email before signing in. Check your inbox and spam folder for the confirmation link.';
 if(value.code==='invalid_credentials'||message.includes('invalid login credentials'))return 'The email or password is incorrect. Check your details and try again.';
 if(value.code?.includes('rate_limit')||message.includes('rate limit')||message.includes('too many'))return 'Too many attempts. Please wait a little before trying again.';
 if(value.code==='user_already_exists'||message.includes('already registered')||message.includes('already exists'))return 'This email may already have an account. Try signing in or resetting your password.';
 if(value.code==='weak_password')return 'Choose a stronger password with at least 8 characters, uppercase and lowercase letters, and a number.';
 if(value.code==='same_password')return 'Choose a password you have not used for this account before.';
 if(action==='signin')return 'We could not sign you in. Check your connection and try again. Your details are still here.';
 if(action==='signup')return 'We could not confirm your registration. Your entries are still here; please try again.';
 if(action==='reset')return 'We could not request a reset link. Check your connection and try again.';
 return 'We could not update your password. Your reset link may have expired; request a new link and try again.';
}

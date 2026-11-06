-- Disposable PostgreSQL fixture. Never run on a shared Supabase instance.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA auth;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE anon NOLOGIN;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE public.profiles(id uuid PRIMARY KEY, user_id uuid UNIQUE REFERENCES auth.users(id));
CREATE TABLE public.user_roles(user_id uuid, role text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
CREATE FUNCTION public.get_profile_id(uid uuid) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT id FROM profiles WHERE user_id=uid;
$$;
CREATE FUNCTION public.has_role(uid uuid, requested text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id=uid AND role=requested);
$$;
CREATE FUNCTION public.update_updated_at_column() RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN NEW.updated_at=now(); RETURN NEW; END;
$$;

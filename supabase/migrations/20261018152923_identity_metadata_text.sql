-- Validate JSON types before ->> can coerce them to text.
create or replace function private.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  espacos constant text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  if new.email is null or btrim(new.email) = '' then
    raise exception 'Email obrigatório';
  end if;
  if jsonb_typeof(new.raw_user_meta_data->'nome') is distinct from 'string'
    or jsonb_typeof(new.raw_user_meta_data->'matricula') is distinct from 'string' then
    raise exception 'Nome e matrícula devem ser textuais';
  end if;
  insert into public.perfis (id, nome, matricula, setor_id, papel)
  values (new.id, btrim(new.raw_user_meta_data->>'nome', espacos),
    btrim(new.raw_user_meta_data->>'matricula', espacos),
    (new.raw_user_meta_data->>'setor_id')::uuid, 'Cliente');
  return new;
end;
$$;

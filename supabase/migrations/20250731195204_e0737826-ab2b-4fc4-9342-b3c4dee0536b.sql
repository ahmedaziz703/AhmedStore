-- Update the user role to admin for ahmedzizz703@gmail.com
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT user_id 
  FROM public.profiles 
  WHERE user_id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'ahmedzizz703@gmail.com'
  )
);
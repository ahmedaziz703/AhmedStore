-- Add foreign key constraint to favorites table
ALTER TABLE public.favorites 
ADD CONSTRAINT favorites_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
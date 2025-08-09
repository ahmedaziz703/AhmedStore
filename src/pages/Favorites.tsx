import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  price: number;
  discount_price?: number;
  image_urls: string[];
  stock_quantity: number;
  is_active: boolean;
}

interface FavoriteItem {
  id: string;
  product_id: string;
  created_at: string;
  products: Product;
}

export default function Favorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      setUser(user);
      await fetchFavorites();
    } catch (error) {
      console.error('خطأ في التحقق من المستخدم:', error);
      navigate('/auth', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // جلب تفاصيل المنتجات للمفضلة
      if (data && data.length > 0) {
        const productIds = data.map(fav => fav.product_id);
        
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds)
          .eq('is_active', true);

        if (productsError) throw productsError;

        // دمج بيانات المفضلة مع بيانات المنتجات
        const favoritesWithProducts = data.map(fav => ({
          ...fav,
          products: productsData?.find(product => product.id === fav.product_id)
        })).filter(fav => fav.products); // إزالة المفضلة للمنتجات المحذوفة أو غير النشطة

        setFavorites(favoritesWithProducts as FavoriteItem[]);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('خطأ في جلب المفضلة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب قائمة المفضلة",
        variant: "destructive"
      });
    }
  };

  const removeFromFavorites = async (favoriteId: string, productName: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: `تم إزالة ${productName} من المفضلة`,
      });

      await fetchFavorites();
    } catch (error) {
      console.error('خطأ في إزالة المنتج من المفضلة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إزالة المنتج من المفضلة",
        variant: "destructive"
      });
    }
  };

  const addToCart = async (productId: string, productName: string) => {
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    try {
      // التحقق من وجود المنتج في السلة
      const { data: existingCart } = await supabase
        .from('cart')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single();

      if (existingCart) {
        // تحديث الكمية إذا كان المنتج موجود في السلة
        const { error } = await supabase
          .from('cart')
          .update({ quantity: existingCart.quantity + 1 })
          .eq('id', existingCart.id);

        if (error) throw error;
      } else {
        // إضافة المنتج الجديد للسلة
        const { error } = await supabase
          .from('cart')
          .insert([{
            user_id: user.id,
            product_id: productId,
            quantity: 1
          }]);

        if (error) throw error;
      }

      toast({
        title: "تم الإضافة",
        description: `تم إضافة ${productName} إلى السلة`,
      });
    } catch (error) {
      console.error('خطأ في إضافة المنتج للسلة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة المنتج للسلة",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted rounded-xl h-12 w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-muted rounded-xl h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          <h1 className="text-3xl font-bold">المفضلة</h1>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {favorites.length} منتج
          </Badge>
        </div>

        {favorites.length === 0 ? (
          <Card className="card-elegant text-center py-16">
            <CardContent>
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">قائمة المفضلة فارغة</h2>
              <p className="text-muted-foreground mb-6">
                لم تقم بإضافة أي منتجات لقائمة المفضلة بعد
              </p>
              <Button 
                onClick={() => navigate('/products')}
                className="btn-primary"
              >
                تصفح المنتجات
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const product = favorite.products;
              const currentPrice = product.discount_price || product.price;
              const originalPrice = product.discount_price ? product.price : null;

              return (
                <Card key={favorite.id} className="card-elegant group hover:shadow-xl transition-all duration-300">
                  <div className="relative overflow-hidden rounded-t-xl">
                    {product.image_urls && product.image_urls.length > 0 ? (
                      <img
                        src={product.image_urls[0]}
                        alt={product.name_ar}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">لا توجد صورة</span>
                      </div>
                    )}
                    
                    {product.discount_price && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                        خصم {Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 left-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => removeFromFavorites(favorite.id, product.name_ar)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <h3 
                      className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {product.name_ar}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description_ar}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                          {currentPrice.toFixed(2)} ريال
                        </span>
                        {originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            {originalPrice.toFixed(2)} ريال
                          </span>
                        )}
                      </div>

                      <Badge variant={product.stock_quantity > 0 ? "default" : "secondary"}>
                        {product.stock_quantity > 0 ? 'متوفر' : 'نفد المخزون'}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/product/${product.id}`)}
                      >
                        عرض التفاصيل
                      </Button>
                      
                      <Button
                        size="sm"
                        className="btn-primary flex-1"
                        disabled={product.stock_quantity === 0}
                        onClick={() => addToCart(product.id, product.name_ar)}
                      >
                        <ShoppingCart className="h-4 w-4 ml-2" />
                        أضف للسلة
                      </Button>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground">
                      أضيف في {new Date(favorite.created_at).toLocaleDateString('ar-SA')}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Heart, Star, Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  price: number;
  discount_price?: number;
  image_urls: string[];
  stock_quantity: number;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  image_url?: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب المنتجات
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .limit(12);

      if (productsError) throw productsError;

      // جلب الفئات
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      setProducts(productsData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('خطأ في جلب البيانات:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      const { error } = await supabase
        .from('cart')
        .upsert({
          user_id: user.id,
          product_id: productId,
          quantity: 1
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('خطأ في إضافة المنتج للسلة:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* القسم الرئيسي */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5"></div>
        <div className="container relative">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-gradient leading-tight">
              اكتشف عالم الحرف
              <br />
              والفنون العربية
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              مجموعة مختارة بعناية من أجود المنتجات الحرفية والتراثية العربية الأصيلة
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="btn-primary btn-arabic text-lg"
                onClick={() => navigate('/products')}
              >
                تسوق الآن
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="btn-arabic text-lg"
                onClick={() => navigate('/products')}
              >
                استكشف المجموعات
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* الفئات */}
      {categories.length > 0 && (
        <section className="py-16">
          <div className="container">
            <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
              تصفح حسب الفئة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((category) => (
                <Card 
                  key={category.id} 
                  className="card-elegant cursor-pointer group"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    {category.image_url && (
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary p-1">
                        <img
                          src={category.image_url}
                          alt={category.name_ar}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {category.name_ar}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* المنتجات المميزة */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-12 text-gradient">
            المنتجات المميزة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Card key={product.id} className="card-elegant group">
                <CardContent className="p-0">
                  {product.image_urls && product.image_urls[0] && (
                    <div className="relative overflow-hidden rounded-t-xl">
                      <img
                        src={product.image_urls[0]}
                        alt={product.name_ar}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.discount_price && (
                        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground">
                          خصم
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-lg line-clamp-2">
                      {product.name_ar}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description_ar}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">(٤.٨)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-primary">
                          {product.discount_price || product.price} ريال
                        </span>
                        {product.discount_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {product.price} ريال
                          </span>
                        )}
                      </div>
                      <Badge variant={product.stock_quantity > 0 ? 'default' : 'destructive'}>
                        {product.stock_quantity > 0 ? 'متوفر' : 'نفذ'}
                      </Badge>
                    </div>
                    <Button 
                      className="w-full btn-primary btn-arabic"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock_quantity === 0}
                    >
                      <ShoppingCart className="h-4 w-4 ml-2" />
                      أضف للسلة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* الفوتر */}
      <footer className="bg-card border-t py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gradient">المتجر العربي الأصيل</h3>
              <p className="text-muted-foreground">
                متجرك الموثوق للحرف والفنون العربية الأصيلة
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">خدمة العملاء</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>اتصل بنا</li>
                <li>الأسئلة الشائعة</li>
                <li>سياسة الإرجاع</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">روابط سريعة</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>عن المتجر</li>
                <li>شروط الخدمة</li>
                <li>سياسة الخصوصية</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">تابعنا</h4>
              <p className="text-sm text-muted-foreground">
                ابق على اطلاع بأحدث المنتجات والعروض
              </p>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 المتجر الأصيل. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
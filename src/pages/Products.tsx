import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Heart, Star, Search, Filter, Grid, List } from 'lucide-react';
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
  category_id?: string;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // جلب المنتجات
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: productsData, error: productsError } = await query;
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

  const filteredProducts = products.filter(product => {
    // تصفية حسب البحث
    const matchesSearch = product.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description_ar?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // تصفية حسب الفئة
    const matchesCategory = selectedCategory === 'all' || selectedCategory === '' || product.category_id === selectedCategory;
    
    // تصفية حسب نطاق السعر
    let matchesPrice = true;
    if (priceRange && priceRange !== 'all') {
      const price = product.discount_price || product.price;
      switch (priceRange) {
        case 'under-100':
          matchesPrice = price < 100;
          break;
        case '100-500':
          matchesPrice = price >= 100 && price <= 500;
          break;
        case '500-1000':
          matchesPrice = price >= 500 && price <= 1000;
          break;
        case 'over-1000':
          matchesPrice = price > 1000;
          break;
        default:
          matchesPrice = true;
      }
    }
    
    return matchesSearch && matchesCategory && matchesPrice;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low': 
        return (a.discount_price || a.price) - (b.discount_price || b.price);
      case 'price-high': 
        return (b.discount_price || b.price) - (a.discount_price || a.price);
      case 'name': 
        return a.name_ar.localeCompare(b.name_ar);
      default: 
        return 0;
    }
  });

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

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-xl h-48 mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-muted rounded h-4 w-3/4"></div>
                  <div className="bg-muted rounded h-4 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        {/* الفلاتر وشريط البحث */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ابحث عن المنتجات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name_ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">ترتيب أبجدي</SelectItem>
                  <SelectItem value="price-low">السعر: من الأقل للأعلى</SelectItem>
                  <SelectItem value="price-high">السعر: من الأعلى للأقل</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="نطاق السعر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأسعار</SelectItem>
                  <SelectItem value="under-100">أقل من 100 ريال</SelectItem>
                  <SelectItem value="100-500">100 - 500 ريال</SelectItem>
                  <SelectItem value="500-1000">500 - 1000 ريال</SelectItem>
                  <SelectItem value="over-1000">أكثر من 1000 ريال</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground mr-4">
                {filteredProducts.length} منتج
              </span>
            </div>
          </div>
        </div>

        {/* عرض المنتجات */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">لم يتم العثور على منتجات</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-1'
          }`}>
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className={`card-elegant group cursor-pointer ${
                  viewMode === 'list' ? 'flex flex-row' : ''
                }`}
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <CardContent className={`p-0 ${viewMode === 'list' ? 'flex w-full' : ''}`}>
                  {product.image_urls && product.image_urls[0] && (
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' 
                        ? 'w-48 h-32 rounded-r-xl' 
                        : 'rounded-t-xl h-48'
                    }`}>
                      <img
                        src={product.image_urls[0]}
                        alt={product.name_ar}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className={`space-y-3 ${
                    viewMode === 'list' ? 'p-6 flex-1' : 'p-4'
                  }`}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product.id);
                      }}
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
        )}
      </div>
    </div>
  );
}
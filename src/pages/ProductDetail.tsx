import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Heart, Star, ArrowRight, Share2, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface Product {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  discount_price?: number;
  image_urls: string[];
  stock_quantity: number;
  category_id: string;
}

interface Category {
  id: string;
  name_ar: string;
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
  };
}

interface ReviewStats {
  average: number;
  total: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({ average: 0, total: 0 });
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (id && user) {
      fetchProduct();
      checkFavoriteStatus();
    } else if (id && !user) {
      fetchProduct();
    }
  }, [id, user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProduct = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (productError) throw productError;

      if (productData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id, name_ar')
          .eq('id', productData.category_id)
          .single();
        
        setCategory(categoryData);
      }

      setProduct(productData);
      await fetchReviews();
    } catch (error) {
      console.error('خطأ في جلب المنتج:', error);
      toast({
        title: "خطأ",
        description: "لم يتم العثور على المنتج",
        variant: "destructive"
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      // جلب التقييمات أولاً
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (reviewsData && reviewsData.length > 0) {
        // جلب أسماء المستخدمين من جدول الملفات الشخصية
        const userIds = reviewsData.map(review => review.user_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        // دمج البيانات
        const reviewsWithProfiles = reviewsData.map(review => ({
          ...review,
          profiles: profilesData?.find(profile => profile.user_id === review.user_id) || null
        }));

        setReviews(reviewsWithProfiles as Review[]);
        
        // حساب متوسط التقييمات
        const average = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setReviewStats({ average, total: reviewsData.length });
        
        // البحث عن تقييم المستخدم الحالي
        if (user) {
          const userReviewData = reviewsWithProfiles.find(review => review.user_id === user.id);
          setUserReview(userReviewData || null);
        }
      } else {
        setReviews([]);
        setReviewStats({ average: 0, total: 0 });
      }
    } catch (error) {
      console.error('خطأ في جلب التقييمات:', error);
    }
  };

  const checkFavoriteStatus = async () => {
    if (!user || !id) return;
    
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      setIsFavorite(!!data);
    } catch (error) {
      // لا نطبع خطأ هنا لأن عدم وجود المنتج في المفضلة أمر طبيعي
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (error) throw error;

        setIsFavorite(false);
        toast({
          title: "تم الحذف",
          description: "تم إزالة المنتج من المفضلة",
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{
            user_id: user.id,
            product_id: id
          }]);

        if (error) throw error;

        setIsFavorite(true);
        toast({
          title: "تم الإضافة",
          description: "تم إضافة المنتج للمفضلة",
        });
      }
    } catch (error) {
      console.error('خطأ في تحديث المفضلة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث المفضلة",
        variant: "destructive"
      });
    }
  };

  const addToCart = async () => {
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
          product_id: id!,
          quantity: quantity
        }, {
          onConflict: 'user_id,product_id'
        });

      if (error) throw error;

      toast({
        title: "تم الإضافة للسلة",
        description: `تم إضافة ${quantity} من ${product?.name_ar} للسلة`,
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

  const submitReview = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      if (userReview) {
        // تحديث التقييم الموجود
        const { error } = await supabase
          .from('reviews')
          .update({
            rating: newReview.rating,
            comment: newReview.comment
          })
          .eq('id', userReview.id);

        if (error) throw error;

        toast({
          title: "تم التحديث",
          description: "تم تحديث تقييمك بنجاح",
        });
      } else {
        // إضافة تقييم جديد
        const { error } = await supabase
          .from('reviews')
          .insert([{
            user_id: user.id,
            product_id: id,
            rating: newReview.rating,
            comment: newReview.comment
          }]);

        if (error) throw error;

        toast({
          title: "تم الإضافة",
          description: "تم إضافة تقييمك بنجاح",
        });
      }

      setShowReviewDialog(false);
      setNewReview({ rating: 5, comment: '' });
      await fetchReviews();
    } catch (error) {
      console.error('خطأ في إضافة التقييم:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة التقييم",
        variant: "destructive"
      });
    }
  };

  const shareProduct = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name_ar,
          text: product?.description_ar,
          url: window.location.href,
        });
      } catch (error) {
        console.log('خطأ في المشاركة:', error);
      }
    } else {
      // نسخ الرابط إلى الحافظة
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رابط المنتج للحافظة",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="animate-pulse bg-muted rounded-xl h-96"></div>
            <div className="space-y-4">
              <div className="animate-pulse bg-muted rounded h-8 w-3/4"></div>
              <div className="animate-pulse bg-muted rounded h-4 w-1/2"></div>
              <div className="animate-pulse bg-muted rounded h-20 w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">المنتج غير موجود</h1>
          <Button onClick={() => navigate('/products')}>
            العودة للمنتجات
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        {/* مسار التنقل */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            الرئيسية
          </Button>
          <ArrowRight className="h-4 w-4" />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/products')}
            className="p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            المنتجات
          </Button>
          {category && (
            <>
              <ArrowRight className="h-4 w-4" />
              <span>{category.name_ar}</span>
            </>
          )}
          <ArrowRight className="h-4 w-4" />
          <span className="text-foreground">{product.name_ar}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* معرض الصور */}
          <div className="space-y-4">
            <Card className="card-elegant overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square">
                  <img
                    src={product.image_urls?.[selectedImage] || '/placeholder.svg'}
                    alt={product.name_ar}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
            
            {product.image_urls && product.image_urls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.image_urls.map((image, index) => (
                  <Card
                    key={index}
                    className={`cursor-pointer overflow-hidden border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-square">
                        <img
                          src={image}
                          alt={`${product.name_ar} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* تفاصيل المنتج */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name_ar}</h1>
              {category && (
                <Badge variant="secondary" className="mb-4">
                  {category.name_ar}
                </Badge>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-5 w-5 ${
                          star <= Math.round(reviewStats.average)
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({reviewStats.average.toFixed(1)}) • {reviewStats.total} تقييم
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={shareProduct}>
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-primary">
                  {product.discount_price || product.price} ريال
                </span>
                {product.discount_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {product.price} ريال
                  </span>
                )}
                {product.discount_price && (
                  <Badge className="bg-destructive text-destructive-foreground">
                    خصم {Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* خيارات الشراء */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-semibold">الكمية:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant={product.stock_quantity > 0 ? 'default' : 'destructive'}>
                  {product.stock_quantity > 0 ? `متوفر (${product.stock_quantity})` : 'نفذ'}
                </Badge>
              </div>

              <div className="flex gap-4">
                <Button 
                  className="flex-1 btn-primary btn-arabic"
                  size="lg"
                  onClick={addToCart}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 ml-2" />
                  أضف للسلة
                </Button>
                <Button 
                  variant={isFavorite ? "default" : "outline"} 
                  size="lg"
                  onClick={toggleFavorite}
                  className={isFavorite ? "text-white" : "hover:bg-red-50 hover:text-red-600"}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-white' : ''}`} />
                </Button>
              </div>
            </div>

            <Separator />

            {/* تفاصيل إضافية */}
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">الوصف</TabsTrigger>
                <TabsTrigger value="specifications">المواصفات</TabsTrigger>
                <TabsTrigger value="reviews">التقييمات</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description_ar || 'لا يوجد وصف متاح لهذا المنتج.'}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="specifications" className="mt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">رقم المنتج:</span>
                    <span className="text-muted-foreground">{product.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">الفئة:</span>
                    <span className="text-muted-foreground">{category?.name_ar || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">الحالة:</span>
                    <span className="text-muted-foreground">جديد</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">المخزون:</span>
                    <span className="text-muted-foreground">{product.stock_quantity} قطعة</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">التقييمات والمراجعات</h3>
                    <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          {userReview ? 'تعديل تقييمي' : 'أضف تقييمك'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{userReview ? 'تعديل التقييم' : 'إضافة تقييم جديد'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>التقييم</Label>
                            <div className="flex items-center gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-6 w-6 cursor-pointer transition-colors ${
                                    star <= newReview.rating
                                      ? 'fill-primary text-primary'
                                      : 'text-muted-foreground hover:text-primary'
                                  }`}
                                  onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="comment">التعليق (اختياري)</Label>
                            <Textarea
                              id="comment"
                              placeholder="شاركنا رأيك في المنتج..."
                              value={newReview.comment}
                              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                              إلغاء
                            </Button>
                            <Button onClick={submitReview} className="btn-primary">
                              {userReview ? 'تحديث' : 'إضافة'} التقييم
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map((review) => (
                        <div key={review.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? 'fill-primary text-primary'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-semibold">
                                {review.profiles?.full_name || 'مستخدم'}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('ar-SA')}
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">لا توجد تقييمات بعد</p>
                      <Button variant="outline" onClick={() => setShowReviewDialog(true)}>
                        كن أول من يقيم هذا المنتج
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
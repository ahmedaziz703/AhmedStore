import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingCart, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    id: string;
    name_ar: string;
    price: number;
    discount_price?: number;
    image_urls: string[];
    stock_quantity: number;
  };
}

export default function Cart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuthAndFetchCart();
  }, []);

  const checkAuthAndFetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      setUser(user);
      await fetchCartItems(user.id);
    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      navigate('/auth', { replace: true });
    }
  };

  const fetchCartItems = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          products:product_id (
            id,
            name_ar,
            price,
            discount_price,
            image_urls,
            stock_quantity
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('خطأ في جلب منتجات السلة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في جلب منتجات السلة",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items =>
        items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('خطأ في تحديث الكمية:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الكمية",
        variant: "destructive"
      });
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== itemId));
      
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
      });
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف المنتج",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setCartItems([]);
      
      toast({
        title: "تم الحذف",
        description: "تم حذف جميع المنتجات من السلة",
      });
    } catch (error) {
      console.error('خطأ في مسح السلة:', error);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.products?.discount_price || item.products?.price || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-muted rounded-xl h-32"></div>
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
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart className="h-6 w-6" />
          <h1 className="text-3xl font-bold">سلة التسوق</h1>
          <Badge variant="secondary">
            {cartItems.length} منتج
          </Badge>
        </div>

        {cartItems.length === 0 ? (
          <Card className="card-elegant text-center py-12">
            <CardContent>
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">السلة فارغة</h2>
              <p className="text-muted-foreground mb-6">
                لم تقم بإضافة أي منتجات للسلة بعد
              </p>
              <Button 
                className="btn-primary btn-arabic"
                onClick={() => navigate('/products')}
              >
                تصفح المنتجات
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* منتجات السلة */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="card-elegant">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {item.products?.image_urls?.[0] && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                          <img
                            src={item.products.image_urls[0]}
                            alt={item.products.name_ar}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {item.products?.name_ar}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-primary">
                            {item.products?.discount_price || item.products?.price} ريال
                          </span>
                          {item.products?.discount_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {item.products.price} ريال
                            </span>
                          )}
                        </div>
                        <Badge 
                          variant={item.products?.stock_quantity && item.products.stock_quantity > 0 ? 'default' : 'destructive'}
                        >
                          {item.products?.stock_quantity && item.products.stock_quantity > 0 ? 'متوفر' : 'نفذ'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          min="1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.products?.stock_quantity && item.quantity >= item.products.stock_quantity}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  مسح السلة
                </Button>
              </div>
            </div>

            {/* ملخص الطلب */}
            <div className="lg:col-span-1">
              <Card className="card-elegant sticky top-24">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.products?.name_ar} × {item.quantity}
                        </span>
                        <span>
                          {((item.products?.discount_price || item.products?.price || 0) * item.quantity).toFixed(2)} ريال
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي</span>
                      <span>{calculateTotal().toFixed(2)} ريال</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الشحن</span>
                      <span className="text-green-600">مجاني</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة</span>
                      <span>{(calculateTotal() * 0.15).toFixed(2)} ريال</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>المجموع النهائي</span>
                    <span className="text-primary">
                      {(calculateTotal() * 1.15).toFixed(2)} ريال
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full btn-primary btn-arabic"
                    onClick={handleCheckout}
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4 ml-2" />
                    إتمام الشراء
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full btn-arabic"
                    onClick={() => navigate('/products')}
                  >
                    متابعة التسوق
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  ShoppingBag,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name_ar: string;
    price: number;
    discount_price?: number;
    image_urls: string[];
  };
}

interface UserProfile {
  full_name: string;
  phone: string;
  address: string;
  city: string;
}

export default function Checkout() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    phone: '',
    address: '',
    city: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);
      await Promise.all([
        fetchCartItems(user.id),
        fetchUserProfile(user.id)
      ]);
    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          *,
          products (
            name_ar,
            price,
            discount_price,
            image_urls
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('خطأ في جلب عناصر السلة:', error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, address, city')
        .eq('user_id', userId)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.products.discount_price || item.products.price;
      return total + (price * item.quantity);
    }, 0);
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = async () => {
    if (!profile.full_name || !profile.phone || !profile.address || !profile.city) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع البيانات المطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "خطأ",
        description: "السلة فارغة",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // إنشاء الطلب
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          total_amount: calculateTotal(),
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'paid',
          shipping_address: `${profile.address}, ${profile.city}`,
          notes: notes || null,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // إضافة عناصر الطلب
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.products.discount_price || item.products.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // تحديث بيانات المستخدم
      await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city
        });

      // مسح السلة
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      toast({
        title: "تم إنشاء الطلب بنجاح",
        description: `رقم الطلب: ${order.id.slice(0, 8)}`,
      });

      navigate('/profile?tab=orders');
    } catch (error) {
      console.error('خطأ في إنشاء الطلب:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إنشاء الطلب",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted rounded-xl h-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-muted rounded-xl h-96"></div>
              <div className="bg-muted rounded-xl h-96"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <Card className="card-elegant max-w-md mx-auto text-center">
            <CardContent className="p-8">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">السلة فارغة</h2>
              <p className="text-muted-foreground mb-6">
                لا يمكنك المتابعة للدفع بسلة فارغة
              </p>
              <Button onClick={() => navigate('/products')} className="btn-primary">
                تصفح المنتجات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <CheckCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">إتمام الطلب</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* بيانات الطلب */}
            <div className="space-y-6">
              {/* بيانات الشحن */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    بيانات الشحن
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">الاسم الكامل</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => handleProfileChange('full_name', e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        placeholder="مثل: 05xxxxxxxx"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => handleProfileChange('city', e.target.value)}
                      placeholder="أدخل المدينة"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">العنوان التفصيلي</Label>
                    <Textarea
                      id="address"
                      value={profile.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      placeholder="أدخل العنوان التفصيلي (الحي، الشارع، رقم المبنى)"
                      rows={3}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* طريقة الدفع */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                    <div className="flex items-center space-x-2 space-x-reverse p-4 border rounded-lg">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer">
                        <Truck className="h-4 w-4" />
                        الدفع عند الاستلام
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* ملاحظات */}
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>ملاحظات إضافية (اختيارية)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أضف أي ملاحظات أو تعليمات خاصة للطلب"
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* ملخص الطلب */}
            <div className="space-y-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>ملخص الطلب</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        {item.products.image_urls?.[0] ? (
                          <img 
                            src={item.products.image_urls[0]} 
                            alt={item.products.name_ar}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.products.name_ar}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">الكمية: {item.quantity}</Badge>
                          <span className="text-sm font-medium">
                            {(item.products.discount_price || item.products.price).toFixed(2)} ريال
                          </span>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-semibold">
                          {((item.products.discount_price || item.products.price) * item.quantity).toFixed(2)} ريال
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>المجموع الكلي:</span>
                    <span className="text-primary">{calculateTotal().toFixed(2)} ريال</span>
                  </div>
                  
                  <Button 
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className="w-full btn-primary btn-arabic"
                    size="lg"
                  >
                    {submitting ? 'جاري المعالجة...' : 'تأكيد الطلب'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
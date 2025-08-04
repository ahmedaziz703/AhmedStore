import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  User, 
  Package, 
  Edit, 
  Save, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  ShoppingBag,
  LogOut
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';

interface UserProfile {
  full_name: string;
  phone: string;
  address: string;
  city: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  order_items: {
    quantity: number;
    price: number;
    products: {
      name_ar: string;
    };
  }[];
}

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    phone: '',
    address: '',
    city: ''
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

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
        fetchUserProfile(user.id),
        fetchUserOrders(user.id)
      ]);
    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
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

  const fetchUserOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            products (
              name_ar
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('خطأ في جلب الطلبات:', error);
    }
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          city: profile.city
        });

      if (error) throw error;

      toast({
        title: "تم حفظ البيانات",
        description: "تم تحديث بياناتك بنجاح",
      });

      setEditing(false);
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حفظ البيانات",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'قيد المعالجة', variant: 'secondary' as const },
      'confirmed': { label: 'مؤكد', variant: 'default' as const },
      'shipped': { label: 'تم الشحن', variant: 'outline' as const },
      'delivered': { label: 'تم التسليم', variant: 'default' as const },
      'cancelled': { label: 'ملغي', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'قيد الانتظار', variant: 'secondary' as const },
      'paid': { label: 'مدفوع', variant: 'default' as const },
      'failed': { label: 'فشل', variant: 'destructive' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted rounded-xl h-32"></div>
            <div className="bg-muted rounded-xl h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">الملف الشخصي</h1>
            </div>
            <Button variant="outline" onClick={handleLogout} className="btn-arabic">
              <LogOut className="h-4 w-4 ml-2" />
              تسجيل الخروج
            </Button>
          </div>

          <Tabs value={activeTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">البيانات الشخصية</TabsTrigger>
              <TabsTrigger value="orders">الطلبات السابقة</TabsTrigger>
            </TabsList>

            {/* البيانات الشخصية */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="card-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      معلومات الحساب
                    </CardTitle>
                    {!editing && (
                      <Button variant="outline" onClick={() => setEditing(true)}>
                        <Edit className="h-4 w-4 ml-2" />
                        تعديل
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2">
                      <Mail className="h-4 w-4" />
                      البريد الإلكتروني
                    </Label>
                    <Input value={user?.email || ''} disabled />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">الاسم الكامل</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => handleProfileChange('full_name', e.target.value)}
                        disabled={!editing}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        رقم الهاتف
                      </Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        disabled={!editing}
                        placeholder="مثل: 05xxxxxxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="city" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      المدينة
                    </Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => handleProfileChange('city', e.target.value)}
                      disabled={!editing}
                      placeholder="أدخل المدينة"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">العنوان التفصيلي</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => handleProfileChange('address', e.target.value)}
                      disabled={!editing}
                      placeholder="أدخل العنوان التفصيلي"
                    />
                  </div>

                  {editing && (
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setEditing(false)}>
                        إلغاء
                      </Button>
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="btn-primary"
                      >
                        <Save className="h-4 w-4 ml-2" />
                        {saving ? 'جاري الحفظ...' : 'حفظ'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* الطلبات السابقة */}
            <TabsContent value="orders" className="space-y-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    الطلبات السابقة ({orders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">لا توجد طلبات سابقة</h3>
                      <p className="text-muted-foreground mb-6">
                        لم تقم بأي طلبات حتى الآن
                      </p>
                      <Button onClick={() => navigate('/products')} className="btn-primary">
                        تصفح المنتجات
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Card key={order.id} className="border">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-semibold">طلب رقم: {order.id.slice(0, 8)}</h4>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(order.created_at).toLocaleDateString('ar-SA')}
                                </div>
                              </div>
                              <div className="text-left">
                                <div className="text-lg font-bold text-primary mb-2">
                                  {order.total_amount.toFixed(2)} ريال
                                </div>
                                <div className="flex gap-2">
                                  {getStatusBadge(order.status)}
                                  {getPaymentStatusBadge(order.payment_status)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="border-t pt-4">
                              <h5 className="font-medium mb-2">عناصر الطلب:</h5>
                              <div className="space-y-1">
                                {order.order_items.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span>
                                      {item.products.name_ar} x {item.quantity}
                                    </span>
                                    <span>{(item.price * item.quantity).toFixed(2)} ريال</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
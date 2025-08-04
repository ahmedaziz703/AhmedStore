import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { ImageUpload } from '@/components/ImageUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Users, 
  ShoppingCart,
  BarChart3,
  Settings
} from 'lucide-react';

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
  is_active: boolean;
}

interface Category {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  image_url?: string;
}

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [categoryImage, setCategoryImage] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUser(user);

      // التحقق من صلاحيات الإدارة
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');

      if (error || !userRoles || userRoles.length === 0) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية للوصول لهذه الصفحة",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      await fetchAdminData();
    } catch (error) {
      console.error('خطأ في التحقق من الصلاحيات:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      // جلب المنتجات
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      // جلب الفئات
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      // جلب الطلبات
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      setProducts(productsData || []);
      setCategories(categoriesData || []);
      setOrders(ordersData || []);

      // حساب الإحصائيات
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      
      setStats({
        totalProducts: productsData?.length || 0,
        totalOrders: ordersData?.length || 0,
        totalRevenue,
        totalUsers: 0 // سيتم حسابها لاحقاً
      });
    } catch (error) {
      console.error('خطأ في جلب بيانات الإدارة:', error);
    }
  };

  const handleAddProduct = async (formData: FormData) => {
    try {
      const productData = {
        name_ar: formData.get('name_ar') as string,
        name_en: formData.get('name_en') as string,
        description_ar: formData.get('description_ar') as string,
        description_en: formData.get('description_en') as string,
        price: parseFloat(formData.get('price') as string),
        discount_price: formData.get('discount_price') ? parseFloat(formData.get('discount_price') as string) : null,
        stock_quantity: parseInt(formData.get('stock_quantity') as string),
        category_id: formData.get('category_id') as string || null,
        image_urls: productImages,
        is_active: true
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "تم إضافة المنتج",
        description: "تم إضافة المنتج بنجاح",
      });

      setShowAddProduct(false);
      setProductImages([]);
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في إضافة المنتج:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة المنتج",
        variant: "destructive"
      });
    }
  };

  const handleAddCategory = async (formData: FormData) => {
    try {
      const categoryData = {
        name_ar: formData.get('name_ar') as string,
        name_en: formData.get('name_en') as string,
        description_ar: formData.get('description_ar') as string,
        description_en: formData.get('description_en') as string,
        image_url: categoryImage[0] || null
      };

      const { error } = await supabase
        .from('categories')
        .insert([categoryData]);

      if (error) throw error;

      toast({
        title: "تم إضافة الفئة",
        description: "تم إضافة الفئة بنجاح",
      });

      setShowAddCategory(false);
      setCategoryImage([]);
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في إضافة الفئة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة الفئة",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProduct = async (formData: FormData) => {
    if (!editingProduct) return;
    
    try {
      const productData = {
        name_ar: formData.get('name_ar') as string,
        name_en: formData.get('name_en') as string,
        description_ar: formData.get('description_ar') as string,
        description_en: formData.get('description_en') as string,
        price: parseFloat(formData.get('price') as string),
        discount_price: formData.get('discount_price') ? parseFloat(formData.get('discount_price') as string) : null,
        stock_quantity: parseInt(formData.get('stock_quantity') as string),
        category_id: formData.get('category_id') as string || null,
        image_urls: productImages,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "تم تحديث المنتج",
        description: "تم تحديث المنتج بنجاح",
      });

      setEditingProduct(null);
      setProductImages([]);
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في تحديث المنتج:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث المنتج",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCategory = async (formData: FormData) => {
    if (!editingCategory) return;
    
    try {
      const categoryData = {
        name_ar: formData.get('name_ar') as string,
        name_en: formData.get('name_en') as string,
        description_ar: formData.get('description_ar') as string,
        description_en: formData.get('description_en') as string,
        image_url: categoryImage[0] || null
      };

      const { error } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id);

      if (error) throw error;

      toast({
        title: "تم تحديث الفئة",
        description: "تم تحديث الفئة بنجاح",
      });

      setEditingCategory(null);
      setCategoryImage([]);
      fetchAdminData();
    } catch (error) {
      console.error('خطأ في تحديث الفئة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الفئة",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "تم حذف المنتج",
        description: "تم حذف المنتج بنجاح",
      });

      fetchAdminData();
    } catch (error) {
      console.error('خطأ في حذف المنتج:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف المنتج",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "تم حذف الفئة",
        description: "تم حذف الفئة بنجاح",
      });

      fetchAdminData();
    } catch (error) {
      console.error('خطأ في حذف الفئة:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف الفئة",
        variant: "destructive"
      });
    }
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductImages(product.image_urls || []);
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryImage(category.image_url ? [category.image_url] : []);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted rounded-xl h-32"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-muted rounded-xl h-24"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">لوحة الإدارة</h1>
          <Badge variant="secondary">
            <Settings className="h-4 w-4 ml-2" />
            مشرف
          </Badge>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} ريال</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elegant">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المستخدمين</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* إدارة المنتجات */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">إدارة المنتجات</h2>
                <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogTrigger asChild>
                  <Button className="btn-primary btn-arabic">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة منتج
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>إضافة منتج جديد</DialogTitle>
                  </DialogHeader>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddProduct(new FormData(e.currentTarget));
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name_ar">اسم المنتج (عربي)</Label>
                        <Input id="name_ar" name="name_ar" required />
                      </div>
                      <div>
                        <Label htmlFor="name_en">اسم المنتج (إنجليزي)</Label>
                        <Input id="name_en" name="name_en" />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="description_ar">الوصف</Label>
                      <Textarea id="description_ar" name="description_ar" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="price">السعر</Label>
                        <Input id="price" name="price" type="number" step="0.01" required />
                      </div>
                      <div>
                        <Label htmlFor="discount_price">سعر الخصم</Label>
                        <Input id="discount_price" name="discount_price" type="number" step="0.01" />
                      </div>
                      <div>
                        <Label htmlFor="stock_quantity">الكمية</Label>
                        <Input id="stock_quantity" name="stock_quantity" type="number" required />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="category_id">الفئة</Label>
                      <Select name="category_id">
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(category => category.id && category.id.trim() !== '').map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                     </div>
                     
                     <ImageUpload 
                       onImagesChange={setProductImages}
                       initialImages={productImages}
                     />
                     
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setShowAddProduct(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" className="btn-primary">
                        إضافة المنتج
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* تعديل المنتج */}
              <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>تعديل المنتج</DialogTitle>
                  </DialogHeader>
                  {editingProduct && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateProduct(new FormData(e.currentTarget));
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_name_ar">اسم المنتج (عربي)</Label>
                          <Input id="edit_name_ar" name="name_ar" defaultValue={editingProduct.name_ar} required />
                        </div>
                        <div>
                          <Label htmlFor="edit_name_en">اسم المنتج (إنجليزي)</Label>
                          <Input id="edit_name_en" name="name_en" defaultValue={editingProduct.name_en} />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_description_ar">الوصف</Label>
                        <Textarea id="edit_description_ar" name="description_ar" defaultValue={editingProduct.description_ar} />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="edit_price">السعر</Label>
                          <Input id="edit_price" name="price" type="number" step="0.01" defaultValue={editingProduct.price} required />
                        </div>
                        <div>
                          <Label htmlFor="edit_discount_price">سعر الخصم</Label>
                          <Input id="edit_discount_price" name="discount_price" type="number" step="0.01" defaultValue={editingProduct.discount_price || ''} />
                        </div>
                        <div>
                          <Label htmlFor="edit_stock_quantity">الكمية</Label>
                          <Input id="edit_stock_quantity" name="stock_quantity" type="number" defaultValue={editingProduct.stock_quantity} required />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit_category_id">الفئة</Label>
                        <Select name="category_id" defaultValue={editingProduct.category_id || ''}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الفئة" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.filter(category => category.id && category.id.trim() !== '').map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name_ar}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                       </div>
                       
                       <ImageUpload 
                         onImagesChange={setProductImages}
                         initialImages={productImages}
                       />
                       
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                          إلغاء
                        </Button>
                        <Button type="submit" className="btn-primary">
                          تحديث المنتج
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <Card className="card-elegant">
              <CardContent className="p-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم المنتج</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المخزون</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name_ar}
                        </TableCell>
                        <TableCell>
                          {product.discount_price || product.price} ريال
                        </TableCell>
                        <TableCell>{product.stock_quantity}</TableCell>
                        <TableCell>
                          <Badge variant={product.is_active ? 'default' : 'secondary'}>
                            {product.is_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => startEditProduct(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* إدارة الفئات */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">إدارة الفئات</h2>
              <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogTrigger asChild>
                  <Button className="btn-primary btn-arabic">
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة فئة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>إضافة فئة جديدة</DialogTitle>
                  </DialogHeader>
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddCategory(new FormData(e.currentTarget));
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cat_name_ar">اسم الفئة (عربي)</Label>
                        <Input id="cat_name_ar" name="name_ar" required />
                      </div>
                      <div>
                        <Label htmlFor="cat_name_en">اسم الفئة (إنجليزي)</Label>
                        <Input id="cat_name_en" name="name_en" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cat_description_ar">الوصف (عربي)</Label>
                        <Textarea id="cat_description_ar" name="description_ar" />
                      </div>
                      <div>
                        <Label htmlFor="cat_description_en">الوصف (إنجليزي)</Label>
                        <Textarea id="cat_description_en" name="description_en" />
                      </div>
                    </div>
                    
                    <ImageUpload 
                      onImagesChange={setCategoryImage}
                      initialImages={categoryImage}
                    />
                    
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setShowAddCategory(false)}>
                        إلغاء
                      </Button>
                      <Button type="submit" className="btn-primary">
                        إضافة الفئة
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              {/* تعديل الفئة */}
              <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>تعديل الفئة</DialogTitle>
                  </DialogHeader>
                  {editingCategory && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleUpdateCategory(new FormData(e.currentTarget));
                      }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_cat_name_ar">اسم الفئة (عربي)</Label>
                          <Input id="edit_cat_name_ar" name="name_ar" defaultValue={editingCategory.name_ar} required />
                        </div>
                        <div>
                          <Label htmlFor="edit_cat_name_en">اسم الفئة (إنجليزي)</Label>
                          <Input id="edit_cat_name_en" name="name_en" defaultValue={editingCategory.name_en} />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit_cat_description_ar">الوصف (عربي)</Label>
                          <Textarea id="edit_cat_description_ar" name="description_ar" defaultValue={editingCategory.description_ar || ''} />
                        </div>
                        <div>
                          <Label htmlFor="edit_cat_description_en">الوصف (إنجليزي)</Label>
                          <Textarea id="edit_cat_description_en" name="description_en" />
                        </div>
                      </div>
                      
                      <ImageUpload 
                        onImagesChange={setCategoryImage}
                        initialImages={categoryImage}
                      />
                      
                      <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                          إلغاء
                        </Button>
                        <Button type="submit" className="btn-primary">
                          تحديث الفئة
                        </Button>
                      </div>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="card-elegant">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{category.name_ar}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description_ar || 'لا يوجد وصف'}
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* إدارة الطلبات */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-semibold">إدارة الطلبات</h2>
            <Card className="card-elegant">
              <CardContent className="p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">لا توجد طلبات بعد</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id.slice(0, 8)}</TableCell>
                          <TableCell>{order.total_amount} ريال</TableCell>
                          <TableCell>
                            <Badge>{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              عرض التفاصيل
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* الإعدادات */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-semibold">إعدادات المتجر</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>معلومات المتجر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="store_name">اسم المتجر</Label>
                    <Input id="store_name" defaultValue="متجر إلكتروني" />
                  </div>
                  <div>
                    <Label htmlFor="store_description">وصف المتجر</Label>
                    <Textarea id="store_description" placeholder="وصف المتجر..." />
                  </div>
                  <div>
                    <Label htmlFor="store_email">البريد الإلكتروني</Label>
                    <Input id="store_email" type="email" placeholder="store@example.com" />
                  </div>
                  <div>
                    <Label htmlFor="store_phone">رقم الهاتف</Label>
                    <Input id="store_phone" placeholder="+966 50 123 4567" />
                  </div>
                  <Button className="btn-primary w-full">
                    حفظ التغييرات
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>إعدادات الشحن</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="shipping_cost">تكلفة الشحن (ريال)</Label>
                    <Input id="shipping_cost" type="number" defaultValue="25" />
                  </div>
                  <div>
                    <Label htmlFor="free_shipping_limit">الشحن المجاني عند (ريال)</Label>
                    <Input id="free_shipping_limit" type="number" defaultValue="200" />
                  </div>
                  <div>
                    <Label htmlFor="delivery_time">مدة التوصيل (يوم)</Label>
                    <Select defaultValue="3-5">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 أيام</SelectItem>
                        <SelectItem value="3-5">3-5 أيام</SelectItem>
                        <SelectItem value="5-7">5-7 أيام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="btn-primary w-full">
                    حفظ إعدادات الشحن
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>إعدادات الدفع</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>طرق الدفع المقبولة</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="cash" defaultChecked />
                        <Label htmlFor="cash">الدفع عند الاستلام</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="card" />
                        <Label htmlFor="card">البطاقة الائتمانية</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="bank" />
                        <Label htmlFor="bank">التحويل البنكي</Label>
                      </div>
                    </div>
                  </div>
                  <Button className="btn-primary w-full">
                    حفظ إعدادات الدفع
                  </Button>
                </CardContent>
              </Card>

              <Card className="card-elegant">
                <CardHeader>
                  <CardTitle>إحصائيات المتجر</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{stats.totalProducts}</p>
                      <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.totalOrders}</p>
                      <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalRevenue.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">إجمالي المبيعات (ريال)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{categories.length}</p>
                      <p className="text-sm text-muted-foreground">عدد الفئات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
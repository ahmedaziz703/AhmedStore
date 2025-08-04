import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { ShoppingCart, Heart, Sun, Moon, User, LogOut, Settings, Package, Menu, X } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // الاستماع لتغييرات المصادقة أولاً
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthLoading(false);
      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.user_metadata?.full_name
        };
        setUser(userData);
        // تأجيل جلب عدد السلة لتجنب التعارض
        setTimeout(() => {
          fetchCartCount(session.user.id);
        }, 0);
      } else {
        setUser(null);
        setCartCount(0);
      }
    });

    // التحقق من الجلسة الحالية
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthLoading(false);
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            full_name: session.user.user_metadata?.full_name
          };
          setUser(userData);
          fetchCartCount(session.user.id);
        }
      } catch (error) {
        console.error('خطأ في تهيئة المصادقة:', error);
        setIsAuthLoading(false);
      }
    };

    initializeAuth();

    return () => subscription.unsubscribe();
  }, []);

  const fetchCartCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('quantity')
        .eq('user_id', userId);

      if (error) throw error;

      const total = data.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(total);
    } catch (error) {
      console.error('خطأ في جلب عدد المنتجات في السلة:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "نراك قريباً!",
      });
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  const checkUserRole = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      return !error && data;
    } catch {
      return false;
    }
  };

  const handleAdminAccess = async () => {
    const isAdmin = await checkUserRole();
    if (isAdmin) {
      navigate('/admin');
    } else {
      toast({
        title: "غير مصرح",
        description: "ليس لديك صلاحية للوصول لهذه الصفحة",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <h1 
            className="text-xl md:text-2xl font-bold text-gradient cursor-pointer"
            onClick={() => navigate('/')}
          >
            المتجر العربي الأصيل
          </h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Button variant="ghost" onClick={() => navigate('/')}>
            الرئيسية
          </Button>
          <Button variant="ghost" onClick={() => navigate('/favorites')}>
            المفضلة
          </Button>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            المنتجات
          </Button>
          <Button variant="ghost" onClick={() => navigate('/about')}>
            عن المتجر
          </Button>
          <Button variant="ghost" onClick={() => navigate('/contact')}>
            اتصل بنا
          </Button>
        </nav>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/favorites')}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Heart className="h-5 w-5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/cart')}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <Badge variant="secondary" className="mr-1">
                {cartCount}
              </Badge>
            )}
          </Button>
          
          {isAuthLoading ? (
            <div className="w-8 h-8 animate-pulse bg-muted rounded" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-semibold">{user.full_name || 'المستخدم'}</p>
                  <p className="text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="h-4 w-4 ml-2" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/favorites')}>
                  <Heart className="h-4 w-4 ml-2" />
                  المفضلة
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/profile?tab=orders')}>
                  <Package className="h-4 w-4 ml-2" />
                  طلباتي
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAdminAccess}>
                  <Settings className="h-4 w-4 ml-2" />
                  لوحة الإدارة
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 ml-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              className="btn-primary btn-arabic"
              onClick={() => navigate('/auth')}
            >
              تسجيل الدخول
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="container py-4 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-right"
              onClick={() => {
                navigate('/');
                setIsMobileMenuOpen(false);
              }}
            >
              الرئيسية
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-right"
              onClick={() => {
                navigate('/products');
                setIsMobileMenuOpen(false);
              }}
            >
              المنتجات
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-right"
              onClick={() => {
                navigate('/favorites');
                setIsMobileMenuOpen(false);
              }}
            >
              المفضلة
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-right"
              onClick={() => {
                navigate('/about');
                setIsMobileMenuOpen(false);
              }}
            >
              عن المتجر
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-right"
              onClick={() => {
                navigate('/contact');
                setIsMobileMenuOpen(false);
              }}
            >
              اتصل بنا
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

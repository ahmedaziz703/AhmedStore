import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-primary">
      <Header />
      
      <div className="container py-20">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Card className="card-elegant max-w-lg mx-auto">
            <CardContent className="p-8">
              <div className="text-6xl font-bold text-primary mb-4">404</div>
              <h1 className="text-2xl font-bold mb-4">الصفحة غير موجودة</h1>
              <p className="text-muted-foreground mb-8">
                عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مكان آخر.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/">
                  <Button className="btn-primary btn-arabic">
                    <Home className="h-4 w-4 ml-2" />
                    العودة للرئيسية
                  </Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline" className="btn-arabic">
                    <Search className="h-4 w-4 ml-2" />
                    تصفح المنتجات
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
            <Link to="/" className="group">
              <Card className="card-elegant hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Home className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">الصفحة الرئيسية</h3>
                  <p className="text-sm text-muted-foreground">
                    اكتشف أحدث المنتجات والعروض
                  </p>
                  <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 group-hover:transform group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/products" className="group">
              <Card className="card-elegant hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <Search className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">المنتجات</h3>
                  <p className="text-sm text-muted-foreground">
                    تصفح جميع المنتجات المتاحة
                  </p>
                  <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 group-hover:transform group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/auth" className="group">
              <Card className="card-elegant hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-primary font-bold">👤</span>
                  </div>
                  <h3 className="font-semibold mb-2">تسجيل الدخول</h3>
                  <p className="text-sm text-muted-foreground">
                    قم بتسجيل الدخول لحسابك
                  </p>
                  <ArrowRight className="h-4 w-4 text-primary mx-auto mt-3 group-hover:transform group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
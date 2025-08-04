import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Award, Heart } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold text-foreground mb-4">عن متجرنا</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نحن متجر إلكتروني متخصص في تقديم أفضل المنتجات بأعلى جودة وأسعار منافسة
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  رؤيتنا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  أن نكون المتجر الإلكتروني الرائد في المنطقة، نقدم تجربة تسوق متميزة تلبي احتياجات عملائنا وتفوق توقعاتهم
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-6 w-6 text-primary" />
                  مهمتنا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  تقديم منتجات عالية الجودة بأسعار مناسبة مع خدمة عملاء استثنائية وتجربة تسوق آمنة ومريحة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                قيمنا
              </CardTitle>
              <CardDescription>المبادئ التي نلتزم بها في عملنا</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <Badge variant="secondary" className="mb-2">الجودة</Badge>
                  <p className="text-sm text-muted-foreground">نختار منتجاتنا بعناية فائقة</p>
                </div>
                <div className="text-center p-4">
                  <Badge variant="secondary" className="mb-2">الثقة</Badge>
                  <p className="text-sm text-muted-foreground">نبني علاقات طويلة الأمد مع عملائنا</p>
                </div>
                <div className="text-center p-4">
                  <Badge variant="secondary" className="mb-2">السرعة</Badge>
                  <p className="text-sm text-muted-foreground">توصيل سريع وآمن</p>
                </div>
                <div className="text-center p-4">
                  <Badge variant="secondary" className="mb-2">الابتكار</Badge>
                  <p className="text-sm text-muted-foreground">نتطور باستمرار لنخدمكم أفضل</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                فريقنا
              </CardTitle>
              <CardDescription>نحن فريق متخصص ومتحمس لخدمتكم</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                يضم فريقنا مجموعة من المتخصصين في التجارة الإلكترونية وخدمة العملاء، 
                نعمل بجد لضمان حصولكم على أفضل تجربة تسوق ممكنة. نحن متاحون دائماً 
                للإجابة على استفساراتكم ومساعدتكم في اختيار المنتجات المناسبة.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
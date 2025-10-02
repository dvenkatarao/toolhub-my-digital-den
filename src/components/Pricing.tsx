import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlanClick = (planName: string) => {
    if (planName === "Free Forever") {
      navigate(user ? '/dashboard' : '/auth/signup');
    } else {
      navigate(user ? '/dashboard/subscription' : '/auth/signup');
    }
  };

  const plans = [
    {
      name: "Free Forever",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with essential productivity tools",
      badge: null,
      features: [
        "Link Shortener with custom domains",
        "QR Code Generator",
        "Encrypted Text Sharing",
        "Temporary Email Addresses",
        "Image Compression",
        "Basic PDF Tools",
        "Community Support"
      ],
      cta: "Get Started Free",
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Personal Pro",
      price: "$9.99",
      period: "month",
      description: "Everything you need for complete digital productivity",
      badge: "Most Popular",
      features: [
        "Everything in Free",
        "Password Manager with sync",
        "Personal Cloud Storage (10GB)",
        "Advanced PDF Tools",
        "Priority Support",
        "Custom Branding",
        "Export & Backup",
        "Advanced Analytics"
      ],
      cta: "Start 14-Day Free Trial",
      variant: "default" as const,
      popular: true
    }
  ];

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4 bg-accent/10 text-accent border-accent/20">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Choose what works for 
            <span className="bg-gradient-hero bg-clip-text text-transparent"> your lifestyle</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            No hidden fees, no complex tiers. Start free and upgrade when you need more power.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative ${plan.popular ? 'border-primary shadow-elegant scale-105' : 'border-border/50'} hover:shadow-elegant transition-all duration-300`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-primary text-primary-foreground shadow-primary">
                    <Sparkles size={12} className="mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl lg:text-5xl font-bold text-foreground">{plan.price}</span>
                      {plan.period !== "forever" && (
                        <span className="text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Features */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-primary hover:opacity-90 shadow-primary' 
                        : 'border-primary/20 text-primary hover:bg-primary/5'
                    }`}
                    variant={plan.variant}
                    size="lg"
                    onClick={() => handlePlanClick(plan.name)}
                  >
                    <Zap size={16} className="mr-2" />
                    {plan.cta}
                  </Button>

                  {plan.popular && (
                    <p className="text-xs text-center text-muted-foreground">
                      No credit card required • Cancel anytime
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="mt-16 text-center">
          <div className="bg-card rounded-2xl p-8 max-w-4xl mx-auto border border-border/50">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Save hundreds compared to individual tools
            </h3>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Individual apps</p>
                <p className="text-2xl font-bold text-destructive line-through">$34.99/month</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">ToolHub Personal Pro</p>
                <p className="text-2xl font-bold text-primary">$9.99/month</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">You save</p>
                <p className="text-2xl font-bold text-accent">$300/year</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Plus the peace of mind that comes with privacy-first design and seamless integration.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
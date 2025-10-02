import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Link, 
  Shield, 
  Mail, 
  Image as ImageIcon, 
  FileText, 
  Key, 
  Cloud,
  ArrowRight
} from "lucide-react";

const Features = () => {
  const freeFeatures = [
    {
      icon: Link,
      name: "Link Shortener",
      description: "Share cleaner links",
      detail: "Transform long URLs into memorable short links with QR codes and click tracking."
    },
    {
      icon: Shield,
      name: "Encrypted Text",
      description: "Send secrets safely",
      detail: "Share sensitive information with end-to-end encryption and auto-expiration."
    },
    {
      icon: Mail,
      name: "Temporary Email",
      description: "Protect your inbox",
      detail: "Generate disposable email addresses to avoid spam and protect your privacy."
    },
    {
      icon: ImageIcon,
      name: "Image Compressor",
      description: "Optimize photos instantly",
      detail: "Reduce file sizes without losing quality. Perfect for web and social media."
    },
    {
      icon: FileText,
      name: "PDF Tools",
      description: "Handle documents easily",
      detail: "Merge, split, compress, and convert PDFs. All processing happens locally."
    }
  ];

  const premiumFeatures = [
    {
      icon: Key,
      name: "Password Manager",
      description: "Secure all your accounts",
      detail: "Generate strong passwords and store them securely with biometric access."
    },
    {
      icon: Cloud,
      name: "Personal Cloud",
      description: "Your files, your control",
      detail: "Private cloud storage with client-side encryption and seamless sync."
    }
  ];

  const FeatureCard = ({ feature, isPremium = false }: { feature: any, isPremium?: boolean }) => (
    <Card className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-xl ${isPremium ? 'bg-gradient-accent' : 'bg-gradient-primary'} shadow-lg`}>
            <feature.icon size={24} className="text-white" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-foreground">{feature.name}</h3>
              {isPremium && (
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20 text-xs">
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-accent font-medium">{feature.description}</p>
            <p className="text-sm text-muted-foreground">{feature.detail}</p>
          </div>
          <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-primary/20">
            Essential Tools
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Everything you need for 
            <span className="bg-gradient-hero bg-clip-text text-transparent"> digital productivity</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            No more juggling between different apps. All your essential tools in one secure, privacy-focused platform.
          </p>
        </div>

        {/* Free Features */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Free Forever
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} />
            ))}
          </div>
        </div>

        {/* Premium Features */}
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Unlock More with Personal Pro
          </h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {premiumFeatures.map((feature, index) => (
              <FeatureCard key={index} feature={feature} isPremium />
            ))}
          </div>
        </div>

        {/* Privacy Callout */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-subtle rounded-2xl p-8 max-w-4xl mx-auto border border-border/50">
            <Shield size={48} className="text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-foreground mb-4">Privacy by Design</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Your data stays private. Most tools work entirely in your browser, and when server processing is needed, 
              we use zero-knowledge encryption. No tracking, no data mining, no surprises.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>End-to-end encryption</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Zero data collection</span>
              </div>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Open source core</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
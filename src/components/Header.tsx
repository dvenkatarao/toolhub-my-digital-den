import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="text-xl font-bold text-foreground">ToolHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#help" className="text-muted-foreground hover:text-foreground transition-colors">
              Help
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-24 h-9 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button onClick={signOut} variant="outline">
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Link to="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-primary hover:opacity-90 shadow-primary">
                  <Link to="/auth/signup">Get Started Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col space-y-4 mt-4">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Features
              </a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Pricing
              </a>
              <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Privacy
              </a>
              <a href="#help" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Help
              </a>
              <div className="flex flex-col space-y-2 pt-4">
                {loading ? (
                  <div className="w-full h-9 bg-muted animate-pulse rounded-md" />
                ) : user ? (
                  <>
                    <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground justify-start">
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                    <Button onClick={signOut} variant="outline">
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground justify-start">
                      <Link to="/auth/signin">Sign In</Link>
                    </Button>
                    <Button asChild className="bg-gradient-primary hover:opacity-90 shadow-primary">
                      <Link to="/auth/signup">Get Started Free</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
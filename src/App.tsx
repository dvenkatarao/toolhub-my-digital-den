import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/DashboardHome";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ProtectedRoute from "./components/ProtectedRoute";
import LinkShortener from "./pages/tools/LinkShortener";
import TempEmail from "./pages/tools/TempEmail";
import EncryptedText from "./pages/tools/EncryptedText";
import Calculators from "./pages/tools/Calculators";
import ClocksTimers from "./pages/tools/ClocksTimer";
import ToolPlaceholder from "./pages/tools/ToolPlaceholder";
import { Mail, Shield, FileImage, FileText, Lock, Cloud, FolderOpen, Image as ImageIcon, Calculator, Settings } from "lucide-react";
import Subscription from "./pages/Subscription";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/signin" element={<SignIn />} />
              <Route path="/auth/signup" element={<SignUp />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="link-shortener" element={<LinkShortener />} />
                <Route path="encrypted-text" element={<EncryptedText />} />
                <Route path="temp-email" element={<TempEmail />} />
                <Route path="calculators" element={<Calculators />} />
                <Route path="clocks-timers" element={<ClocksTimers />} />                
                <Route path="image-compressor" element={<ToolPlaceholder title="Image Compressor" description="Compress images without losing quality" icon={FileImage} />} />
                <Route path="pdf-converter" element={<ToolPlaceholder title="PDF Converter" description="Convert files to and from PDF" icon={FileText} />} />
                <Route path="password-manager" element={<ToolPlaceholder title="Password Manager" description="Securely store and manage passwords" icon={Lock} />} />
                <Route path="personal-cloud" element={<ToolPlaceholder title="Personal Cloud" description="Your private cloud storage" icon={Cloud} />} />
                <Route path="document-manager" element={<ToolPlaceholder title="Document Manager" description="Organize and manage documents" icon={FolderOpen} />} />
                <Route path="photo-library" element={<ToolPlaceholder title="Photo Library" description="Store and organize your photos" icon={ImageIcon} />} />
                <Route path="mortgage-calculator" element={<ToolPlaceholder title="Mortgage Calculator" description="Calculate mortgage payments and rates" icon={Calculator} />} />
                <Route path="settings" element={<ToolPlaceholder title="Settings" description="Manage your account settings" icon={Settings} />} />
                <Route path="subscription" element={<Subscription />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

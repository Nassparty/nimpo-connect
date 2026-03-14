import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import AuthPage from "./pages/Auth";
import FeedPage from "./pages/Feed";
import CreatePage from "./pages/Create";
import MessagesPage from "./pages/Messages";
import ChatPage from "./pages/Chat";
import NotificationsPage from "./pages/Notifications";
import ProfilePage from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-nimpo-surface">
        <div className="w-10 h-10 rounded-outer bg-nimpo-brand flex items-center justify-center animate-pulse">
          <span className="text-lg font-bold text-primary-foreground">N</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<FeedPage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:id" element={<ChatPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

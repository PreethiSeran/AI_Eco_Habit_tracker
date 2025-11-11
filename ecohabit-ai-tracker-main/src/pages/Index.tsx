import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, TrendingUp, Heart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-primary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
            <Leaf className="h-16 w-16 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            EcoHabit
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your personal companion for building sustainable habits and making a positive impact on our planet
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" onClick={handleGetStarted} className="text-lg">
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-12">
            <div className="space-y-3 p-6 rounded-lg bg-card border">
              <div className="inline-flex p-2 rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Track Your Progress</h3>
              <p className="text-muted-foreground text-sm">
                Monitor your daily habits and watch your eco-friendly streak grow
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg bg-card border">
              <div className="inline-flex p-2 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">AI Motivation</h3>
              <p className="text-muted-foreground text-sm">
                Get personalized encouragement when you complete each habit
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-lg bg-card border">
              <div className="inline-flex p-2 rounded-full bg-primary/10">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Make an Impact</h3>
              <p className="text-muted-foreground text-sm">
                Small daily actions add up to significant environmental change
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

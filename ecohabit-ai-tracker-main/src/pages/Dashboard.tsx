import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Leaf, Plus, LogOut, TrendingUp, CheckCircle2 } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

interface Habit {
  id: string;
  habit_name: string;
  description: string;
  category: string;
}

interface Completion {
  id: string;
  habit_id: string;
  completed_at: string;
}

interface Profile {
  streak_count: number;
  name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingHabit, setCompletingHabit] = useState<string | null>(null);

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      });

      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (!session) {
        navigate("/auth");
      }

      return () => subscription.unsubscribe();
    };

    setupAuth();
  }, [navigate]);

  useEffect(() => {
    if (session?.user) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    if (!session?.user) return;

    try {
      const [habitsRes, completionsRes, profileRes] = await Promise.all([
        supabase.from("habits").select("*").eq("user_id", session.user.id),
        supabase.from("completions").select("*").eq("user_id", session.user.id),
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
      ]);

      if (habitsRes.data) setHabits(habitsRes.data);
      if (completionsRes.data) setCompletions(completionsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isCompletedToday = (habitId: string) => {
    const today = new Date().toDateString();
    return completions.some(
      (c) =>
        c.habit_id === habitId &&
        new Date(c.completed_at).toDateString() === today
    );
  };

  const handleCompleteHabit = async (habit: Habit) => {
    if (!session?.user) return;
    
    setCompletingHabit(habit.id);

    try {
      const { error } = await supabase.from("completions").insert({
        habit_id: habit.id,
        user_id: session.user.id,
        status: "done",
      });

      if (error) throw error;

      const motivationRes = await supabase.functions.invoke("generate-motivation", {
        body: { habitName: habit.habit_name },
      });

      if (motivationRes.data?.motivation) {
        toast.success(motivationRes.data.motivation, {
          duration: 5000,
          icon: <Leaf className="h-5 w-5 text-primary" />,
        });
      }

      await fetchData();
    } catch (error: any) {
      toast.error("Failed to complete habit");
      console.error(error);
    } finally {
      setCompletingHabit(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const todayCompletions = completions.filter(
    (c) => new Date(c.completed_at).toDateString() === new Date().toDateString()
  ).length;

  const completionRate = habits.length > 0
    ? Math.round((todayCompletions / habits.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Leaf className="h-12 w-12 text-primary animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading your eco journey...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/10">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">EcoHabit</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Welcome back, {profile?.name || "Eco Warrior"}!</h2>
            <p className="text-muted-foreground mt-1">Keep up your sustainable journey</p>
          </div>
          <Button onClick={() => navigate("/add-habit")} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Add Habit
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.streak_count || 0} days</div>
              <p className="text-xs text-muted-foreground">Keep it going!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCompletions}/{habits.length}</div>
              <Progress value={completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
              <Leaf className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{habits.length}</div>
              <p className="text-xs text-muted-foreground">Making a difference</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today's Habits</CardTitle>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <Leaf className="h-12 w-12 text-muted-foreground/50 mx-auto" />
                <div>
                  <p className="text-muted-foreground">No habits yet!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Start your sustainable journey by adding your first habit
                  </p>
                </div>
                <Button onClick={() => navigate("/add-habit")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Habit
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => {
                  const completed = isCompletedToday(habit.id);
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium flex items-center gap-2">
                          {habit.habit_name}
                          {completed && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {habit.description}
                        </p>
                        <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {habit.category}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleCompleteHabit(habit)}
                        disabled={completed || completingHabit === habit.id}
                        variant={completed ? "outline" : "default"}
                        size="sm"
                      >
                        {completingHabit === habit.id
                          ? "Completing..."
                          : completed
                          ? "Completed"
                          : "Complete"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

"use client";

import { useState } from "react";
import { User, Settings, LogOut, Award, Clock, Target } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient as createSupabaseClient } from "@/utils/supabase/client";

export default function ProfilePageContent() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6 space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account and view progress"
      />

      {/* User Identity Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-600 text-xl font-bold text-primary-foreground shadow-glow-primary">
              N
            </div>
            <div>
              <h2 className="text-lg font-semibold">Nama User</h2>
              <p className="text-sm text-muted-foreground">user@signify.ai</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success border border-success/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Target className="h-4 w-4 text-primary" />
              Practice Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Translation Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0m</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Award className="h-4 w-4 text-primary" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Open Settings
        </Button>
        <Button
          variant="ghost"
          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
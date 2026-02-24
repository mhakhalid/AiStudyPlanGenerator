"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CornerElements from "@/components/CornerElements";
import ProfileHeader from "@/components/ProfileHeader";

const ProfilePage = () => {
  const { user } = useUser();

  return (
    <section className="relative z-10 pt-12 pb-32 flex-grow container mx-auto px-4">
      <ProfileHeader user={user} />

      <div className="relative backdrop-blur-sm border border-border p-6 mt-8 max-w-md">
        <CornerElements />
        <h2 className="text-lg font-bold font-mono mb-2">
          <span className="text-primary">Study</span>{" "}
          <span className="text-foreground">Planner</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your assessments, add topics, and generate AI study plans.
        </p>
        <Button asChild className="font-mono">
          <Link href="/planner">Open Planner</Link>
        </Button>
      </div>
    </section>
  );
};

export default ProfilePage;

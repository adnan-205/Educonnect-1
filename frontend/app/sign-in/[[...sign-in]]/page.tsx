"use client";

import { SignIn, useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function Page() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  

  if (!isLoaded) return null;

  // If a Clerk session exists, don't auto-render <SignIn/> (it would immediately redirect).
  // Show a small gate with Continue or Switch account.
  if (isSignedIn) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-md w-full space-y-4 text-center">
          <div className="text-lg font-medium">You're already signed in</div>
          <div className="text-sm text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress || user?.username || user?.id}
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button onClick={() => router.replace("/post-auth")}>Continue</Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await signOut();
                } catch {}
                router.replace("/sign-in");
              }}
            >
              Switch account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="space-y-4 flex flex-col items-center">
        <SignIn routing="path" path="/sign-in" fallbackRedirectUrl="/post-auth" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { normalizeEmail, getInviteByToken } from "@/lib/invite-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { acceptInviteFromLanding, declineInviteFromLanding } from "./actions";

export default async function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await getInviteByToken(token);

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Invite not found</CardTitle>
              <CardDescription>
                The invite link is invalid or has been removed.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const isExpired = invite.isExpired;
  const nextPath = `/invite/${token}`;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const normalizedInviteEmail = normalizeEmail(invite.invitedEmail);
  const normalizedUserEmail = user?.email ? normalizeEmail(user.email) : null;
  const isEmailMismatch =
    !!normalizedUserEmail && normalizedUserEmail !== normalizedInviteEmail;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Sheet Invitation</CardTitle>
            <CardDescription>
              You were invited to <strong>{invite.sheetName}</strong> as{" "}
              <strong className="capitalize">{invite.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Invited email: <strong>{invite.invitedEmail}</strong>
            </div>

            {invite.status !== "pending" ? (
              <div className="text-sm">
                This invite is no longer active (status:{" "}
                <span className="capitalize">{invite.status}</span>).
              </div>
            ) : isExpired ? (
              <div className="text-sm">This invite has expired.</div>
            ) : !user ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="w-full sm:flex-1 sm:min-w-0">
                  <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
                    Log In
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:flex-1 sm:min-w-0"
                >
                  <Link href={`/signup?next=${encodeURIComponent(nextPath)}`}>
                    Sign Up
                  </Link>
                </Button>
              </div>
            ) : isEmailMismatch ? (
              <div className="space-y-3">
                <p className="text-sm">
                  You are logged in as <strong>{user.email}</strong>, but this
                  invite is for <strong>{invite.invitedEmail}</strong>.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <form
                    action="/auth/signout"
                    method="post"
                    className="sm:flex-1 sm:min-w-0"
                  >
                    <Button type="submit" variant="outline" className="w-full">
                      Sign Out
                    </Button>
                  </form>
                  <Button asChild className="w-full sm:flex-1 sm:min-w-0">
                    <Link href={`/login?next=${encodeURIComponent(nextPath)}`}>
                      Switch Account
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <form
                  action={declineInviteFromLanding}
                  className="w-full sm:flex-1 sm:min-w-0"
                >
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" variant="outline" className="w-full">
                    Decline
                  </Button>
                </form>
                <form
                  action={acceptInviteFromLanding}
                  className="w-full sm:flex-1 sm:min-w-0"
                >
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" className="w-full">
                    Accept
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CreateSheetDialog } from "./create-sheet-dialog";
import { SheetSelectorContent } from "./sheet-selector-content";

export default async function SheetSelectorPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Your Sheets</h1>
          <p className="text-muted-foreground text-sm">
            Select a sheet to manage
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="sm">
            Sign Out
          </Button>
        </form>
      </header>

      <SheetSelectorContent />

      <CreateSheetDialog />
    </div>
  );
}

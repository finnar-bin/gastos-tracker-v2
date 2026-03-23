"use client";

import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { CategoryList } from "./category-list";

export function CategorySettingsClient({
  sheetId,
  sheetName,
  canAddCategory,
  canEditCategory,
}: {
  sheetId: string;
  sheetName: string;
  canAddCategory: boolean;
  canEditCategory: boolean;
}) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6 pb-24">
      <Header
        title="Categories"
        sheetId={sheetId}
        backHref={`/sheet/${sheetId}/settings`}
        icon={ArrowLeft}
        subtitle={sheetName}
        actions={
          canAddCategory ? (
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add
            </Button>
          ) : null
        }
      />

      <CategoryList
        sheetId={sheetId}
        canAddCategory={canAddCategory}
        canEditCategory={canEditCategory}
        addDialogOpen={addDialogOpen}
        onAddDialogOpenChange={setAddDialogOpen}
      />
    </div>
  );
}

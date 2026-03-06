import { createHash } from "crypto";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<UserAvatarSize, string> = {
  xs: "h-4 w-4",
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

type UserAvatarProps = {
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  alt?: string;
  size?: UserAvatarSize;
  className?: string;
};

function getGravatarUrl(email: string) {
  const hash = createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=mp`;
}

function getFallbackCharacter(displayName?: string | null, email?: string | null) {
  const value = (displayName || email || "").trim();
  return value ? value.charAt(0).toUpperCase() : "?";
}

export function UserAvatar({
  email,
  displayName,
  avatarUrl,
  alt,
  size = "md",
  className,
}: UserAvatarProps) {
  const resolvedSrc = avatarUrl || (email ? getGravatarUrl(email) : undefined);
  const resolvedAlt = alt || displayName || email || "User avatar";
  const fallbackChar = getFallbackCharacter(displayName, email);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={resolvedSrc} alt={resolvedAlt} />
      <AvatarFallback>{fallbackChar}</AvatarFallback>
    </Avatar>
  );
}

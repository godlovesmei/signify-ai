"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { getAvatarAppearance, getAvatarInitial } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export interface AutoAvatarProps {
  name: string | null | undefined;
  email?: string | null;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  style?: CSSProperties;
}

export function AutoAvatar({
  name,
  email,
  avatarUrl,
  className,
  imageClassName,
  fallbackClassName,
  style,
}: AutoAvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const displayName = name?.trim() || email?.split("@")[0]?.trim() || "User";
  const imageUrl = avatarUrl?.trim() || null;
  const appearance = useMemo(
    () => getAvatarAppearance(displayName, email),
    [displayName, email]
  );

  const showImage = Boolean(imageUrl && failedImageUrl !== imageUrl);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden border font-bold",
        className
      )}
      style={{
        backgroundColor: appearance.backgroundColor,
        borderColor: appearance.borderColor,
        color: appearance.color,
        ...style,
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl ?? undefined}
          alt=""
          className={cn("size-full object-cover", imageClassName)}
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(imageUrl)}
        />
      ) : (
        <span className={fallbackClassName}>
          {getAvatarInitial(displayName, email)}
        </span>
      )}
    </div>
  );
}

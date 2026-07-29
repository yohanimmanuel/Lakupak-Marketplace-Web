import Image from "next/image";

type Props = {
  /** `onDark` = white wordmark; `onLight` = blue wordmark for white backgrounds. */
  variant?: "onDark" | "onLight";
  className?: string;
  priority?: boolean;
};

/** Official Laku wordmark from /public (replaces the old Store + "Laku" text mark). */
export default function LakuLogo({
  variant = "onDark",
  className = "h-8 w-auto",
  priority = false,
}: Props) {
  const src =
    variant === "onLight" ? "/LakuTextLogo.svg" : "/LakuWTextLogo.svg";

  return (
    <Image
      src={src}
      alt="Laku"
      width={141}
      height={50}
      className={className}
      priority={priority}
    />
  );
}

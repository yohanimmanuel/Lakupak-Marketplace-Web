import Image from "next/image";

type Props = {
  /** `onDark` = white wordmark; `onLight` = blue wordmark for white backgrounds. */
  variant?: "onDark" | "onLight";
  className?: string;
  priority?: boolean;
};

/** Official Lakupak wordmark — white on dark surfaces, blue on light. */
export default function LakuLogo({
  variant = "onDark",
  className = "h-8 w-auto",
  priority = false,
}: Props) {
  const src = variant === "onLight" ? "/Lakupak!.svg" : "/LakupakWhite.svg";

  return (
    <Image
      src={src}
      alt="Lakupak"
      width={180}
      height={42}
      className={className}
      priority={priority}
    />
  );
}

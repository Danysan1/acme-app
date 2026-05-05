import { Work_Sans } from "next/font/google";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-work-sans",
});

export default function RetroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${workSans.variable} min-h-screen`}
      style={{ fontFamily: "var(--font-work-sans), sans-serif" }}
    >
      {children}
    </div>
  );
}

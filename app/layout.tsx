import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TESTPREP | Online MCQ Exam & Quiz Platform",
  description: "Distraction-free academic online MCQ exam and quiz platform with real-time leaderboard and detailed question explanations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}

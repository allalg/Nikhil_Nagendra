import type { Metadata, Viewport } from "next";
import { Geist, Architects_Daughter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const architectsDaughter = Architects_Daughter({
  weight: "400",
  variable: "--font-architects-daughter",
  subsets: ["latin"],
});

// User's personal handwriting font — used for intimate annotations and side-notes
const myFont = localFont({
  src: "../My_font/Myfont-Regular.ttf",
  variable: "--font-myfont",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nikhil Nagendra — Portfolio",
  description:
    "An immersive cave portfolio. Systems thinker, builder, and explorer at the intersection of AI, medicine, and finance. Explore with a torch.",
  keywords: [
    "Nikhil Nagendra",
    "Portfolio",
    "AI",
    "Systems Engineer",
    "Full Stack",
    "Computer Science",
  ],
  authors: [{ name: "Nikhil Nagendra" }],
  openGraph: {
    title: "Nikhil Nagendra — Portfolio",
    description: "The cave you fear to enter holds the treasure you seek.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${architectsDaughter.variable} ${myFont.variable} h-full w-full bg-black antialiased overflow-hidden`}
    >
      <body className="h-full w-full bg-black text-neutral-200 overflow-hidden select-none p-0 m-0">
        {children}
      </body>
    </html>
  );
}

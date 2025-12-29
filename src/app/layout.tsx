import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { logout } from "./auth/actions";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Makas - Plataforma de Juegos",
  description: "Juega juegos multijugador en tiempo real.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <header className="border-b">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tighter">
              MAKAS
            </Link>
            <nav className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Hola, {user.user_metadata.username || user.email}
                  </span>
                  <form action={logout}>
                    <Button variant="outline" size="sm" type="submit">
                      Salir
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/login">Iniciar Sesión</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth/register">Registrarse</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
import Link from 'next/link'
import { signup } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function RegisterPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>
            Únete a Makas para empezar a jugar.
          </CardDescription>
        </CardHeader>
        <form action={signup}>
          <CardContent className="space-y-4">
            {searchParams.error && (
              <p className="text-sm font-medium text-destructive">
                {searchParams.error}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input
                id="username"
                name="username"
                placeholder="jugador123"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full">
              Registrarse
            </Button>
            <div className="text-center text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link href="/auth/login" className="underline underline-offset-4">
                Inicia sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

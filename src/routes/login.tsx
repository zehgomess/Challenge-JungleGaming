import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useSession } from '@/store/session'
import { toast } from 'sonner'
import { consumeResumePath } from '@/lib/auth'

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

type LoginSearch = {
  returnTo?: string
}

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const { returnTo } = Route.useSearch()
  const { login } = useSession()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.data.token, data.data.user)
      toast.success('Bem-vindo de volta!')
      const destination = returnTo || consumeResumePath() || '/'
      navigate({ to: destination as never })
    },
    onError: () => {
      toast.error('E-mail ou senha inválidos')
    },
  })

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>Acesse sua conta de colecionador</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && <p id="login-email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                {...register('password')}
              />
              {errors.password && <p id="login-password-error" role="alert" className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">Credenciais fictícias: collector@jungle.io / password123</p>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <p className="text-sm text-text">
            Não tem uma conta?{' '}
            <Link to="/register" search={{ returnTo }} className="text-text-h underline">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

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

const registerSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Senhas não coincidem',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

type RegisterSearch = { returnTo?: string }

export const Route = createFileRoute('/register')({
  validateSearch: (search: Record<string, unknown>): RegisterSearch => ({
    returnTo: typeof search.returnTo === 'string' ? search.returnTo : undefined,
  }),
  component: Register,
})

function Register() {
  const navigate = useNavigate()
  const { returnTo } = Route.useSearch()
  const { login } = useSession()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const mutation = useMutation({
    mutationFn: (data: RegisterFormData) =>
      authApi.register({ name: data.name, email: data.email, password: data.password }),
    onSuccess: (data) => {
      login(data.data.token, data.data.user)
      toast.success('Conta criada com sucesso!')
      const destination = returnTo || consumeResumePath() || '/'
      navigate({ to: destination as never })
    },
    onError: (error: unknown) => {
      if ((error as { response?: { status?: number } })?.response?.status === 409) {
        toast.error('E-mail já cadastrado')
      } else {
        toast.error('Erro ao criar conta')
      }
    },
  })

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Junte-se ao marketplace de NFTs</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'register-name-error' : undefined}
                {...register('name')}
              />
              {errors.name && <p id="register-name-error" role="alert" className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'register-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && <p id="register-email-error" role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'register-password-error' : undefined}
                {...register('password')}
              />
              {errors.password && <p id="register-password-error" role="alert" className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p id="register-confirm-error" role="alert" className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Criando...' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 text-center">
          <p className="text-sm text-text">
            Já tem uma conta?{' '}
            <Link to="/login" search={{ returnTo }} className="text-text-h underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

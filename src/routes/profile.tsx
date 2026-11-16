import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { requireAuth } from '@/lib/auth'
import { useSession } from '@/store/session'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  avatar: z.string().url('URL inválida').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirm: z.string(),
}).refine((d) => d.newPassword === d.confirm, { message: 'Senhas não coincidem', path: ['confirm'] })

export const Route = createFileRoute('/profile')({
  beforeLoad: ({ location }) => {
    requireAuth(location.href)
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { user, login, token } = useSession()
  const [saving, setSaving] = useState(false)

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '', avatar: user?.avatar || '' },
    values: { name: user?.name || '', email: user?.email || '', avatar: user?.avatar || '' },
  })

  const passForm = useForm({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirm: '' } })

  const onSaveProfile = profileForm.handleSubmit(async (data) => {
    setSaving(true)
    try {
      const res = await authApi.updateProfile({ name: data.name, email: data.email, avatar: data.avatar || undefined })
      if (token) login(token, res.data)
      toast.success('Perfil atualizado')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  })

  const onChangePassword = passForm.handleSubmit(async (data) => {
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword)
      passForm.reset()
      toast.success('Senha alterada com sucesso')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Erro ao alterar senha')
    }
  })

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-heading font-bold text-text-h">Perfil do colecionador</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados do perfil</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={profileForm.watch('avatar') || user?.avatar || 'https://picsum.photos/seed/avatar/200/200'} alt="Avatar" className="w-16 h-16 rounded-full object-cover bg-muted" />
              <div className="flex-1">
                <Label htmlFor="avatar">Avatar (URL)</Label>
                <Input id="avatar" {...profileForm.register('avatar')} placeholder="https://..." />
                {profileForm.formState.errors.avatar && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.avatar.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...profileForm.register('name')} />
                {profileForm.formState.errors.name && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.name.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...profileForm.register('email')} />
                {profileForm.formState.errors.email && <p className="text-xs text-destructive mt-1">{profileForm.formState.errors.email.message as string}</p>}
              </div>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Alterar senha</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onChangePassword} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input id="currentPassword" type="password" {...passForm.register('currentPassword')} />
              {passForm.formState.errors.currentPassword && <p className="text-xs text-destructive mt-1">{passForm.formState.errors.currentPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" {...passForm.register('newPassword')} />
              {passForm.formState.errors.newPassword && <p className="text-xs text-destructive mt-1">{passForm.formState.errors.newPassword.message}</p>}
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input id="confirm" type="password" {...passForm.register('confirm')} />
              {passForm.formState.errors.confirm && <p className="text-xs text-destructive mt-1">{passForm.formState.errors.confirm.message}</p>}
            </div>
            <Button type="submit">Alterar senha</Button>
            <p className="text-xs text-muted-foreground">Senha atual fictícia para demo: password123</p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

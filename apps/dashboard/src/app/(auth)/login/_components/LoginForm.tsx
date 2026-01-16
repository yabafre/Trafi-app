'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginSchema } from '@trafi/validators'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { login } from '../_actions/login'

interface FormState {
  email: string
  password: string
}

interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<FormState>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const result = LoginSchema.safeParse(formData)

    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors
        if (field === 'email' || field === 'password') {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return false
    }

    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await login(formData)

      if (result.success) {
        router.push('/')
        router.refresh()
      } else {
        setErrors({ general: result.error ?? 'Invalid credentials' })
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Card className="p-0">
      <CardHeader className="p-6 border-b border-border">
        <CardTitle className="text-lg">Sign in</CardTitle>
        <CardDescription>
          Enter your credentials to access your dashboard
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 p-6">
          {errors.general && (
            <div className="bg-destructive/10 border border-destructive p-4 text-sm text-destructive font-mono">
              {errors.general}
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={isLoading}
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-destructive font-mono uppercase">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange('password')}
              disabled={isLoading}
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive font-mono uppercase">
                {errors.password}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-6 border-t border-border">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

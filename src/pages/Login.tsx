import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Hotel, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();

  // Carregar dados salvos quando o componente monta
  useEffect(() => {
    const savedCredentials = localStorage.getItem('hotel_login_credentials');
    if (savedCredentials) {
      try {
        const { email: savedEmail, password: savedPassword } = JSON.parse(savedCredentials);
        setEmail(savedEmail);
        setPassword(savedPassword);
        setRememberMe(true);
      } catch (error) {
        console.error('Erro ao carregar credenciais salvas:', error);
      }
    }
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      
      // Salvar credenciais se "lembrar" estiver marcado
      if (rememberMe) {
        localStorage.setItem('hotel_login_credentials', JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem('hotel_login_credentials');
      }
      
      toast.success('Login realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Hotel className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Hotel Scarton</CardTitle>
          <CardDescription>
            Faça login para acessar o painel de gestão de hóspedes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox 
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <Label htmlFor="remember-me" className="text-sm text-muted-foreground">
                Deixar meus dados salvos de login
              </Label>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              to="/register" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              Não tem conta? Criar conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
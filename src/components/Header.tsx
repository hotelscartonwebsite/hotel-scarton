import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Hotel } from 'lucide-react';
import { toast } from 'sonner';

export default function Header() {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Hotel className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Hotel Scarton</h1>
            {/* MODIFICAÇÃO: 
              'hidden' esconde o subtítulo por padrão.
              'sm:block' o exibe em telas pequenas (sm) e maiores.
            */}
            <p className="hidden sm:block text-sm text-muted-foreground">Gestão de Hóspedes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* MODIFICAÇÃO: 
            'hidden' esconde a mensagem de boas-vindas por padrão.
            'md:block' a exibe em telas médias (md) e maiores, onde há mais espaço.
          */}
          <div className="hidden md:block text-sm text-muted-foreground">
            Bem-vindo, <span className="font-medium">{user?.email}</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSignOut}
            className="flex items-center"
          >
            <LogOut className="h-4 w-4" />
            {/* MODIFICAÇÃO:
              'hidden' esconde o texto "Sair" em telas muito pequenas.
              'sm:inline' o exibe em telas pequenas (sm) e maiores.
              Também foi adicionado um espaçamento à esquerda (ml-2) que só se aplica quando o texto é visível.
            */}
            <span className="hidden sm:inline ml-2">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
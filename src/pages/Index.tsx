import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, UserPlus, Users, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardCards } from '@/components/DashboardCards';
import { GuestRegistrationForm } from '@/components/GuestRegistrationForm';
import { GuestTable } from '@/components/GuestTable';
import Header from '@/components/Header';
import { guestService, Guest } from '@/services/guestService';
import { MonthlyCheckInsChart } from '@/components/MonthlyCheckInsChart';
import { AccommodationPieChart } from '@/components/AccommodationPieChart';
import { OccupancyMap } from '@/components/OccupancyMap';
import { DateFilteredOccupancyMap } from '@/components/DateFilteredOccupancyMap';
import { DailyData } from '@/components/DailyData';

export default function Index() {
  // --- ESTADOS DO COMPONENTE ---
  const [guests, setGuests] = useState<Guest[]>([]); // Armazena a lista de todos os hóspedes
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null); // Controla o formulário de edição
  const [loading, setLoading] = useState(true); // Controla a exibição de loaders
  const [activeTab, setActiveTab] = useState("dashboard"); // Controla a aba ativa

  // --- EFEITOS ---
  // Carrega os hóspedes quando o componente é montado pela primeira vez
  useEffect(() => {
    loadGuests();
  }, []);

  // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS ---

  // Busca a lista de hóspedes do serviço e atualiza o estado
  const loadGuests = async () => {
    try {
      setLoading(true);
      const data = await guestService.getGuests();
      setGuests(data);
    } catch (error) {
      toast.error('Erro ao carregar hóspedes');
    } finally {
      setLoading(false);
    }
  };

  // Lida com a adição de um novo hóspede
  const handleAddGuest = async (guestData: Omit<Guest, 'id' | 'createdAt'>) => {
    try {
      await guestService.addGuest(guestData);
      await loadGuests(); // Recarrega a lista para incluir o novo hóspede
      setActiveTab("guests"); // Muda para a aba de hóspedes para visualizar o novo registro
      toast.success('Hóspede cadastrado com sucesso!');
    } catch (error) {
      toast.error('Erro ao cadastrar hóspede');
    }
  };

  // Lida com a atualização de um hóspede existente
  const handleEditGuest = async (id: string, updates: Partial<Guest>) => {
    try {
      await guestService.updateGuest(id, updates);
      await loadGuests(); // Recarrega a lista para refletir as mudanças
      if (editingGuest) setEditingGuest(null); // Fecha o modal de edição
      toast.success('Hóspede atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar hóspede');
    }
  };

  // Lida com a mudança de status (Em andamento/Finalizado) a partir da tabela
  const handleStatusChange = async (guest: Guest, newStatus: 'em-andamento' | 'finalizado') => {
    const statusText = newStatus === 'finalizado' ? 'finalizar' : 'marcar como "em andamento"';
    if (window.confirm(`Tem certeza que deseja ${statusText} a estadia de ${guest.nome}?`)) {
      await handleEditGuest(guest.id!, { status: newStatus });
    }
  };

  // Lida com a exclusão de um hóspede
  const handleDeleteGuest = async (id: string) => {
    try {
      await guestService.deleteGuest(id);
      await loadGuests(); // Recarrega a lista sem o hóspede removido
      toast.success('Hóspede removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover hóspede');
    }
  };

  // Verifica se um CPF já existe (usado pelo formulário)
  const handleCheckCpf = async (cpf: string, excludeId?: string) => {
    try {
      return await guestService.checkCpfExists(cpf, excludeId);
    } catch (error) {
      return false;
    }
  };

  // Verifica disponibilidade de quarto (usado pelo formulário)
  const handleCheckRoomAvailability = async (leito: string, dataEntrada: string, dataSaida: string, excludeId?: string) => {
    try {
      return await guestService.checkRoomAvailability(leito, dataEntrada, dataSaida, excludeId);
    } catch (error) {
      return false;
    }
  };

  // --- RENDERIZAÇÃO DO COMPONENTE ---
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-muted/50 rounded-lg p-1">
            <TabsTrigger
              value="dashboard"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <BarChart3 className="h-4 w-4" />
              Painel de controle
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <UserPlus className="h-4 w-4" />
              Cadastrar
            </TabsTrigger>
            
            <TabsTrigger
              value="daily-data"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <CalendarDays className="h-4 w-4" />
              Dados Diários
            </TabsTrigger>
            
            <TabsTrigger
              value="guests"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-md"
            >
              <Users className="h-4 w-4" />
              Hóspedes
            </TabsTrigger>
          </TabsList>


          {/* Conteúdo da Aba Painel de Controle */}
          <TabsContent value="dashboard" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Painel de controle</h2>
                <p className="text-muted-foreground mb-6">
                  Visão geral da ocupação e movimento do hotel
                </p>
              </div>
              <Button onClick={() => setActiveTab("register")} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Novo Hóspede</span>
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-8">
                <DashboardCards guests={guests} />
                <OccupancyMap guests={guests} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
                  <MonthlyCheckInsChart guests={guests} />
                  <AccommodationPieChart guests={guests} />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Conteúdo da Aba Cadastrar */}
          <TabsContent value="register" className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Cadastrar Hóspede</h2>
              <p className="text-muted-foreground mb-6">
                Registre um novo hóspede no sistema
              </p>
              <div className="space-y-8">
                <DateFilteredOccupancyMap guests={guests} />
                <div className="max-w-4xl mx-auto">
                  <GuestRegistrationForm
                    onSubmit={handleAddGuest}
                    onCancel={() => setActiveTab("dashboard")}
                    onCheckCpf={handleCheckCpf}
                    onCheckRoomAvailability={handleCheckRoomAvailability}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Conteúdo da Aba Hóspedes */}
          <TabsContent value="guests" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Gerenciar Hóspedes</h2>
                <p className="text-muted-foreground mb-6">
                  Visualize, edite e gerencie todos os registros de hóspedes
                </p>
              </div>
              <Button onClick={() => setActiveTab("register")} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Novo Hóspede</span>
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <GuestTable
                guests={guests}
                onEdit={setEditingGuest}
                onDelete={handleDeleteGuest}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>

          {/* Conteúdo da Aba Dados Diários */}
          <TabsContent value="daily-data" className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dados Diários</h2>
              <p className="text-muted-foreground mb-6">
                Visualização detalhada da ocupação atual por tipo de acomodação
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <DailyData guests={guests} />
            )}
          </TabsContent>
        </Tabs>

        {/* Modal de Edição de Hóspede */}
        {editingGuest && (
          <GuestRegistrationForm
            guest={editingGuest}
            onSubmit={(data) => handleEditGuest(editingGuest.id!, data)}
            onCancel={() => setEditingGuest(null)}
            onCheckCpf={handleCheckCpf}
            onCheckRoomAvailability={handleCheckRoomAvailability}
          />
        )}
      </main>

      <footer className="bg-gradient-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground text-sm">
            <p>© 2025 Hotel Scarton</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
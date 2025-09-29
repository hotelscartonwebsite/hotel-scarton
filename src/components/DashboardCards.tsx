// DashboardCards.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  UserX, 
  DollarSign, 
  TrendingUp, 
  CalendarClock 
} from "lucide-react";
import { Guest } from "@/types/guest";
import { GuestListPopup } from "./GuestListPopup";
import { toast } from "sonner";

interface DashboardCardsProps {
  guests: Guest[];
}

interface DashboardStats {
  currentGuests: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  upcomingCheckIns: number;
}

export function DashboardCards({ guests }: DashboardCardsProps) {
  const [popupState, setPopupState] = useState<{
    isOpen: boolean;
    title: string;
    data: Guest[];
  }>({
    isOpen: false,
    title: '',
    data: [],
  });

  const today = new Date().toISOString().split('T')[0];
  
   const calculateStats = (): DashboardStats => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Zera o horário para comparar apenas a data

    // DashboardCards.tsx

// Dentro da função calculateStats

   const currentGuests = guests.filter(g => {
     const checkInDate = new Date(g.dataEntrada + 'T00:00:00');
     const checkOutDate = new Date(g.dataSaida + 'T00:00:00');
     return g.status === 'em-andamento' && todayDate >= checkInDate && todayDate < checkOutDate;
   }).reduce((sum, g) => sum + (+g.cama || 0), 0); // CORRIGIDO: Converte g.cama para número antes de somar
    const todayCheckIns = guests.filter(g => g.dataEntrada === today).length;
    const todayCheckOuts = guests.filter(g => g.dataSaida === today).length;
    
    const dailyRevenue = guests
      .filter(g => g.dataEntrada === today)
      .reduce((sum, g) => sum + g.valor, 0);
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    
    const weeklyRevenue = guests
      .filter(g => g.dataEntrada >= weekAgoStr && g.dataEntrada <= today)
      .reduce((sum, g) => sum + g.valor, 0);

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const sevenDaysFromNowDate = new Date();
    sevenDaysFromNowDate.setDate(sevenDaysFromNowDate.getDate() + 7);
    
    const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
    const sevenDaysFromNowStr = sevenDaysFromNowDate.toISOString().split('T')[0];

    const upcomingCheckIns = guests.filter(g => 
      g.dataEntrada >= tomorrowStr && g.dataEntrada <= sevenDaysFromNowStr
    ).length;
    
    return {
      currentGuests,
      todayCheckIns,
      todayCheckOuts,
      dailyRevenue,
      weeklyRevenue,
      upcomingCheckIns,
    };
  };

  const stats = calculateStats();

  const handleCardClick = (cardId: string) => {
    let title = '';
    let filteredGuests: Guest[] = [];

    switch (cardId) {
      case 'currentGuests':
        title = 'Hóspedes Atuais';
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        filteredGuests = guests.filter(g => {
          const checkInDate = new Date(g.dataEntrada + 'T00:00:00');
          const checkOutDate = new Date(g.dataSaida + 'T00:00:00');
          return g.status === 'em-andamento' && todayDate >= checkInDate && todayDate < checkOutDate;
        });
        break;
      case 'todayCheckIns':
        title = 'Hóspedes com Check-in Hoje';
        filteredGuests = guests.filter(g => g.dataEntrada === today);
        break;
      case 'todayCheckOuts':
        title = 'Hóspedes com Check-out Hoje';
        filteredGuests = guests.filter(g => g.dataSaida === today);
        break;
      // ATUALIZADO: Adicionada a lógica para o novo card clicável
      case 'upcomingCheckIns':
        title = 'Próximos Check-ins (7 dias)';
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const sevenDaysFromNowDate = new Date();
        sevenDaysFromNowDate.setDate(sevenDaysFromNowDate.getDate() + 7);
        const tomorrowStr = tomorrowDate.toISOString().split('T')[0];
        const sevenDaysFromNowStr = sevenDaysFromNowDate.toISOString().split('T')[0];
        filteredGuests = guests.filter(g => g.dataEntrada >= tomorrowStr && g.dataEntrada <= sevenDaysFromNowStr);
        break;
      default:
        return;
    }

    if (filteredGuests.length > 0) {
      setPopupState({ isOpen: true, title, data: filteredGuests });
    } else {
      toast.info(`Não há hóspedes para exibir em "${title}".`);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const cards = [
    {
      id: "currentGuests",
      title: "Hóspedes Atuais",
      value: stats.currentGuests.toString(),
      description: "Total em hospedagem",
      icon: Users,
      color: "text-primary",
      bgGradient: "bg-gradient-primary",
    },
    {
      id: "todayCheckIns",
      title: "Entradas Hoje",
      value: stats.todayCheckIns.toString(),
      description: "Novos check-ins",
      icon: UserCheck,
      color: "text-success",
      bgGradient: "bg-gradient-success",
    },
    {
      id: "todayCheckOuts",
      title: "Saídas Hoje",
      value: stats.todayCheckOuts.toString(),
      description: "Check-outs programados",
      icon: UserX,
      color: "text-warning",
      bgGradient: "bg-gradient-to-br from-warning/20 to-warning/5",
    },
    {
      id: "dailyRevenue",
      title: "Receita do Dia",
      value: formatCurrency(stats.dailyRevenue),
      description: "Faturamento hoje",
      icon: DollarSign,
      color: "text-success",
      bgGradient: "bg-gradient-success",
    },
    {
      id: "weeklyRevenue",
      title: "Receita Semanal",
      value: formatCurrency(stats.weeklyRevenue),
      description: "Últimos 7 dias",
      icon: TrendingUp,
      color: "text-primary",
      bgGradient: "bg-gradient-primary",
    },
    {
      id: "upcomingCheckIns",
      title: "Próximos Check-ins",
      value: stats.upcomingCheckIns.toString(),
      description: "Hóspedes nos próximos 7 dias",
      icon: CalendarClock,
      color: "text-indigo-500",
      bgGradient: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",
    },
  ];

  // ATUALIZADO: Adicionado 'upcomingCheckIns' para tornar o card clicável
  const clickableCardIds = ['currentGuests', 'todayCheckIns', 'todayCheckOuts', 'upcomingCheckIns'];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const isClickable = clickableCardIds.includes(card.id);
          return (
            <Card
              key={index}
              onClick={() => isClickable && handleCardClick(card.id)}
              className={`shadow-card hover:shadow-elevated transition-all duration-300 ${
                isClickable ? 'cursor-pointer' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgGradient}`}>
                  <Icon className={`h-4 w-4 ${card.color === 'text-primary' || card.color === 'text-success' ? 'text-white' : card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <GuestListPopup
        isOpen={popupState.isOpen}
        onClose={() => setPopupState({ ...popupState, isOpen: false })}
        title={popupState.title}
        guests={popupState.data}
      />
    </>
  );
}
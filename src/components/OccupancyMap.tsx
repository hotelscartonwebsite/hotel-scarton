import React, { useMemo, useState } from 'react'; // Adicionado useState
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
// NOVOS IMPORTS para o painel de informações
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { BedDouble, User, Building, CalendarDays, DollarSign, Phone, KeyRound } from 'lucide-react'; // Adicionado mais ícones
import { Guest } from '@/services/guestService';
import { cn } from '@/lib/utils';

// --- DADOS DOS QUARTOS E APARTAMENTOS (sem alterações) ---
const ROOM_NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08', '10', '16'];
const APARTMENT_NUMBERS = ['09', '11', '12', '13', '14', '15', '17', '18', '19', '20', '21', '22', '23', '24'];

interface OccupancyMapProps {
  guests: Guest[];
}

export function OccupancyMap({ guests }: OccupancyMapProps) {
  // NOVO ESTADO: Armazena o hóspede selecionado para exibir no painel (Sheet)
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Lógica para mapear hóspedes ocupados e de checkout
  const { occupiedUnitsMap, checkoutUnitsMap } = useMemo(() => {
    // Pega a data de hoje e zera o horário para comparar apenas o dia
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const occupiedMap = new Map<string, Guest>();
    const checkoutMap = new Map<string, Guest>();
    
    guests.forEach(guest => {
      // Converte as datas do hóspede para objetos Date.
      const checkInDate = new Date(guest.dataEntrada + 'T00:00:00');
      const checkOutDate = new Date(guest.dataSaida + 'T00:00:00');

      if (guest.status === 'em-andamento' && today >= checkInDate) {
        // Se hoje é o dia de checkout
        if (today.getTime() === checkOutDate.getTime()) {
          checkoutMap.set(guest.leito, guest);
        }
        // Se ainda está hospedado (antes do checkout)
        else if (today < checkOutDate) {
          occupiedMap.set(guest.leito, guest);
        }
      }
    });
    
    return { occupiedUnitsMap: occupiedMap, checkoutUnitsMap: checkoutMap };
  }, [guests]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
  };

  // Função para renderizar uma unidade (quarto ou apartamento)
  const renderUnit = (unitNumber: string) => {
    const isOccupied = occupiedUnitsMap.has(unitNumber);
    const isCheckout = checkoutUnitsMap.has(unitNumber);
    const guest = occupiedUnitsMap.get(unitNumber) || checkoutUnitsMap.get(unitNumber);

    const unitClasses = cn(
      "flex flex-col items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer",
      "h-14 w-14 sm:h-16 sm:w-16",
      isCheckout
        ? "bg-yellow-500 text-yellow-900 shadow-md hover:shadow-lg"
        : isOccupied
        ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
        : "bg-muted/50 hover:bg-muted text-muted-foreground"
    );

    return (
      <TooltipProvider key={unitNumber} delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={unitClasses} onClick={() => (isOccupied || isCheckout) && setSelectedGuest(guest)}>
              <span className="font-bold text-base sm:text-lg">{unitNumber}</span>
              {(isOccupied || isCheckout) && <User className="h-4 w-4 mt-1 opacity-80" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {(isOccupied || isCheckout) && guest ? (
              <div className="text-sm">
                <p className="font-bold">{guest.nome}</p>
                <p>{isCheckout ? "Checkout hoje" : "Clique para ver detalhes"}</p>
              </div>
            ) : (
              <p>Disponível</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Mapa de Ocupação Atual</CardTitle>
          <CardDescription>
            Visualize as unidades ocupadas. Clique em uma unidade para ver os detalhes do hóspede.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Seção de Quartos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BedDouble className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Quartos</h3>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-4">
              {ROOM_NUMBERS.map(renderUnit)}
            </div>
          </div>

          {/* Seção de Apartamentos */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Apartamentos</h3>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-4">
              {APARTMENT_NUMBERS.map(renderUnit)}
            </div>
          </div>
          
          {/* Legenda */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-primary" />
                  <span>Ocupado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-yellow-500" />
                  <span>Checkout Hoje</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 rounded-full bg-muted/50 border" />
                  <span>Disponível</span>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* --- NOVO COMPONENTE SHEET PARA EXIBIR DETALHES NO CELULAR --- */}
      <Sheet open={!!selectedGuest} onOpenChange={(isOpen) => !isOpen && setSelectedGuest(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          {selectedGuest && (
            <>
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="text-2xl">{selectedGuest.nome}</SheetTitle>
                <SheetDescription>
                  CPF: {selectedGuest.cpf}
                </SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Telefone</p>
                    <p className="font-medium">{selectedGuest.telefone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Acomodação</p>
                    {/* Lógica corrigida para determinar o tipo de acomodação */}
                    <p className="font-medium capitalize">
                      {ROOM_NUMBERS.includes(selectedGuest.leito) ? 'Quarto' : 'Apartamento'} {selectedGuest.leito}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Período</p>
                    <p className="font-medium">{formatDate(selectedGuest.dataEntrada)} a {formatDate(selectedGuest.dataSaida)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-muted-foreground">Valor da Hospedagem</p>
                    <p className="font-medium text-green-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedGuest.valor)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
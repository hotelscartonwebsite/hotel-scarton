import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
// --- CORREÇÃO 1: Adicionado 'CalendarDays' ao import ---
import { 
  CalendarIcon, BedDouble, Building, User, Phone, DollarSign, KeyRound, CalendarDays 
} from 'lucide-react';
import { Guest } from '@/services/guestService';
import { cn } from '@/lib/utils';

const ROOM_NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08', '10', '16'];
const APARTMENT_NUMBERS = ['09', '11', '12', '13', '14', '15', '17', '18', '19', '20', '21', '22', '23', '24'];

interface DateFilteredOccupancyMapProps {
  guests: Guest[];
  onDateRangeChange?: (dataEntrada: string, dataSaida: string) => void;
}

export function DateFilteredOccupancyMap({ guests, onDateRangeChange }: DateFilteredOccupancyMapProps) {
  const [dataEntrada, setDataEntrada] = useState('');
  const [dataSaida, setDataSaida] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const filteredGuests = useMemo(() => {
    if (!dataEntrada || !dataSaida) {
      return [];
    }
    return guests.filter(guest => {
      const entradaFiltro = new Date(dataEntrada);
      const saidaFiltro = new Date(dataSaida);
      const entradaHospede = new Date(guest.dataEntrada);
      const saidaHospede = new Date(guest.dataSaida);
      return entradaFiltro < saidaHospede && saidaFiltro > entradaHospede;
    });
  }, [guests, dataEntrada, dataSaida]);

  const occupiedUnitsMap = useMemo(() => {
    const map = new Map<string, Guest>();
    filteredGuests.forEach(guest => {
      map.set(guest.leito, guest);
    });
    return map;
  }, [filteredGuests]);
  
  // --- CORREÇÃO 2: Adicionada a função 'formatCurrency' que estava faltando ---
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
  };

  const renderUnit = (unitNumber: string) => {
    const isOccupied = occupiedUnitsMap.has(unitNumber);
    const guest = occupiedUnitsMap.get(unitNumber);

    const unitClasses = cn(
      "flex flex-col items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer",
      "h-14 w-14 sm:h-16 sm:w-16",
      isOccupied
        ? "bg-destructive text-destructive-foreground shadow-md"
        : "bg-green-500/10 text-green-700 border-green-500/30"
    );

    return (
      <TooltipProvider key={unitNumber} delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={unitClasses} onClick={() => isOccupied && setSelectedGuest(guest)}>
              <span className="font-bold text-base sm:text-lg">{unitNumber}</span>
              {isOccupied && <User className="h-4 w-4 mt-1 opacity-80" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isOccupied && guest ? (
              <div className="text-sm">
                <p className="font-bold">{guest.nome}</p>
                <p>Clique para ver detalhes</p>
              </div>
            ) : (
              <p>Disponível no período</p>
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
          <CardTitle>Verificar Disponibilidade por Data</CardTitle>
          <CardDescription>
            Selecione um período para ver quais unidades estarão disponíveis ou ocupadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataEntradaFiltro">Data de Entrada</Label>
              <div className="relative">
                <Input id="dataEntradaFiltro" type="date" value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} className="bg-muted/50"/>
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataSaidaFiltro">Data de Saída</Label>
              <div className="relative">
                <Input id="dataSaidaFiltro" type="date" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} className="bg-muted/50"/>
                <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {(dataEntrada && dataSaida) && (
            <div className="space-y-8 animate-in fade-in-50 duration-500">
              <div>
                <div className="flex items-center gap-2 mb-4"><BedDouble className="h-5 w-5 text-primary" /><h3 className="font-semibold text-lg">Quartos</h3></div>
                <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-4">{ROOM_NUMBERS.map(renderUnit)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4"><Building className="h-5 w-5 text-primary" /><h3 className="font-semibold text-lg">Apartamentos</h3></div>
                <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-4">{APARTMENT_NUMBERS.map(renderUnit)}</div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm"><div className="h-4 w-4 rounded-full bg-green-500/10 border border-green-500/30" /><span>Disponível</span></div>
                <div className="flex items-center gap-2 text-sm"><div className="h-4 w-4 rounded-full bg-destructive" /><span>Ocupado</span></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedGuest} onOpenChange={(isOpen) => !isOpen && setSelectedGuest(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          {selectedGuest && (
            <>
              <SheetHeader className="text-left mb-6">
                <SheetTitle className="text-2xl">{selectedGuest.nome}</SheetTitle>
                <SheetDescription>CPF: {selectedGuest.cpf}</SheetDescription>
              </SheetHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div><p className="text-muted-foreground">Telefone</p><p className="font-medium">{selectedGuest.telefone}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <div><p className="text-muted-foreground">Acomodação</p><p className="font-medium capitalize">{selectedGuest.tipoAcomodacao} {selectedGuest.leito}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div><p className="text-muted-foreground">Período da Reserva</p><p className="font-medium">{formatDate(selectedGuest.dataEntrada)} a {formatDate(selectedGuest.dataSaida)}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div><p className="text-muted-foreground">Valor da Hospedagem</p><p className="font-medium text-green-400">{formatCurrency(selectedGuest.valor)}</p></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
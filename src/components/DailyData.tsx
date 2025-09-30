// DailyData.tsx

import React from 'react';
import { useState, useMemo, useCallback, memo } from 'react';
import { guestService } from '@/services/guestService';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BedDouble,
  Building,
  User,
  Phone,
  Calendar,
  DollarSign,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Pencil
} from 'lucide-react';


/** ---------------------------
 * Tipagem / Utilitários
 * ----------------------------*/

export interface Guest {
  id?: string;
  leito: string;
  status: 'em-andamento' | 'finalizado' | 'reservado' | string;
  nome: string;
  cpf: string;
  telefone: string;
  dataEntrada: string; // formato 'YYYY-MM-DD'
  dataSaida: string;   // formato 'YYYY-MM-DD'
  valor: number;
  [key: string]: any;
}

const cn = (...args: Array<string | false | null | undefined>) => args.filter(Boolean).join(' ');

/** --- Constantes de unidades --- */
const ROOM_NUMBERS = ['01', '02', '03', '04', '05', '06', '07', '08', '10', '16'];
const APARTMENT_NUMBERS = ['09', '11', '12', '13', '14', '15', '17', '18', '19', '20', '21', '22', '23', '24'];

type FilterType = 'all' | 'rooms' | 'apartments';

/**
 * Converte 'YYYY-MM-DD' -> Date local (meia-noite) para evitar problemas de timezone
 */
const parseDateAsLocal = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Formata um objeto Date para 'YYYY-MM-DD'
 */
const formatDateToISO = (date: Date) => {
  return format(date, 'yyyy-MM-dd');
};


/** ---------------------------
 * Componentes memoizados para unidades
 * ----------------------------*/
// --- DEFINIÇÃO DE TIPOS PARA O UnitCard (MAIS ORGANIZADO) ---
type UnitCardProps = {
    unitNumber: string;
    type: 'room' | 'apartment';
    isOccupied: boolean;
    isCheckout: boolean;
    isTurnaround?: boolean; // NOVO
    guest?: Guest;
    guestIn?: Guest;       // NOVO
    guestOut?: Guest;      // NOVO
};

const UnitCard = memo(({
    unitNumber,
    type,
    isOccupied,
    isCheckout,
    isTurnaround,
    guest,
    guestIn,
    guestOut
}: UnitCardProps) => {

    // ✅ LÓGICA DE ESTILOS CORRIGIDA
    const unitClasses = cn(
        "flex flex-col items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer shadow-md",
        "h-14 w-14 sm:h-16 sm:w-16 p-2",
        // Classes de cor são aplicadas condicionalmente, exceto para 'turnaround'
        !isTurnaround && (
            isCheckout
                ? "bg-yellow-500 text-yellow-900 border-yellow-500/50"
                : isOccupied
                    ? "bg-destructive text-destructive-foreground border-destructive/50"
                    : "bg-green-500/10 text-green-700 border-green-500/30 shadow-none"
        )
    );
    
    // ✅ CONSTANTE ADICIONADA: Estilo inline para o gradiente diagonal
    const unitStyle = isTurnaround ? {
        // Amarelo (#eab308) para checkout, Vermelho (#ef4444) para ocupado/check-in
        background: 'linear-gradient(to top right, #eab308 49.5%, #ef4444 50.5%)',
        color: 'white', 
        borderColor: '#ef4444'
    } : {};

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {/* ✅ Atributo 'style' adicionado ao div */}
                <div className={unitClasses} style={unitStyle}>
                    <span className="font-bold text-base sm:text-lg">{unitNumber}</span>
                    {/* ✅ Condição do ícone corrigida para incluir 'turnaround' */}
                    {(isOccupied || isCheckout || isTurnaround) && <User className="h-4 w-4 mt-1 opacity-80" />}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                {/* ✅ LÓGICA DO TOOLTIP CORRIGIDA para o caso 'turnaround' */}
                {isTurnaround ? (
                    <div className="text-sm">
                        <p>Sai: <span className="font-bold">{guestOut?.nome}</span></p>
                        <p>Entra: <span className="font-bold">{guestIn?.nome}</span></p>
                    </div>
                ) : (isOccupied || isCheckout) && guest ? (
                    <div className="text-sm">
                        <p className="font-bold">{guest.nome}</p>
                        <p>{isCheckout ? "Checkout hoje" : `${type === 'room' ? 'Quarto' : 'Apartamento'} ${unitNumber}`}</p>
                    </div>
                ) : (
                    <p>{type === 'room' ? 'Quarto' : 'Apartamento'} {unitNumber} - Disponível</p>
                )}
            </TooltipContent>
        </Tooltip>
    );
});

UnitCard.displayName = 'UnitCard';


/** ---------------------------
 * Componente principal: DailyData
 * ----------------------------*/

export function DailyData({ guests: initialGuests }: { guests: Guest[] }) {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  /**
   * OTIMIZAÇÃO: ESTRATÉGIA DE PRÉ-PROCESSAMENTO
   * Em vez de filtrar a lista inteira de hóspedes a cada mudança de data,
   * criamos um mapa que armazena os hóspedes ativos e de checkout para cada dia.
   * Este cálculo pesado é feito apenas UMA VEZ.
   * A busca por uma data específica se torna uma operação O(1) (instantânea).
   */
  const dailyGuestMap = useMemo(() => {
    const map = new Map<string, { active: Guest[], checkout: Guest[] }>();

    guests.forEach(guest => {
      if (guest.status !== 'em-andamento' || !guest.dataEntrada || !guest.dataSaida) return;

      const entrada = parseDateAsLocal(guest.dataEntrada);
      const saida = parseDateAsLocal(guest.dataSaida);

      // Itera por cada dia da estadia, populando o mapa
      for (let currentDate = entrada; currentDate < saida; currentDate = addDays(currentDate, 1)) {
        const dateKey = formatDateToISO(currentDate);
        if (!map.has(dateKey)) {
          map.set(dateKey, { active: [], checkout: [] });
        }
        map.get(dateKey)!.active.push(guest);
      }

      // Adiciona o hóspede à lista de checkout no dia da saída
      const checkoutDateKey = guest.dataSaida;
      if (!map.has(checkoutDateKey)) {
        map.set(checkoutDateKey, { active: [], checkout: [] });
      }
      map.get(checkoutDateKey)!.checkout.push(guest);
    });

    return map;
  }, [guests]); // Recalcula o mapa somente se a lista de hóspedes mudar


  /**
   * OTIMIZAÇÃO: BUSCA RÁPIDA
   * Agora, para obter os hóspedes do dia, apenas consultamos nosso mapa pré-processado.
   * Isso é extremamente rápido e não causa travamentos.
   */
  // CÓDIGO CORRETO ✅
  // CÓDIGO CORRETO ✅
const { active: activeGuests, checkout: checkoutGuests } = useMemo(() => {
    const dateKey = formatDateToISO(selectedDate);
    return dailyGuestMap.get(dateKey) || { active: [], checkout: [] };
}, [selectedDate, dailyGuestMap]);

// NOVO: Filtra os hóspedes que estão fazendo check-in na data selecionada
const checkinGuests = useMemo(() => {
    const dateKey = formatDateToISO(selectedDate);
    // Um hóspede está fazendo check-in se ele estiver ativo no dia E a data de entrada for hoje
    return activeGuests.filter(g => g.dataEntrada === dateKey);
}, [activeGuests, selectedDate]);


// Mapa rápido leito -> guest (somente ativos na data selecionada)
const occupiedUnitsMap = useMemo(() => {
    const map = new Map<string, Guest>();
    activeGuests.forEach(g => map.set(g.leito, g));
    return map;
}, [activeGuests]);

// Mapa para checkouts
const checkoutUnitsMap = useMemo(() => {
    const map = new Map<string, Guest>();
    checkoutGuests.forEach(g => map.set(g.leito, g));
    return map;
}, [checkoutGuests]);

// NOVO: Mapa para check-ins
const checkinUnitsMap = useMemo(() => {
    const map = new Map<string, Guest>();
    checkinGuests.forEach(g => map.set(g.leito, g));
    return map;
}, [checkinGuests]);

  // Quais unidades mostrar conforme filtro
  const displayedUnits = useMemo(() => {
    switch (filter) {
      case 'rooms':
        return { rooms: ROOM_NUMBERS, apartments: [] };
      case 'apartments':
        return { rooms: [], apartments: APARTMENT_NUMBERS };
      default:
        return { rooms: ROOM_NUMBERS, apartments: APARTMENT_NUMBERS };
    }
  }, [filter]);

  // Lista combinada de unidades com estado
  const allUnits = useMemo(() => {
    const units: Array<{
      number: string;
      type: 'room' | 'apartment';
      guest?: Guest;
      isOccupied: boolean;
      isCheckout: boolean;
    }> = [];

    const processUnit = (number: string, type: 'room' | 'apartment') => {
      const guest = occupiedUnitsMap.get(number) || checkoutUnitsMap.get(number);
      const isOccupied = occupiedUnitsMap.has(number);
      const isCheckout = checkoutUnitsMap.has(number);
      units.push({ number, type, guest, isOccupied, isCheckout });
    };

    displayedUnits.rooms.forEach(number => processUnit(number, 'room'));
    displayedUnits.apartments.forEach(number => processUnit(number, 'apartment'));

    units.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }));
    return units;
  }, [displayedUnits, occupiedUnitsMap, checkoutUnitsMap]);

  const formatDate = (dateString: string) => {
    const d = parseDateAsLocal(dateString);
    return format(d, "dd/MM/yyyy");
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    setSelectedDate(prevDate => addDays(prevDate, direction === 'next' ? 1 : -1));
  }, []);

  const handleSaveEdit = useCallback((updatedGuest: Guest) => {
    setGuests(prev => prev.map(g => (g.id === updatedGuest.id ? updatedGuest : g)));
    setEditingGuest(null);
  }, []);

  // DailyData.tsx

// DailyData.tsx

  const handleDeleteGuest = async (guestId: string) => {
    if (!guestId) return;

    try {
      await guestService.deleteGuest(guestId); // Descomente ao usar com API
      setGuests(currentGuests => currentGuests.filter(guest => guest.id !== guestId));
      console.log(`Hóspede com ID ${guestId} foi removido do estado.`);
    } catch (error) {
      console.error('Erro ao excluir hóspede:', error);
      alert('Erro ao excluir hóspede. Tente novamente.');
    }
  };

  const handleDateSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-6">
        {/* Card Combinado: Data e Filtro */}
        <Card>
          <CardHeader>
            <CardTitle>Controles de Visualização</CardTitle>
            <CardDescription>
              Use os controles abaixo para selecionar a data e filtrar por tipo de acomodação.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            {/* Coluna da Esquerda: Seleção de Data */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Data de Visualização</p>
              <div className="flex items-center justify-center sm:justify-start gap-4">
                <Button variant="outline" size="icon" onClick={() => navigateDate('prev')} className="h-10 w-10">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-center gap-2 min-w-0">
                      <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline" size="icon" onClick={() => navigateDate('next')} className="h-10 w-10">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Coluna da Direita: Filtro de Acomodação */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Escolha quais tipos de acomodação deseja visualizar.
              </p>
              <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo de acomodação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ambos (Quartos e Apartamentos)</SelectItem>
                  <SelectItem value="rooms">Apenas Quartos</SelectItem>
                  <SelectItem value="apartments">Apenas Apartamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </CardContent>
        </Card>
        {/* Mapa de Ocupação */}
<Card>
    <CardHeader>
        <CardTitle>Mapa de Ocupação - {format(selectedDate, "dd/MM/yyyy")}</CardTitle>
        <CardDescription>Visualização da ocupação das unidades para a data selecionada.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
        {displayedUnits.rooms.length > 0 && (
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <BedDouble className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Quartos</h3>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-4">
                    {displayedUnits.rooms.map(number => {
                        // Lógica para determinar o estado da unidade
                        const isTurnaround = checkinUnitsMap.has(number) && checkoutUnitsMap.has(number);
                        const isCheckoutOnly = checkoutUnitsMap.has(number) && !isTurnaround;
                        const isOccupied = occupiedUnitsMap.has(number) || (checkinUnitsMap.has(number) && !isTurnaround);

                        // Obtém os dados dos hóspedes para o Tooltip/Detalhes
                        const guestIn = checkinUnitsMap.get(number);
                        const guestOut = checkoutUnitsMap.get(number);
                        const guest = guestIn || occupiedUnitsMap.get(number) || guestOut;

                        return (
                            <UnitCard
                                key={number}
                                unitNumber={number}
                                type="room"
                                isOccupied={isOccupied}
                                isCheckout={isCheckoutOnly}
                                isTurnaround={isTurnaround} // Nova prop para o estado de troca
                                guest={guest}
                                guestIn={guestIn}     // Passando hóspede que entra
                                guestOut={guestOut}   // Passando hóspede que sai
                            />
                        );
                    })}
                </div>
            </div>
        )}

        {displayedUnits.apartments.length > 0 && (
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Building className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Apartamentos</h3>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-7 lg:grid-cols-10 gap-2 sm:gap-4">
                    {displayedUnits.apartments.map(number => {
                        // Lógica para determinar o estado da unidade
                        const isTurnaround = checkinUnitsMap.has(number) && checkoutUnitsMap.has(number);
                        const isCheckoutOnly = checkoutUnitsMap.has(number) && !isTurnaround;
                        const isOccupied = occupiedUnitsMap.has(number) || (checkinUnitsMap.has(number) && !isTurnaround);

                        // Obtém os dados dos hóspedes para o Tooltip/Detalhes
                        const guestIn = checkinUnitsMap.get(number);
                        const guestOut = checkoutUnitsMap.get(number);
                        const guest = guestIn || occupiedUnitsMap.get(number) || guestOut;
                        
                        return (
                            <UnitCard
                                key={number}
                                unitNumber={number}
                                type="apartment"
                                isOccupied={isOccupied}
                                isCheckout={isCheckoutOnly}
                                isTurnaround={isTurnaround} // Nova prop para o estado de troca
                                guest={guest}
                                guestIn={guestIn}     // Passando hóspede que entra
                                guestOut={guestOut}   // Passando hóspede que sai
                            />
                        );
                    })}
                </div>
            </div>
        )}

        {/* Legenda Atualizada */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-6 border-t">
            <div className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 rounded-full bg-muted/50 border" />
                <span>Disponível</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 rounded-full bg-primary" />
                <span>Ocupado</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <div className="h-4 w-4 rounded-full bg-yellow-500" />
                <span>Checkout</span>
            </div>
            {/* Nova legenda para a troca de hóspedes */}
            <div className="flex items-center gap-2 text-sm">
                 <div 
                    className="h-4 w-4 rounded-full"
                    style={{ background: 'linear-gradient(to top right, #eab308 49.5%, #3b82f6 50.5%)' }}
                />
                <span>Troca de Hóspede</span>
            </div>
        </div>
    </CardContent>
</Card>

        {/* Lista Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Detalhada de Unidades</CardTitle>
            <CardDescription>
              Informações completas sobre todas as unidades {
                filter === 'all' ? '(quartos e apartamentos)' :
                  filter === 'rooms' ? '(apenas quartos)' : '(apenas apartamentos)'
              }.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allUnits.map(unit => (
                <Card key={unit.number} className={cn(
                  "transition-all duration-200",
                  unit.isCheckout
                    ? "border-yellow-500/50 bg-yellow-500/5"
                    : unit.isOccupied
                      ? "border-destructive/50 bg-destructive/5"
                      : "border-green-500/50 bg-green-500/5"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {unit.type === 'room' ? <BedDouble className="h-4 w-4" /> : <Building className="h-4 w-4" />}
                        {unit.type === 'room' ? 'Quarto' : 'Apt'} {unit.number}
                      </CardTitle>
                      <Badge
                        variant={unit.isCheckout ? "secondary" : unit.isOccupied ? "destructive" : "default"}
                        className={cn(
                          "flex items-center gap-1",
                          unit.isCheckout && "bg-yellow-500 text-yellow-900 hover:bg-yellow-600"
                        )}
                      >
                        {unit.isCheckout ? (
                          <><UserCheck className="h-3 w-3" />Checkout</>
                        ) : unit.isOccupied ? (
                          <><UserCheck className="h-3 w-3" />Ocupado</>
                        ) : (
                          <><UserX className="h-3 w-3" />Desocupado</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>

                  {(unit.isOccupied || unit.isCheckout) && unit.guest ? (
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-semibold">{unit.guest.nome}</p>
                          <p className="text-sm text-muted-foreground">CPF: {unit.guest.cpf}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary" />
                        <p className="text-sm">{unit.guest.telefone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="text-sm">{formatDate(unit.guest.dataEntrada)} até {formatDate(unit.guest.dataSaida)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-green-600">{formatCurrency(unit.guest.valor)}</p>
                      </div>

                      {/* Botões Editar e Excluir */}
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => setEditingGuest(unit.guest || null)}
                        >
                          <Pencil className="h-4 w-4" /> Editar
                        </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => {
                      const guestId = unit.guest?.id;
                      if (guestId && unit.guest && confirm(`Tem certeza que deseja excluir o hóspede ${unit.guest.nome}?`)) {
                        handleDeleteGuest(guestId);
                      }
                    }}
                  >
                    <UserX className="h-4 w-4" /> Excluir
                  </Button>
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground text-sm">Esta unidade está atualmente desocupada.</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {allUnits.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma unidade para exibir com os filtros aplicados.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Edição */}
        {editingGuest && (
          <Dialog open={!!editingGuest} onOpenChange={(open) => { if (!open) setEditingGuest(null); }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Hóspede - Unidade {editingGuest.leito}</DialogTitle>
                <DialogDescription>Altere as informações do hóspede e clique em salvar.</DialogDescription>
              </DialogHeader>

              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);

                const updated: Guest = {
                  ...editingGuest,
                  nome: (fd.get('nome') as string) || editingGuest.nome,
                  cpf: (fd.get('cpf') as string) || editingGuest.cpf,
                  telefone: (fd.get('telefone') as string) || editingGuest.telefone,
                  dataEntrada: (fd.get('entrada') as string) || editingGuest.dataEntrada,
                  dataSaida: (fd.get('saida') as string) || editingGuest.dataSaida,
                  valor: Number(fd.get('valor') ?? editingGuest.valor)
                };

                handleSaveEdit(updated);
              }} className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input name="nome" defaultValue={editingGuest.nome} required />
                </div>

                <div>
                  <Label>CPF</Label>
                  <Input name="cpf" defaultValue={editingGuest.cpf} required />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input name="telefone" defaultValue={editingGuest.telefone} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Entrada</Label>
                    <Input type="date" name="entrada" defaultValue={editingGuest.dataEntrada} required />
                  </div>
                  <div>
                    <Label>Data Saída</Label>
                    <Input type="date" name="saida" defaultValue={editingGuest.dataSaida} required />
                  </div>
                </div>

                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" name="valor" defaultValue={String(editingGuest.valor)} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingGuest(null)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}

/** ---------------------------
 * Dados de exemplo + export default
 * ----------------------------*/

const SAMPLE_GUESTS: Guest[] = [
  {
    id: 'g1',
    leito: '15',
    status: 'em-andamento',
    nome: 'Ana Silva',
    cpf: '222.222.222-22',
    telefone: '(44) 44444-4444',
    dataEntrada: '2025-09-27',
    dataSaida: '2025-09-30',
    valor: 600
  },
  {
    id: 'g2',
    leito: '14',
    status: 'em-andamento',
    nome: 'Bruno Costa',
    cpf: '111.111.111-11',
    telefone: '(44) 99999-9999',
    dataEntrada: '2025-09-28',
    dataSaida: '2025-10-02',
    valor: 800
  },
  {
    id: 'g3',
    leito: '03',
    status: 'em-andamento',
    nome: 'Carlos Dias',
    cpf: '333.333.333-33',
    telefone: '(44) 88888-8888',
    dataEntrada: '2025-09-29',
    dataSaida: '2025-10-01',
    valor: 450
  }
];

export default function DailyDataDemo() {
  return (
    <div className="p-4">
      <DailyData guests={SAMPLE_GUESTS} />
    </div>
  );
}
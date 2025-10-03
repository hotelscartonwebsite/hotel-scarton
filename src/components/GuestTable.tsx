import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Search, Filter, Edit, Trash2, CheckCircle, Circle,
  BedDouble, CalendarDays, DollarSign, Phone, MessageSquare, CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { Guest } from "@/types/guest";

interface GuestTableProps {
  guests: Guest[];
  onEdit: (guest: Guest) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (guest: Guest, newStatus: 'em-andamento' | 'finalizado') => Promise<void>;
}

export function GuestTable({ guests, onEdit, onDelete, onStatusChange }: GuestTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accommodationFilter, setAccommodationFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  const sortedGuests = useMemo(() => {
    return [...guests].sort((a, b) => Number(a.leito) - Number(b.leito));
  }, [guests]);


  const filteredGuests = useMemo(() => {
    let filtered = sortedGuests;

    if (searchTerm) {
      filtered = filtered.filter(guest =>
        guest.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.cpf && guest.cpf.includes(searchTerm)) ||
        (guest.telefone && guest.telefone.includes(searchTerm)) ||
        guest.leito.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.cama.includes(searchTerm) ||
        (guest.observacao && guest.observacao.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(guest => guest.status === statusFilter);
    }
    if (accommodationFilter !== "all") {
      filtered = filtered.filter(guest => guest.tipoAcomodacao === accommodationFilter);
    }
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(guest => guest.statusPagamento === paymentStatusFilter);
    }
    return filtered;
  }, [sortedGuests, searchTerm, statusFilter, accommodationFilter, paymentStatusFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
  };

  const getDisplayName = (name: string) => {
    if (!name) return "Hóspede não informado";
    const names = name.split(',').map(n => n.trim()).filter(n => n);
    if (names.length > 1) {
      const extraGuests = names.length - 1;
      return `${names[0]} (+${extraGuests} hóspede${extraGuests > 1 ? 's' : ''})`;
    }
    return names[0] || "Hóspede não informado";
  };

  const handleDelete = async (guest: Guest) => {
    toast("Tem certeza que deseja excluir este hóspede?", {
      action: {
        label: "Excluir",
        onClick: async () => await onDelete(guest.id!),
      },
      cancel: {
        label: "Cancelar",
        onClick: () => { },
      },
    });
  };

  const getStatusBadge = (status: string) => {
    return status === "em-andamento" ? (
      <Badge className="bg-gradient-success text-white hover:opacity-90">Em andamento</Badge>
    ) : (
      <Badge variant="secondary" className="hover:opacity-90">Finalizado</Badge>
    );
  };

  const getPaymentStatusBadge = (status?: 'pago' | 'pendente' | '') => {
    if (status === "pago") {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Pago</Badge>;
    }
    if (status === "pendente") {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendente</Badge>;
    }
    return <Badge variant="outline">N/A</Badge>;
  };

  const getPaymentMethodText = (method?: string) => {
    const map: { [key: string]: string } = {
      'nao-informado': 'Não Informado',
      'pix': 'PIX',
      'cartao': 'Cartão',
      'dinheiro': 'Dinheiro'
    };
    return (method && map[method]) || 'N/A';
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Registro de Hóspedes
          </CardTitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="relative md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, telefone ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full bg-muted/50">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="em-andamento">Em andamento</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
            <SelectTrigger className="w-full bg-muted/50">
              <SelectValue placeholder="Acomodação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Acomodações</SelectItem>
              <SelectItem value="quarto">Quarto</SelectItem>
              <SelectItem value="apartamento">Apartamento</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-full bg-muted/50">
              <SelectValue placeholder="Status Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Pagamentos</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* --- VISUALIZAÇÃO EM TABELA PARA DESKTOP --- */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Hóspede(s)</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Leito/Cama</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entrada/Saída</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Pagamento</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status Pag.</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Observação</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="font-medium" title={guest.nome}>{getDisplayName(guest.nome)}</div>
                    {guest.cpf && <div className="text-xs text-muted-foreground">CPF {guest.cpf}</div>}
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{guest.leito}-{guest.cama}</span>
                  </td>
                  <td className="p-3 text-sm">
                    {formatDate(guest.dataEntrada)} - {formatDate(guest.dataSaida)}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-success">{formatCurrency(guest.valor)}</div>
                    <div className="text-xs text-muted-foreground">{getPaymentMethodText(guest.metodoPagamento)}</div>
                  </td>
                  <td className="p-3">{getPaymentStatusBadge(guest.statusPagamento)}</td>
                  <td className="p-3 max-w-[200px] truncate text-sm text-muted-foreground">
                    {guest.observacao ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-white underline truncate max-w-[180px]">
                            {guest.observacao}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Observação</DialogTitle>
                          </DialogHeader>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {guest.observacao}
                          </p>
                        </DialogContent>
                      </Dialog>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-auto p-1 rounded-full hover:bg-muted cursor-pointer">
                          {getStatusBadge(guest.status)}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled={guest.status === 'em-andamento'} onClick={() => onStatusChange(guest, 'em-andamento')} className="flex items-center gap-2 cursor-pointer">
                          <Circle className="h-4 w-4 text-green-500" /> Em andamento
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={guest.status === 'finalizado'} onClick={() => onStatusChange(guest, 'finalizado')} className="flex items-center gap-2 cursor-pointer">
                          <CheckCircle className="h-4 w-4 text-gray-500" /> Finalizado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(guest)} className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(guest)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- VISUALIZAÇÃO EM CARDS PARA MOBILE --- */}
        <div className="block md:hidden space-y-4">
          {filteredGuests.map((guest) => (
            <div key={guest.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg" title={guest.nome}>{getDisplayName(guest.nome)}</p>
                  {guest.cpf && <p className="text-sm text-muted-foreground">CPF {guest.cpf}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(guest)} className="h-8 w-8 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(guest)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{guest.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-primary" />
                  <span className="font-mono bg-muted px-2 py-1 rounded">{guest.leito}-{guest.cama}</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{formatDate(guest.dataEntrada)} a {formatDate(guest.dataSaida)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium text-success">{formatCurrency(guest.valor)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span>{getPaymentMethodText(guest.metodoPagamento)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm border-t pt-3">
                <span className="text-muted-foreground">Status Pagamento:</span>
                {getPaymentStatusBadge(guest.statusPagamento)}
              </div>

              {guest.observacao && (
                <div className="text-sm border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2 font-medium text-primary">
                    <MessageSquare className="h-4 w-4" />
                    Observações
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="pl-6 text-xs italic text-blue-600 underline h-auto p-0">
                        Ver observação completa
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Observação</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {guest.observacao}
                      </p>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full h-auto py-1.5 px-2">
                      {getStatusBadge(guest.status)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[calc(100vw-50px)]">
                    <DropdownMenuItem disabled={guest.status === 'em-andamento'} onClick={() => onStatusChange(guest, 'em-andamento')} className="flex items-center gap-2 cursor-pointer">
                      <Circle className="h-4 w-4 text-green-500" /> Em andamento
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled={guest.status === 'finalizado'} onClick={() => onStatusChange(guest, 'finalizado')} className="flex items-center gap-2 cursor-pointer">
                      <CheckCircle className="h-4 w-4 text-gray-500" /> Finalizado
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>

        {filteredGuests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum hóspede encontrado com os filtros aplicados.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

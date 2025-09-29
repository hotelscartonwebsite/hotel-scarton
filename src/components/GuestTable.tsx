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
  Search, Filter, Edit, Trash2, Download, CheckCircle, Circle, 
  BedDouble, CalendarDays, DollarSign, Phone // Novos ícones para os cards
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
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [accommodationFilter, setAccommodationFilter] = useState<string>("all");

  const sortedGuests = useMemo(() => {
    return [...guests].sort((a, b) => new Date(a.dataEntrada).getTime() - new Date(b.dataEntrada).getTime());
  }, [guests]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
  };

  const applyFilters = (search: string, status: string, accommodation: string) => {
    let filtered = sortedGuests;
    if (search) {
      filtered = filtered.filter(guest =>
        guest.nome.toLowerCase().includes(search.toLowerCase()) ||
        guest.cpf.includes(search) ||
        guest.telefone.includes(search) || 
        guest.leito.toLowerCase().includes(search.toLowerCase()) ||
        guest.cama.includes(search)
      );
    }
    if (status !== "all") {
      filtered = filtered.filter(guest => guest.status === status);
    }
    if (accommodation !== "all") {
      filtered = filtered.filter(guest => guest.tipoAcomodacao === accommodation);
    }
    setFilteredGuests(filtered);
  };

  React.useEffect(() => {
    applyFilters(searchTerm, statusFilter, accommodationFilter);
  }, [sortedGuests, searchTerm, statusFilter, accommodationFilter]);

  const handleDelete = async (guest: Guest) => {
    if (window.confirm(`Tem certeza que deseja excluir ${guest.nome}?`)) {
      await onDelete(guest.id!);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "em-andamento" ? (
      <Badge className="bg-gradient-success text-white hover:opacity-90">Em andamento</Badge>
    ) : (
      <Badge variant="secondary" className="hover:opacity-90">Finalizado</Badge>
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Registro de Hóspedes
        </CardTitle>
      </div>
      
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-muted/50">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="em-andamento">Em andamento</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
            <SelectTrigger className="w-full md:w-[180px] bg-muted/50">
              <SelectValue placeholder="Acomodação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="quarto">Quarto</SelectItem>
              <SelectItem value="apartamento">Apartamento</SelectItem>
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
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">CPF</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Telefone</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Leito/Cama</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tipo Cama</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Entrada</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Saída</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Valor</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium">{guest.nome}</td>
                  <td className="p-3 text-muted-foreground">{guest.cpf}</td>
                  <td className="p-3 text-muted-foreground">{guest.telefone}</td>
                  <td className="p-3">
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">{guest.leito}-{guest.cama}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                      {guest.tipoCama === 'solteiro' ? 'Solteiro' : 
                       guest.tipoCama === 'casal' ? 'Casal' : 'Casal e Solteiro'}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{formatDate(guest.dataEntrada)}</td>
                  <td className="p-3 text-sm">{formatDate(guest.dataSaida)}</td>
                  <td className="p-3 font-medium text-success">{formatCurrency(guest.valor)}</td>
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
                  <p className="font-bold text-lg">{guest.nome}</p>
                  <p className="text-sm text-muted-foreground">{guest.cpf}</p>
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
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{formatDate(guest.dataEntrada)} a {formatDate(guest.dataSaida)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-medium text-success">{formatCurrency(guest.valor)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Tipo de cama:</span>
                <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                  {guest.tipoCama === 'solteiro' ? 'Solteiro' : 
                   guest.tipoCama === 'casal' ? 'Casal' : 'Casal e Solteiro'}
                </span>
              </div>
              
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
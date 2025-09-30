import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, UserPlus, X, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Guest } from "@/types/guest";

// Interface do formulário atualizada para lidar com múltiplos nomes
interface GuestFormData {
  leito: string;
  cama: string;
  nomes: string[]; // Alterado de 'nome' para 'nomes' (array)
  cpf: string;
  telefone: string;
  dataEntrada: string;
  dataSaida: string;
  valor: string;
  tipoAcomodacao: 'quarto' | 'apartamento' | '';
  tipoCama: 'solteiro' | 'casal' | 'casal-e-solteiro' | '';
  metodoPagamento: 'nao-informado' | 'pix' | 'cartao' | 'dinheiro' | '';
  statusPagamento: 'pago' | 'pendente' | '';
  observacao: string;
}

interface GuestRegistrationFormProps {
  guest?: Guest;
  onSubmit: (data: Omit<Guest, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  onCheckCpf: (cpf: string, excludeId?: string) => Promise<boolean>;
  onCheckRoomAvailability: (leito: string, dataEntrada: string, dataSaida: string, excludeId?: string) => Promise<boolean>;
}

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export function GuestRegistrationForm({ guest, onSubmit, onCancel, onCheckCpf, onCheckRoomAvailability }: GuestRegistrationFormProps) {
  const [formData, setFormData] = useState<GuestFormData>({
    leito: "",
    cama: "",
    nomes: [""], // Inicia com um campo de nome vazio
    cpf: "",
    telefone: "",
    dataEntrada: "",
    dataSaida: "",
    valor: "",
    tipoAcomodacao: "",
    tipoCama: "",
    metodoPagamento: "nao-informado",
    statusPagamento: "pendente",
    observacao: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (guest) {
      setFormData({
        leito: guest.leito,
        cama: guest.cama,
        // Se houver nome, divide por vírgula para popular os campos, senão, inicia com um campo
        nomes: guest.nome ? guest.nome.split(',').map(n => n.trim()) : [""],
        cpf: guest.cpf,
        telefone: guest.telefone,
        dataEntrada: guest.dataEntrada,
        dataSaida: guest.dataSaida,
        valor: guest.valor.toString(),
        tipoAcomodacao: guest.tipoAcomodacao,
        tipoCama: guest.tipoCama,
        metodoPagamento: guest.metodoPagamento || 'nao-informado',
        statusPagamento: guest.statusPagamento || 'pendente',
        observacao: guest.observacao || '',
      });
    }
  }, [guest]);

  const handleInputChange = (field: keyof Omit<GuestFormData, 'nomes'>, value: string) => {
    let finalValue = value;
    if (field === 'cpf') {
      finalValue = maskCPF(value);
    } else if (field === 'telefone') {
      finalValue = maskPhone(value);
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
  };
  
  // Função para lidar com a mudança nos campos de nome
  const handleNomeChange = (index: number, value: string) => {
    const novosNomes = [...formData.nomes];
    novosNomes[index] = value;
    setFormData(prev => ({ ...prev, nomes: novosNomes }));
  };

  // Função para adicionar um novo campo de nome
  const addNomeField = () => {
    setFormData(prev => ({ ...prev, nomes: [...prev.nomes, ""] }));
  };

  // Função para remover um campo de nome
  const removeNomeField = (index: number) => {
    if (formData.nomes.length > 1) { // Impede que o último campo seja removido
      const novosNomes = formData.nomes.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, nomes: novosNomes }));
    }
  };

  const validateForm = async () => {
    const requiredFields = {
      leito: formData.leito,
      cama: formData.cama,
      dataEntrada: formData.dataEntrada,
      dataSaida: formData.dataSaida,
      valor: formData.valor,
      tipoAcomodacao: formData.tipoAcomodacao,
      tipoCama: formData.tipoCama,
      metodoPagamento: formData.metodoPagamento,
      statusPagamento: formData.statusPagamento,
    };

    if (Object.values(requiredFields).some(value => !value || (typeof value === 'string' && !value.trim()))) {
      toast.error("Por favor, preencha todos os campos obrigatórios (*).");
      return false;
    }

    // Valida se todos os campos de nome estão preenchidos
    if(formData.nomes.some(nome => !nome.trim())) {
      toast.error("Por favor, preencha o nome de todos os hóspedes.");
      return false;
    }

    if (formData.telefone.trim()) {
      const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
      if (!phoneRegex.test(formData.telefone)) {
        toast.error("Por favor, insira um telefone completo no formato (XX) XXXXX-XXXX.");
        return false;
      }
    }

    if (new Date(formData.dataSaida) <= new Date(formData.dataEntrada)) {
      toast.error("A data de saída deve ser posterior à data de entrada.");
      return false;
    }

    const roomIsAvailable = await onCheckRoomAvailability(
      formData.leito,
      formData.dataEntrada,
      formData.dataSaida,
      guest?.id
    );
    if (!roomIsAvailable) {
      toast.error("Este quarto/apartamento não está disponível no período selecionado.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateForm())) return;

    setLoading(true);
    try {
      const guestData = {
        leito: formData.leito,
        cama: formData.cama,
        // Junta os nomes em uma única string, separados por vírgula
        nome: formData.nomes.filter(n => n.trim()).join(', '),
        cpf: formData.cpf,
        telefone: formData.telefone,
        dataEntrada: formData.dataEntrada,
        dataSaida: formData.dataSaida,
        valor: parseFloat(formData.valor),
        tipoAcomodacao: formData.tipoAcomodacao as 'quarto' | 'apartamento',
        tipoCama: formData.tipoCama as 'solteiro' | 'casal' | 'casal-e-solteiro',
        status: 'em-andamento' as const,
        metodoPagamento: formData.metodoPagamento as 'nao-informado' | 'pix' | 'cartao' | 'dinheiro',
        statusPagamento: formData.statusPagamento as 'pago' | 'pendente',
        observacao: formData.observacao,
      };

      await onSubmit(guestData);

      if (!guest) {
        setFormData({
          leito: "", cama: "", nomes: [""], cpf: "", telefone: "",
          dataEntrada: "", dataSaida: "", valor: "", tipoAcomodacao: "", tipoCama: "",
          metodoPagamento: "nao-informado", statusPagamento: "pendente", observacao: "",
        });
      }
    } catch (error) {
      toast.error("Erro ao processar cadastro");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="leito">Leito *</Label>
          <Input id="leito" value={formData.leito} onChange={(e) => handleInputChange("leito", e.target.value)} placeholder="Ex: 01, 02..." className="bg-muted/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cama">Cama *</Label>
          <Input id="cama" value={formData.cama} onChange={(e) => handleInputChange("cama", e.target.value)} placeholder="Ex: 1, 2..." className="bg-muted/50" />
        </div>
      </div>
      
      {/* Seção de Nomes Dinâmicos */}
      <div className="space-y-2">
        <Label>Nome do(s) Hóspede(s) *</Label>
        {formData.nomes.map((nome, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={nome}
              onChange={(e) => handleNomeChange(index, e.target.value)}
              placeholder={`Hóspede ${index + 1}`}
              className="bg-muted/50"
            />
            {formData.nomes.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => removeNomeField(index)} className="text-destructive">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addNomeField} className="mt-2">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Hóspede
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF (Responsável)</Label>
          <Input id="cpf" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} className="bg-muted/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone (Responsável)</Label>
          <Input id="telefone" value={formData.telefone} onChange={(e) => handleInputChange("telefone", e.target.value)} placeholder="(00) 00000-0000" maxLength={15} className="bg-muted/50" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataEntrada">Data de Entrada *</Label>
          <div className="relative">
            <Input id="dataEntrada" type="date" value={formData.dataEntrada} onChange={(e) => handleInputChange("dataEntrada", e.target.value)} className="bg-muted/50" />
            <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataSaida">Data de Saída *</Label>
          <div className="relative">
            <Input id="dataSaida" type="date" value={formData.dataSaida} onChange={(e) => handleInputChange("dataSaida", e.target.value)} className="bg-muted/50" />
            <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="valor">Valor da Hospedagem *</Label>
          <Input id="valor" type="number" step="0.01" min="0" value={formData.valor} onChange={(e) => handleInputChange("valor", e.target.value)} placeholder="0,00" className="bg-muted/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoAcomodacao">Tipo de Acomodação *</Label>
          <Select value={formData.tipoAcomodacao} onValueChange={(value) => handleInputChange("tipoAcomodacao", value)}>
            <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="quarto">Quarto</SelectItem>
              <SelectItem value="apartamento">Apartamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoCama">Tipo de Cama *</Label>
          <Select value={formData.tipoCama} onValueChange={(value) => handleInputChange("tipoCama", value)}>
            <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="solteiro">Solteiro</SelectItem>
              <SelectItem value="casal">Casal</SelectItem>
              <SelectItem value="casal-e-solteiro">Casal e Solteiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="metodoPagamento">Método de Pagamento *</Label>
          <Select value={formData.metodoPagamento} onValueChange={(value) => handleInputChange("metodoPagamento", value)}>
            <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Selecione o método" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nao-informado">Não Informado</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="statusPagamento">Status do Pagamento *</Label>
          <Select value={formData.statusPagamento} onValueChange={(value) => handleInputChange("statusPagamento", value)}>
            <SelectTrigger className="bg-muted/50"><SelectValue placeholder="Selecione o status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="observacao">Observação</Label>
        <Textarea
          id="observacao"
          value={formData.observacao}
          onChange={(e) => handleInputChange("observacao", e.target.value)}
          placeholder="Adicione informações relevantes aqui..."
          className="bg-muted/50"
        />
      </div>
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300" disabled={loading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Processando...' : guest ? 'Atualizar Hóspede' : 'Cadastrar Hóspede'}
        </Button>
      </div>
    </form>
  );

  if (guest) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Hóspede</DialogTitle>
          </DialogHeader>
          <div className="p-0 sm:p-6">
            {formContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader className="bg-gradient-primary rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastro de Hóspede
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-white hover:bg-white/20">
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {formContent}
      </CardContent>
    </Card>
  );
}


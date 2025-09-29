import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarIcon, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Guest } from "@/types/guest";

// Interface para gerenciar os dados do formulário
interface GuestFormData {
  leito: string;
  cama: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataEntrada: string;
  dataSaida: string;
  valor: string;
  tipoAcomodacao: 'quarto' | 'apartamento' | '';
  tipoCama: 'solteiro' | 'casal' | 'casal-e-solteiro' | '';
}

// Interface para as propriedades do componente
interface GuestRegistrationFormProps {
  guest?: Guest; // Hóspede opcional, para modo de edição
  onSubmit: (data: Omit<Guest, 'id' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  onCheckCpf: (cpf: string, excludeId?: string) => Promise<boolean>;
  onCheckRoomAvailability: (leito: string, dataEntrada: string, dataSaida: string, excludeId?: string) => Promise<boolean>;
}

// Função utilitária para aplicar a máscara de CPF (XXX.XXX.XXX-XX)
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove todos os caracteres que não são dígitos
    .replace(/(\d{3})(\d)/, "$1.$2") // Adiciona um ponto após o terceiro dígito
    .replace(/(\d{3})(\d)/, "$1.$2") // Adiciona um ponto após o sexto dígito
    .replace(/(\d{3})(\d{1,2})/, "$1-$2") // Adiciona um hífen após o nono dígito
    .replace(/(-\d{2})\d+?$/, "$1"); // Garante que apenas dois dígitos existam após o hífen
};

// Função utilitária para aplicar a máscara de telefone ((XX) XXXXX-XXXX)
const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove todos os caracteres que não são dígitos
    .replace(/(\d{2})(\d)/, "($1) $2") // Adiciona parênteses e um espaço após os dois primeiros dígitos (DDD)
    .replace(/(\d{5})(\d)/, "$1-$2") // Adiciona um hífen após o quinto dígito do número
    .replace(/(-\d{4})\d+?$/, "$1"); // Garante que apenas quatro dígitos existam após o hífen
};

export function GuestRegistrationForm({ guest, onSubmit, onCancel, onCheckCpf, onCheckRoomAvailability }: GuestRegistrationFormProps) {
  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState<GuestFormData>({
    leito: "",
    cama: "",
    nome: "",
    cpf: "",
    telefone: "",
    dataEntrada: "",
    dataSaida: "",
    valor: "",
    tipoAcomodacao: "",
    tipoCama: "",
  });
  // Estado para controlar o status de carregamento do botão de submit
  const [loading, setLoading] = useState(false);

  // Efeito para preencher o formulário com dados do hóspede quando em modo de edição
  useEffect(() => {
    if (guest) {
      setFormData({
        leito: guest.leito,
        cama: guest.cama,
        nome: guest.nome,
        cpf: guest.cpf,
        telefone: guest.telefone,
        dataEntrada: guest.dataEntrada,
        dataSaida: guest.dataSaida,
        valor: guest.valor.toString(),
        tipoAcomodacao: guest.tipoAcomodacao,
        tipoCama: guest.tipoCama,
      });
    }
  }, [guest]);

  // Função para lidar com a mudança de valores nos inputs, aplicando as máscaras
  const handleInputChange = (field: keyof GuestFormData, value: string) => {
    let finalValue = value;
    if (field === 'cpf') {
      finalValue = maskCPF(value);
    } else if (field === 'telefone') {
      finalValue = maskPhone(value);
    }
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
  };

  // Função para validar todos os campos do formulário antes do envio
  const validateForm = async () => {
    // Campos obrigatórios (excluindo CPF e telefone)
    const requiredFields = {
      leito: formData.leito,
      cama: formData.cama,
      nome: formData.nome,
      dataEntrada: formData.dataEntrada,
      dataSaida: formData.dataSaida,
      valor: formData.valor,
      tipoAcomodacao: formData.tipoAcomodacao,
      tipoCama: formData.tipoCama,
    };

    if (Object.values(requiredFields).some(value => !value.trim())) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return false;
    }

    // Validar CPF apenas se foi preenchido
    if (formData.cpf.trim()) {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(formData.cpf)) {
        toast.error("Por favor, insira um CPF completo no formato XXX.XXX.XXX-XX.");
        return false;
      }
    }

    // Validar telefone apenas se foi preenchido
    if (formData.telefone.trim()) {
      const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
      if (!phoneRegex.test(formData.telefone)) {
        toast.error("Por favor, insira um telefone completo no formato (XX) XXXXX-XXXX.");
        return false;
      }
    }

    // Verificar CPF duplicado apenas se foi preenchido
    if (formData.cpf.trim()) {
      const cpfExists = await onCheckCpf(formData.cpf, guest?.id);
      if (cpfExists) {
        toast.error("Este CPF já está cadastrado para outro hóspede.");
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

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) return;

    setLoading(true);
    try {
      const guestData = {
        leito: formData.leito,
        cama: formData.cama,
        nome: formData.nome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        dataEntrada: formData.dataEntrada,
        dataSaida: formData.dataSaida,
        valor: parseFloat(formData.valor),
        tipoAcomodacao: formData.tipoAcomodacao as 'quarto' | 'apartamento',
        tipoCama: formData.tipoCama as 'solteiro' | 'casal' | 'casal-e-solteiro',
        status: 'em-andamento' as const,
      };

      await onSubmit(guestData);
      
      if (!guest) {
        setFormData({
          leito: "", cama: "", nome: "", cpf: "", telefone: "",
          dataEntrada: "", dataSaida: "", valor: "", tipoAcomodacao: "", tipoCama: "",
        });
      }
    } catch (error) {
      toast.error("Erro ao processar cadastro");
    } finally {
      setLoading(false);
    }
  };

  // Conteúdo JSX do formulário, que será reutilizado no Dialog
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
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Hóspede *</Label>
        <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange("nome", e.target.value)} placeholder="Nome completo" className="bg-muted/50" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" value={formData.cpf} onChange={(e) => handleInputChange("cpf", e.target.value)} placeholder="000.000.000-00" maxLength={14} className="bg-muted/50" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
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
      <div className="flex gap-4 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" className="flex-1 bg-gradient-primary hover:shadow-glow transition-all duration-300" disabled={loading}>
          <UserPlus className="mr-2 h-4 w-4" />
          {loading ? 'Processando...' : guest ? 'Atualizar Hóspede' : 'Cadastrar Hóspede'}
        </Button>
      </div>
    </form>
  );

  // Se o componente estiver em modo de edição, renderiza o formulário dentro de um Dialog (modal)
  if (guest) {
    return (
      <Dialog open={true} onOpenChange={onCancel}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* O Dialog já tem seu próprio título e botão de fechar (X) no canto */}
          <DialogHeader>
            <DialogTitle>Editar Hóspede</DialogTitle>
          </DialogHeader>
          {/* Renderiza o conteúdo do formulário (sem o Card extra) com um padding */}
          <div className="p-0 sm:p-6">
            {formContent}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Se estiver em modo de cadastro, renderiza o formulário completo dentro de um Card
  return (
    <Card className="shadow-card">
      <CardHeader className="bg-gradient-primary rounded-t-lg">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Cadastro de Hóspade
          </div>
          {/* O botão 'X' do card só é necessário no modo de cadastro */}
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
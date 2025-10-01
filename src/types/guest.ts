export interface Guest {
  id?: string;
  leito: string;
  cama: string;
  nome: string;
  cpf: string;
  telefone: string;
  dataEntrada: string;
  dataSaida: string;
  valor: number;
  tipoAcomodacao: 'quarto' | 'apartamento';
  tipoCama: 'solteiro' | 'casal' | 'casal-e-solteiro';
  status: 'em-andamento' | 'finalizado';
  createdAt: Date;
  metodoPagamento: 'nao-informado' | 'pix' | 'cartao' | 'dinheiro' | '';
  statusPagamento: 'pago' | 'pendente' | '';
  observacao: string;
  checkoutLiberado?: boolean;
}
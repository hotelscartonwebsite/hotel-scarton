// src/components/GuestListPopup.tsx

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
// O 'DialogClose' e 'Button' não são mais necessários aqui
import { Badge } from "@/components/ui/badge";
import { Guest } from "@/types/guest";

interface GuestListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  guests: Guest[];
}

export function GuestListPopup({ isOpen, onClose, title, guests }: GuestListPopupProps) {
  const formatDate = (dateString: string) => {
    // Adiciona a conversão para considerar o fuso horário corretamente
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        {/* O botão 'X' manual foi removido daqui */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2 mt-4">
          {guests.length > 0 ? (
            <div className="space-y-4">
              {guests.map((guest) => (
                <div key={guest.id} className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{guest.nome}</p>
                      <p className="text-sm text-muted-foreground">CPF: {guest.cpf}</p>
                    </div>
                    {guest.status === "em-andamento" ? (
                       <Badge className="bg-gradient-success text-white">Em andamento</Badge>
                    ) : (
                       <Badge variant="secondary">Finalizado</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Leito/Cama</p>
                      <p className="font-mono bg-muted px-2 py-1 rounded w-fit">{guest.leito}-{guest.cama}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Entrada</p>
                      <p>{formatDate(guest.dataEntrada)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Saída</p>
                      <p>{formatDate(guest.dataSaida)}</p>
                    </div>
                     <div>
                      <p className="text-muted-foreground">Acomodação</p>
                      <p className="capitalize">{guest.tipoAcomodacao}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p>Nenhum hóspede para exibir nesta categoria.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
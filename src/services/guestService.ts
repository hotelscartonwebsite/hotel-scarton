import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
}

const COLLECTION_NAME = 'guests';

export const guestService = {
  async addGuest(guest: Omit<Guest, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...guest,
      createdAt: new Date()
    });
    return docRef.id;
  },

  async getGuests(): Promise<Guest[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Guest));
  },

  async updateGuest(id: string, updates: Partial<Guest>) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updates);
  },

  async deleteGuest(id: string) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async checkCpfExists(cpf: string, excludeId?: string): Promise<boolean> {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('cpf', '==', cpf),
      where('status', '==', 'em-andamento')
    );
    const querySnapshot = await getDocs(q);
    
    if (excludeId) {
      return querySnapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !querySnapshot.empty;
  },

  async checkRoomAvailability(
    leito: string, 
    dataEntrada: string, 
    dataSaida: string, 
    excludeId?: string
  ): Promise<boolean> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('leito', '==', leito),
      where('status', '==', 'em-andamento')
    );
    const querySnapshot = await getDocs(q);
    
    const conflictingGuests = querySnapshot.docs
      .filter(doc => excludeId ? doc.id !== excludeId : true)
      .filter(doc => {
        const guest = doc.data() as Guest;
        const entradaDate = new Date(dataEntrada);
        const saidaDate = new Date(dataSaida);
        const guestEntrada = new Date(guest.dataEntrada);
        const guestSaida = new Date(guest.dataSaida);
        
        // Verifica se há sobreposição de datas
        return (
          (entradaDate >= guestEntrada && entradaDate < guestSaida) ||
          (saidaDate > guestEntrada && saidaDate <= guestSaida) ||
          (entradaDate <= guestEntrada && saidaDate >= guestSaida)
        );
      });
    
    return conflictingGuests.length === 0;
  },

  async getGuestsByDateRange(dataEntrada: string, dataSaida: string): Promise<Guest[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'em-andamento')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Guest))
      .filter(guest => {
        const entradaDate = new Date(dataEntrada);
        const saidaDate = new Date(dataSaida);
        const guestEntrada = new Date(guest.dataEntrada);
        const guestSaida = new Date(guest.dataSaida);
        
        // Verifica se há sobreposição de datas
        return (
          (entradaDate >= guestEntrada && entradaDate < guestSaida) ||
          (saidaDate > guestEntrada && saidaDate <= guestSaida) ||
          (entradaDate <= guestEntrada && saidaDate >= guestSaida)
        );
      });
  }
};
// src/components/MonthlyCheckInsChart.tsx

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Guest } from "@/services/guestService";
import { useMemo } from "react";

interface MonthlyCheckInsChartProps {
  guests: Guest[];
}

export function MonthlyCheckInsChart({ guests }: MonthlyCheckInsChartProps) {
  // A função useMemo garante que o processamento dos dados só ocorra quando a lista de hóspedes mudar.
  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 1. Inicializa um array com todos os dias do mês, com contagem 0
    const dailyCounts = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `Dia ${i + 1}`,
      checkIns: 0,
    }));

    // 2. Filtra os hóspedes que fizeram check-in no mês e ano atuais
    const guestsThisMonth = guests.filter(guest => {
      const checkInDate = new Date(guest.dataEntrada);
      return checkInDate.getMonth() === currentMonth && checkInDate.getFullYear() === currentYear;
    });

    // 3. Preenche o array com a contagem de check-ins por dia
    guestsThisMonth.forEach(guest => {
      const dayOfMonth = new Date(guest.dataEntrada).getDate();
      // O índice do array é `dia - 1` (ex: Dia 1 está no índice 0)
      if (dailyCounts[dayOfMonth - 1]) {
        dailyCounts[dayOfMonth - 1].checkIns += 1;
      }
    });

    return dailyCounts;
  }, [guests]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check-ins no Mês</CardTitle>
        <CardDescription>Número de novos hóspedes por dia no mês atual.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[250px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="checkIns" fill="hsl(var(--primary))" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
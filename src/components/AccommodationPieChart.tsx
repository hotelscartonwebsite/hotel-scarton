// src/components/AccommodationPieChart.tsx

import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Guest } from "@/services/guestService";
import { useMemo } from "react";

interface AccommodationPieChartProps {
  guests: Guest[];
}

export function AccommodationPieChart({ guests }: AccommodationPieChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const guestsThisMonth = guests.filter(guest => {
      const checkInDate = new Date(guest.dataEntrada);
      return checkInDate.getMonth() === currentMonth && checkInDate.getFullYear() === currentYear;
    });

    const counts = guestsThisMonth.reduce((acc, guest) => {
      if (guest.tipoAcomodacao === 'quarto') {
        acc.quarto += 1;
      } else if (guest.tipoAcomodacao === 'apartamento') {
        acc.apartamento += 1;
      }
      return acc;
    }, { quarto: 0, apartamento: 0 });

    return [
      { type: 'Quartos', count: counts.quarto, fill: 'hsl(var(--primary))' },
      { type: 'Apartamentos', count: counts.apartamento, fill: 'hsl(var(--secondary))' },
    ];
  }, [guests]);

  const chartConfig = {
    count: {
      label: "Hóspedes",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acomodações (Mês)</CardTitle>
        <CardDescription>Distribuição de hóspedes por tipo de acomodação no mês atual.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              strokeWidth={5}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
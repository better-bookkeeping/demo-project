type FoodEntry = {
  id: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  loggedAt: Date | string;
  note: string | null;
};

type DailyAggregate = {
  date: string;
  displayDate: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function aggregateDailyMacros(entries: FoodEntry[], daysRange: number): DailyAggregate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyMap = new Map<string, DailyAggregate>();

  // Initialize all days in range
  for (let i = daysRange - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dailyMap.set(dateStr, {
      date: dateStr,
      displayDate: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    });
  }

  // Aggregate entries
  for (const entry of entries) {
    const entryDate = new Date(entry.loggedAt);
    const dateStr = entryDate.toISOString().split("T")[0];
    const daily = dailyMap.get(dateStr);
    if (daily) {
      daily.calories += entry.calories;
      daily.protein += entry.protein;
      daily.carbs += entry.carbs;
      daily.fat += entry.fat;
    }
  }

  return Array.from(dailyMap.values());
}

export function calculateDailyTotals(entries: FoodEntry[], date: Date): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  const dateStr = date.toISOString().split("T")[0];

  return entries
    .filter((entry) => {
      const entryDate = new Date(entry.loggedAt).toISOString().split("T")[0];
      return entryDate === dateStr;
    })
    .reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.calories,
        protein: acc.protein + entry.protein,
        carbs: acc.carbs + entry.carbs,
        fat: acc.fat + entry.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
}

export function getMealTypeLabel(mealType: string): string {
  const labels: Record<string, string> = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
  };
  return labels[mealType] ?? mealType;
}

export function formatMacros(protein: number, carbs: number, fat: number): string {
  return `P: ${protein.toFixed(0)}g | C: ${carbs.toFixed(0)}g | F: ${fat.toFixed(0)}g`;
}

export interface Trip {
  id: string;
  slug: string;
  organizer_id: string;
  title: string;
  description: string | null;
  destination: string;
  price: number;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  total_seats: number;
  available_seats: number;
}


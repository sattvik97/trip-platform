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
  tags: string[] | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  itinerary: Array<{ day: number; title: string; description: string }> | null;
}


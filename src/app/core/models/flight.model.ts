export interface Flight {
  num: string; // Flight Number (e.g., "BA123")
  from: string; // Origin City/Airport (e.g., "London")
  to: string; // Destination City/Airport (e.g., "Tel Aviv")
  from_date: string; // Origin Date as a string (format: "dd/mm/yyyy")
  to_date: string; // Destination Date as a string (format: "dd/mm/yyyy")
  plane: string; // Plane Number/Model (e.g., "A380")
  duration: number; // Flight duration in minutes (e.g., 350)
  from_gate: number; // Origin Gate Number (e.g., 35)
  to_gate: number; // Destination Gate Number (e.g., 101)
  // uniqueId?: string; // Optional: Could be added programmatically in the service
  // if needed for more reliable tracking/selection in the UI,
  // especially if API data might lack perfect uniqueness otherwise.
}

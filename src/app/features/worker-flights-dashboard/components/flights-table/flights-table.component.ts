import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common'; // Import for *ngFor, *ngIf, date pipe etc.
import { Flight } from '../../../../core/models/flight.model'; // Adjust path as needed

@Component({
  selector: 'app-flights-table', // Selector used to embed this component
  standalone: true, // Mark as standalone
  imports: [CommonModule], // Import CommonModule for common directives
  templateUrl: './flights-table.component.html',
  styleUrls: ['./flights-table.component.scss'],
  // Use OnPush change detection for better performance
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightsTableComponent {
  // --- Input Properties ---
  // Receives the array of flights to display from the parent component.
  @Input() flights: Flight[] | null = [];
  // Receives the currently selected flight object from the parent component.
  // Used to determine which row should be highlighted as 'active'.
  @Input() selectedFlight: Flight | null = null;

  // --- Output Properties ---
  // Emits an event when a user clicks on a flight row in the table.
  // The event payload is the Flight object corresponding to the clicked row.
  @Output() flightSelected = new EventEmitter<Flight>();

  // --- Content Projection ---
  // Allows the parent to project a custom template for the 'no flights' message.
  @ContentChild('noFlights') noFlightsTemplate: TemplateRef<any> | null = null;

  /**
   * Method called when a table row (<tr>) is clicked (via template binding).
   * Emits the 'flightSelected' event with the corresponding Flight object.
   * @param flight The Flight object associated with the clicked row.
   */
  selectFlight(flight: Flight): void {
    console.log('Flights Table Component: Clicked flight row', flight.num); // Log for debugging
    this.flightSelected.emit(flight); // Emit the event to the parent component
  }

  /**
   * Helper method used in the template (`[class.table-active]="isSelected(flight)"`)
   * to determine if the current row being rendered corresponds to the selected flight.
   * Relies on a robust equality check (`areFlightsEqual`).
   * @param flight The flight object from the current row in the *ngFor loop.
   * @returns True if the flight is the currently selected one, false otherwise.
   */
  isSelected(flight: Flight): boolean {
    // Compare the flight from the loop with the selectedFlight input property.
    return this.areFlightsEqual(flight, this.selectedFlight);
  }

  /**
   * TrackBy function for the *ngFor loop iterating over flights.
   * Improves performance by providing Angular with a unique identifier for each row.
   * @param index The index of the flight in the array.
   * @param flight The flight object for the current iteration.
   * @returns A unique string identifier for the flight row (e.g., combining num and date).
   */
  trackByFlightId(index: number, flight: Flight): string {
    // Combine fields that are likely to be unique for each flight entry.
    // Adjust this if a single unique ID field exists or is generated.
    return `${flight.num}-${flight.from_date}-${flight.from}-${flight.to}`;
  }

  /**
   * Private helper method to compare two flight objects for equality.
   * IMPORTANT: This comparison logic should ideally be identical to the one used
   * in the FlightDataService to ensure consistency in identifying selected flights.
   */
  private areFlightsEqual(f1: Flight | null, f2: Flight | null): boolean {
    if (!f1 || !f2) return false; // If either is null, they aren't equal
    // Compare relevant fields
    return (
      f1.num === f2.num &&
      f1.from_date === f2.from_date &&
      f1.from === f2.from &&
      f1.to === f2.to
    );
    // Add more fields if needed for uniqueness
  }
}

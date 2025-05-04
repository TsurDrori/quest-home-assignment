import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Flight } from '../../../../core/models/flight.model';

@Component({
  selector: 'app-flights-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flights-table.component.html',
  styleUrls: ['./flights-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightsTableComponent {
  @Input() flights: Flight[] | null = [];
  @Input() selectedFlight: Flight | null = null;

  @Output() flightSelected = new EventEmitter<Flight>();

  @ContentChild('noFlights') noFlightsTemplate: TemplateRef<any> | null = null;

  selectFlight(flight: Flight): void {
    console.log('Flights Table Component: Clicked flight row', flight.num);
    this.flightSelected.emit(flight);
  }

  isSelected(flight: Flight): boolean {
    return this.areFlightsEqual(flight, this.selectedFlight);
  }

  trackByFlightId(index: number, flight: Flight): string {
    return `${flight.num}-${flight.from_date}-${flight.from}-${flight.to}`;
  }

  private areFlightsEqual(f1: Flight | null, f2: Flight | null): boolean {
    if (!f1 || !f2) return false;
    return (
      f1.num === f2.num &&
      f1.from_date === f2.from_date &&
      f1.from === f2.from &&
      f1.to === f2.to
    );
  }
}

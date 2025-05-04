import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import for async pipe, *ngIf, *ngFor etc.
import { Observable } from 'rxjs'; // Import Observable

// Import Models and the central Data Service
import { Worker, Flight, FlightDataService } from '../../../../core'; // Use index barrel file if created, or direct paths

// Import Child Presentational Components (ensure they are standalone or imported via a module)
import { WorkersListComponent } from '../workers-list/workers-list.component';
import { FlightsTableComponent } from '../flights-table/flights-table.component';
import { FlightDetailsComponent } from '../flight-details/flight-details.component';

@Component({
  selector: 'app-worker-flights-dashboard', // This selector is used in app.component.html
  standalone: true, // Mark component as standalone
  imports: [
    CommonModule, // Provides common directives like *ngIf, *ngFor, async pipe
    // Import the child components used within this component's template
    WorkersListComponent,
    FlightsTableComponent,
    FlightDetailsComponent,
  ],
  templateUrl: './worker-flights-dashboard.component.html', // Link to the HTML template
  styleUrls: ['./worker-flights-dashboard.component.scss'], // Link to the SCSS styles
  // ChangeDetectionStrategy.OnPush tells Angular to run change detection for this component
  // primarily when its @Input() properties change or an event handler it originated triggers.
  // Works well with immutable data and observables + async pipe, improving performance.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkerFlightsDashboardComponent {
  // --- Public Properties for Template Binding ---
  // Declare public properties to hold the observable streams from the data service.
  // The template will subscribe to these using the 'async' pipe, which handles
  // subscription management automatically.
  workers$: Observable<Worker[]>;
  flights$: Observable<Flight[]>;
  selectedFlight$: Observable<Flight | null>;
  error$: Observable<string | null>;
  isLoadingWorkers$: Observable<boolean>;
  isLoadingFlights$: Observable<boolean>;

  // Inject the FlightDataService using Angular's Dependency Injection system.
  constructor(private flightDataService: FlightDataService) {
    // Assign the public observables from the injected service to the component's properties.
    // This makes them available for binding in the template.
    this.workers$ = this.flightDataService.workers$;
    this.flights$ = this.flightDataService.flights$;
    this.selectedFlight$ = this.flightDataService.selectedFlight$;
    this.error$ = this.flightDataService.error$;
    this.isLoadingWorkers$ = this.flightDataService.isLoadingWorkers$;
    this.isLoadingFlights$ = this.flightDataService.isLoadingFlights$;
  }

  /**
   * Event handler method called when the WorkersListComponent (child)
   * emits its 'workerSelected' output event.
   * This method receives the worker ID from the event payload.
   * It then delegates the action to the central FlightDataService.
   * @param workerId The ID of the worker selected in the WorkersListComponent.
   */
  onWorkerSelect(workerId: number): void {
    // Log the action for debugging purposes
    console.log(
      'Dashboard Component: Received workerSelected event with ID:',
      workerId
    );
    // Call the appropriate method on the service to handle the state change and data fetching.
    this.flightDataService.selectWorker(workerId);
  }

  /**
   * Event handler method called when the FlightsTableComponent (child)
   * emits its 'flightSelected' output event.
   * This method receives the selected Flight object from the event payload.
   * It delegates the action (updating the selected flight state) to the FlightDataService.
   * @param flight The Flight object corresponding to the row selected in the FlightsTableComponent.
   */
  onFlightSelect(flight: Flight): void {
    // Log the action for debugging purposes
    console.log(
      'Dashboard Component: Received flightSelected event for flight:',
      flight.num
    );
    // Call the service method to update the application's selected flight state.
    this.flightDataService.selectFlight(flight);
  }
}

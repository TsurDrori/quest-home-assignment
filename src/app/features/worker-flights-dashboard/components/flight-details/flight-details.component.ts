import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common'; // Import for *ngIf
import { Flight } from '../../../../core/models/flight.model'; // Adjust path as needed
import { DurationPipe } from '../../pipes/duration.pipe'; // Import the custom DurationPipe

@Component({
  selector: 'app-flight-details', // Selector used to embed this component
  standalone: true, // Mark as standalone
  imports: [
    CommonModule, // Provides *ngIf directive
    DurationPipe, // Import the DurationPipe here to make it available in the template
  ],
  templateUrl: './flight-details.component.html',
  styleUrls: ['./flight-details.component.scss'],
  // Use OnPush change detection for performance
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightDetailsComponent {
  // --- Input Properties ---
  // Receives the selected flight object from the parent component (WorkerFlightsDashboardComponent).
  // Can be null if no flight is selected.
  @Input() flight: Flight | null = null;

  // --- Content Projection ---
  // Allows the parent component to provide a custom template for the state
  // when no flight is selected. Looks for a template marked with #noFlightSelected.
  @ContentChild('noFlightSelected')
  noFlightSelectedTemplate: TemplateRef<any> | null = null;

  // No @Output properties are needed as this component only displays data
  // and doesn't emit events based on user interaction within its own scope.
}

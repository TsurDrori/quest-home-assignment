import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common'; // Import for *ngFor, *ngIf
import { Worker } from '../../../../core/models/worker.model'; // Adjust path as needed

@Component({
  selector: 'app-workers-list', // Selector used to embed this component
  standalone: true, // Mark as standalone
  imports: [CommonModule], // Import CommonModule for common directives
  templateUrl: './workers-list.component.html',
  styleUrls: ['./workers-list.component.scss'],
  // Use OnPush change detection strategy for better performance.
  // This component will only re-render if its @Input() properties change reference
  // or if an event originates from within it.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkersListComponent {
  // --- Input Properties ---
  // @Input decorator marks 'workers' as an input property that can receive data
  // from the parent component (WorkerFlightsDashboardComponent).
  // Initialize with an empty array or null for safety.
  @Input() workers: Worker[] | null = [];

  // --- Output Properties ---
  // @Output decorator marks 'workerSelected' as an event emitter.
  // Parent components can listen to this event.
  // EventEmitter<number> specifies that this event will emit a number (the worker ID).
  @Output() workerSelected = new EventEmitter<number>();

  // --- State for Styling ---
  // Keep track of the currently selected worker ID within this component
  // solely for applying the 'active' CSS class.
  selectedWorkerId: number | null = null;

  // --- Content Projection ---
  // @ContentChild allows the parent component to project content (like a custom message)
  // into this component's template using <ng-content> or template outlets.
  // We look for a template marked with #noWorkers.
  @ContentChild('noWorkers') noWorkersTemplate: TemplateRef<any> | null = null;

  /**
   * Method called when a worker item in the list is clicked (via template binding).
   * Updates the local 'selectedWorkerId' for styling and emits the 'workerSelected'
   * event with the clicked worker's ID to notify the parent component.
   * @param workerId The ID of the worker that was clicked.
   */
  selectWorker(workerId: number): void {
    console.log('Workers List Component: Clicked worker', workerId); // Log for debugging
    this.selectedWorkerId = workerId; // Update local state for active class styling
    this.workerSelected.emit(workerId); // Emit the event to the parent
  }

  /**
   * TrackBy function for the *ngFor loop in the template.
   * Improves performance by helping Angular efficiently update the DOM when the
   * 'workers' array changes. Angular uses the returned ID to track items instead
   * of relying on object identity.
   * @param index The index of the item in the *ngFor loop.
   * @param worker The worker object for the current iteration.
   * @returns The unique identifier (id) for the worker.
   */
  trackByWorkerId(index: number, worker: Worker): number {
    return worker.id;
  }
}

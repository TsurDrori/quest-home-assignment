import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  timer,
  EMPTY,
  throwError,
} from 'rxjs';
import {
  catchError,
  switchMap,
  tap,
  takeUntil,
  retry,
  finalize,
} from 'rxjs/operators';
import { Worker } from '../models/worker.model';
import { Flight } from '../models/flight.model';

@Injectable({ providedIn: 'root' })
export class FlightDataService implements OnDestroy {
  private apiUrl = '/api';
  private destroy$ = new Subject<void>();

  // --- Private State Subjects ---
  private workersSubject = new BehaviorSubject<Worker[]>([]);
  private flightsSubject = new BehaviorSubject<Flight[]>([]);
  private selectedFlightSubject = new BehaviorSubject<Flight | null>(null);
  private selectedWorkerIdSubject = new BehaviorSubject<number | null>(null);
  private errorSubject = new BehaviorSubject<string | null>(null);
  private isLoadingWorkersSubject = new BehaviorSubject<boolean>(false);
  private isLoadingFlightsSubject = new BehaviorSubject<boolean>(false);

  // --- Public Observables ---
  workers$: Observable<Worker[]> = this.workersSubject.asObservable();
  flights$: Observable<Flight[]> = this.flightsSubject.asObservable();
  selectedFlight$: Observable<Flight | null> =
    this.selectedFlightSubject.asObservable();
  selectedWorkerId$: Observable<number | null> =
    this.selectedWorkerIdSubject.asObservable();
  error$: Observable<string | null> = this.errorSubject.asObservable();
  isLoadingWorkers$: Observable<boolean> =
    this.isLoadingWorkersSubject.asObservable();
  isLoadingFlights$: Observable<boolean> =
    this.isLoadingFlightsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchWorkers(); // Fetch initial list of workers immediately when the service is created
    this.setupFlightsAutoRefresh(); // Initialize the core reactive logic for fetching flights based on worker selection
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Fetches the list of all workers from the API endpoint.
   * Updates the workers$ stream and manages loading/error states.
   */
  private fetchWorkers(): void {
    this.isLoadingWorkersSubject.next(true);
    this.errorSubject.next(null);

    this.http
      .get<Worker[]>(`${this.apiUrl}/workers`)
      .pipe(
        tap((workers) => {
          this.workersSubject.next(workers);
          console.log('Fetched workers:', workers);
        }),
        catchError((err) => this.handleError(err, 'fetch workers')),
        finalize(() => this.isLoadingWorkersSubject.next(false)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  /**
   * Sets up the main reactive pipeline that handles automatic flight refreshing.
   * Listens to selectedWorkerId$, starts/stops timers, fetches data, and updates state.
   */
  private setupFlightsAutoRefresh(): void {
    this.selectedWorkerId$
      .pipe(
        // switchMap cancels previous inner observable (timer/fetch) when a new workerId arrives.
        // This is key for handling the "timer per worker" requirement.
        switchMap((workerId) => {
          if (workerId === null) {
            // If no worker is selected (e.g., initially or cleared), reset related states.
            this.flightsSubject.next([]);
            this.selectedFlightSubject.next(null);
            this.errorSubject.next(null);
            this.isLoadingFlightsSubject.next(false);
            return EMPTY; // Return EMPTY observable to stop the chain for this case.
          } else {
            // A worker IS selected. Start the timer and fetch cycle.
            // timer(initialDelay, period): Emits immediately (0ms delay), then every 60000ms (1 minute).
            return timer(0, 60000).pipe(
              // tap for logging when the timer ticks (for debugging)
              tap(() =>
                console.log(
                  `Timer tick for worker ${workerId} at ${new Date().toLocaleTimeString()}`
                )
              ),
              // switchMap again: For each timer tick, switch to the inner HTTP request observable.
              // This ensures that if a new timer tick occurs before the previous HTTP request finishes,
              // the previous request *could* be cancelled (though less common for GET requests).
              switchMap(() => {
                this.isLoadingFlightsSubject.next(true); // Set loading state true for the fetch
                this.errorSubject.next(null); // Clear previous fetch errors

                // Perform the HTTP GET request for the selected worker's flights
                return this.http
                  .get<Flight[]>(`${this.apiUrl}/flights/${workerId}`)
                  .pipe(
                    // Optional: Retry the request on transient errors (e.g., network issues)
                    // retry(2),
                    // Handle potential errors specifically for this flight fetch operation
                    catchError((err) =>
                      this.handleError(
                        err,
                        `refresh flights for worker ${workerId}`
                      )
                    ),
                    // Ensure loading stops even if there's an error handled by catchError returning EMPTY
                    finalize(() => this.isLoadingFlightsSubject.next(false))
                  );
              })
            );
          }
        }),
        // This tap operator runs *after* flights are successfully fetched within the switchMap above.
        // It receives the array of flights (or won't run if catchError returned EMPTY).
        tap((flights: Flight[]) => {
          // Type flights explicitly
          this.flightsSubject.next(flights); // Update the flights state observable
          console.log('Refreshed flights:', flights); // Log for debugging

          // --- Default Selection Logic (as per requirement) ---
          const currentSelection = this.selectedFlightSubject.value; // Get currently selected flight
          const firstFlight = flights?.[0] ?? null; // Safely get the first flight or null

          if (!flights || flights.length === 0) {
            // If no flights were returned, clear the selection.
            this.selectFlight(null);
          } else if (
            !currentSelection ||
            !flights.some((f) => this.areFlightsEqual(f, currentSelection))
          ) {
            // If no flight is currently selected OR the previously selected flight
            // is no longer present in the newly fetched list (e.g., data changed server-side),
            // then select the first flight from the new list by default.
            this.selectFlight(firstFlight);
          }
          // Otherwise (a valid flight is selected and still exists), keep the current selection.
        }),
        // Ensure this entire pipeline automatically unsubscribes when the service is destroyed.
        takeUntil(this.destroy$)
      )
      .subscribe({
        // Subscribe to activate the pipeline.
        // next: handled by the 'tap' operator above.
        error: (err) => {
          // This error handler catches critical errors *outside* the inner catchErrors,
          // for example, if the selectedWorkerId$ stream itself errors.
          console.error('Critical error in flight refresh pipeline:', err);
          this.errorSubject.next(
            'A critical error occurred in the flight refresh system.'
          );
          this.isLoadingFlightsSubject.next(false); // Ensure loading stops
        },
      });
  }

  /**
   * PUBLIC method called by components (e.g., WorkerFlightsDashboardComponent)
   * when a user selects a worker from the list.
   * This method updates the selectedWorkerIdSubject, which triggers the reactive
   * pipeline in setupFlightsAutoRefresh to fetch flights for the new worker.
   * @param workerId The ID of the worker selected by the user.
   */
  selectWorker(workerId: number): void {
    // Check if the selected worker ID is actually different from the current one.
    // This prevents redundant processing if the user clicks the same worker again.
    if (workerId !== this.selectedWorkerIdSubject.value) {
      console.log('Service: Selecting worker:', workerId); // Log for debugging
      // Reset state related to the previous worker for better UX responsiveness
      this.flightsSubject.next([]); // Clear previous flights immediately
      this.selectedFlightSubject.next(null); // Clear previous selection
      this.errorSubject.next(null); // Clear previous errors
      this.isLoadingFlightsSubject.next(true); // Show loading indicator immediately

      // Emit the new worker ID. This is the trigger for the switchMap in setupFlightsAutoRefresh.
      this.selectedWorkerIdSubject.next(workerId);
    }
  }

  /**
   * PUBLIC method called by components (e.g., WorkerFlightsDashboardComponent)
   * when a user selects a specific flight from the table.
   * Updates the selectedFlightSubject state.
   * @param flight The flight object selected by the user, or null to clear selection.
   */
  selectFlight(flight: Flight | null): void {
    this.selectedFlightSubject.next(flight); // Update the selected flight state
    console.log('Service: Selected flight:', flight?.num ?? 'None'); // Log for debugging
  }

  /**
   * Private helper method to compare two flight objects for equality.
   * Used in the default selection logic and potentially by components for highlighting.
   * IMPORTANT: Adapt this comparison based on what guarantees uniqueness in your data.
   * Using multiple fields increases the chance of correct comparison.
   */
  private areFlightsEqual(f1: Flight | null, f2: Flight | null): boolean {
    // If either flight is null, they are not equal.
    if (!f1 || !f2) return false;
    // Compare relevant fields that define uniqueness for a flight in this context.
    return (
      f1.num === f2.num &&
      f1.from_date === f2.from_date &&
      f1.from === f2.from &&
      f1.to === f2.to
    );
    // Add more fields (like plane, duration) if necessary for absolute uniqueness.
  }

  /**
   * Centralized private error handler for HTTP requests within this service.
   * Logs the detailed error, updates the public error$ stream with a user-friendly message,
   * and returns EMPTY to allow the main observable stream (e.g., the timer) to continue gracefully
   * without terminating completely due to a single failed request.
   * @param error The HttpErrorResponse object.
   * @param operation A string describing the operation that failed (e.g., 'fetch workers').
   * @returns An Observable that emits nothing and completes (EMPTY).
   */
  private handleError(
    error: HttpErrorResponse,
    operation: string = 'operation'
  ): Observable<never> {
    // Ensure loading indicators are turned off when an error occurs.
    this.isLoadingWorkersSubject.next(false);
    this.isLoadingFlightsSubject.next(false);

    // Log the full error object to the console for detailed developer debugging.
    console.error(`${operation} failed:`, error);

    // Create a user-friendly error message based on the error type.
    let errorMessage = `An unexpected error occurred while trying to ${operation}.`;
    if (error.status === 0 || error.error instanceof ProgressEvent) {
      // Client-side or network error (e.g., CORS issue, DNS error, server unreachable).
      errorMessage = `Network error trying to ${operation}. Please check your connection or if the server is running.`;
    } else if (error.status === 404) {
      // Standard "Not Found" error.
      errorMessage = `Could not find the requested data for ${operation}. (Error 404)`;
    } else if (error.status >= 500) {
      // Server-side error.
      errorMessage = `Server error (${error.status}) during ${operation}. Please try again later.`;
    } else if (error.error && typeof error.error === 'string') {
      // Sometimes backend might send plain text error message
      errorMessage = `Error during ${operation}: ${error.error} (Status: ${error.status})`;
    } else {
      // Other HTTP error codes (4xx).
      errorMessage = `Error ${error.status} during ${operation}.`;
    }

    // Update the public error state observable so components can display the message.
    this.errorSubject.next(errorMessage);

    // Return EMPTY. This completes the inner observable stream for the failed operation
    // without emitting any value and without erroring the main stream (like the timer).
    // This allows the application to recover or continue (e.g., the timer will tick again).
    // If we wanted to stop the timer completely on error, we could use `throwError(() => error)`.
    return EMPTY;
  }
}

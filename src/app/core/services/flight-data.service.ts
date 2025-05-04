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
    this.fetchWorkers();
    this.setupFlightsAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
        switchMap((workerId) => {
          if (workerId === null) {
            // If no worker is selected (e.g., initially or cleared), reset related states.
            this.flightsSubject.next([]);
            this.selectedFlightSubject.next(null);
            this.errorSubject.next(null);
            this.isLoadingFlightsSubject.next(false);
            return EMPTY;
          } else {
            // A worker IS selected. Start the timer and fetch cycle.
            return timer(0, 60000).pipe(
              tap(() =>
                console.log(
                  `Timer tick for worker ${workerId} at ${new Date().toLocaleTimeString()}`
                )
              ),
              // switchMap again: For each timer tick, switch to the inner HTTP request observable.
              // This ensures that if a new timer tick occurs before the previous HTTP request finishes,
              // the previous request could be cancelled
              switchMap(() => {
                this.isLoadingFlightsSubject.next(true);
                this.errorSubject.next(null);

                // Perform the HTTP GET request for the selected worker's flights
                return this.http
                  .get<Flight[]>(`${this.apiUrl}/flights/${workerId}`)
                  .pipe(
                    catchError((err) =>
                      this.handleError(
                        err,
                        `refresh flights for worker ${workerId}`
                      )
                    ),
                    finalize(() => this.isLoadingFlightsSubject.next(false))
                  );
              })
            );
          }
        }),
        // This tap operator runs *after* flights are successfully fetched within the switchMap above.
        // It receives the array of flights (or won't run if catchError returned EMPTY).
        tap((flights: Flight[]) => {
          this.flightsSubject.next(flights);
          console.log('Refreshed flights:', flights);

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
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (err) => {
          console.error('Critical error in flight refresh pipeline:', err);
          this.errorSubject.next(
            'A critical error occurred in the flight refresh system.'
          );
          this.isLoadingFlightsSubject.next(false);
        },
      });
  }

  selectWorker(workerId: number): void {
    if (workerId !== this.selectedWorkerIdSubject.value) {
      console.log('Service: Selecting worker:', workerId);
      this.flightsSubject.next([]);
      this.selectedFlightSubject.next(null);
      this.errorSubject.next(null);
      this.isLoadingFlightsSubject.next(true);

      this.selectedWorkerIdSubject.next(workerId);
    }
  }

  selectFlight(flight: Flight | null): void {
    this.selectedFlightSubject.next(flight);
    console.log('Service: Selected flight:', flight?.num ?? 'None');
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

  private handleError(
    error: HttpErrorResponse,
    operation: string = 'operation'
  ): Observable<never> {
    this.isLoadingWorkersSubject.next(false);
    this.isLoadingFlightsSubject.next(false);

    console.error(`${operation} failed:`, error);

    let errorMessage = `An unexpected error occurred while trying to ${operation}.`;
    if (error.status === 0 || error.error instanceof ProgressEvent) {
      errorMessage = `Network error trying to ${operation}. Please check your connection or if the server is running.`;
    } else if (error.status === 404) {
      errorMessage = `Could not find the requested data for ${operation}. (Error 404)`;
    } else if (error.status >= 500) {
      errorMessage = `Server error (${error.status}) during ${operation}. Please try again later.`;
    } else if (error.error && typeof error.error === 'string') {
      errorMessage = `Error during ${operation}: ${error.error} (Status: ${error.status})`;
    } else {
      errorMessage = `Error ${error.status} during ${operation}.`;
    }

    this.errorSubject.next(errorMessage);

    return EMPTY;
  }
}

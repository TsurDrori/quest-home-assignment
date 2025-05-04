import { Component } from '@angular/core';
import { WorkerFlightsDashboardComponent } from './features/worker-flights-dashboard/components/worker-flights-dashboard/worker-flights-dashboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WorkerFlightsDashboardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'worker-flights-app';
}

import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Flight } from '../../../../core/models/flight.model';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-flight-details',
  standalone: true,
  imports: [CommonModule, DurationPipe],
  templateUrl: './flight-details.component.html',
  styleUrls: ['./flight-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlightDetailsComponent {
  @Input() flight: Flight | null = null;

  @ContentChild('noFlightSelected')
  noFlightSelectedTemplate: TemplateRef<any> | null = null;
}

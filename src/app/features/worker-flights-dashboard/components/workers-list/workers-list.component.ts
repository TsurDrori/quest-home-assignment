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
import { Worker } from '../../../../core/models/worker.model';

@Component({
  selector: 'app-workers-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workers-list.component.html',
  styleUrls: ['./workers-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkersListComponent {
  @Input() workers: Worker[] | null = [];

  @Output() workerSelected = new EventEmitter<number>();

  selectedWorkerId: number | null = null;

  // --- Content Projection ---
  @ContentChild('noWorkers') noWorkersTemplate: TemplateRef<any> | null = null;

  selectWorker(workerId: number): void {
    console.log('Workers List Component: Clicked worker', workerId);
    this.selectedWorkerId = workerId;
    this.workerSelected.emit(workerId);
  }

  trackByWorkerId(index: number, worker: Worker): number {
    return worker.id;
  }
}

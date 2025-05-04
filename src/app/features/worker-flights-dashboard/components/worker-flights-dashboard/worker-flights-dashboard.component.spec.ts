import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerFlightsDashboardComponent } from './worker-flights-dashboard.component';

describe('WorkerFlightsDashboardComponent', () => {
  let component: WorkerFlightsDashboardComponent;
  let fixture: ComponentFixture<WorkerFlightsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkerFlightsDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkerFlightsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

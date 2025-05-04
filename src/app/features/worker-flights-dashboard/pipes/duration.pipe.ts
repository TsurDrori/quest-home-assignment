import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (
      value === null ||
      value === undefined ||
      typeof value !== 'number' ||
      !isFinite(value) ||
      value < 0
    ) {
      console.warn(`DurationPipe received invalid input: ${value}`);
      return '';
    }

    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    return `${hours}h ${minutes}m`;
  }
}

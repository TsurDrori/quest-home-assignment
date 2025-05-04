import { Pipe, PipeTransform } from '@angular/core';

// @Pipe decorator registers the class as a pipe.
// 'name' is how you refer to the pipe in templates (e.g., `value | duration`).
// 'standalone: true' marks it as a standalone pipe, requiring no NgModule declaration (Angular v14+).
@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  /**
   * The core transformation logic of the pipe.
   * Transforms a duration value (expected in minutes) into a "Xh Ym" string format.
   * Implements the PipeTransform interface.
   * @param value The input value (duration in minutes). Expected to be a number.
   * @returns The formatted duration string (e.g., "5h 50m") or an empty string for invalid input.
   */
  transform(value: number | null | undefined): string {
    // --- Input Validation ---
    // Check for null, undefined, non-numeric types, or negative values.
    if (
      value === null ||
      value === undefined ||
      typeof value !== 'number' ||
      !isFinite(value) ||
      value < 0
    ) {
      // Return an empty string for invalid inputs.
      // Depending on requirements, could return 'N/A', '0m', or throw an error.
      console.warn(`DurationPipe received invalid input: ${value}`); // Optional warning
      return '';
    }

    // --- Calculation ---
    // Calculate the whole number of hours.
    const hours = Math.floor(value / 60);
    // Calculate the remaining minutes using the modulo operator.
    const minutes = value % 60;

    // --- Formatting ---
    // Construct the final string in the required "Xh Ym" format.
    return `${hours}h ${minutes}m`;
  }
}

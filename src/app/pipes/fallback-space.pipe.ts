import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fallbackSpace',
  standalone: true,
})
export class FallbackSpacePipe implements PipeTransform {
  transform(input: any): string {
    return !input ? '\u00A0' : input;
  }
}

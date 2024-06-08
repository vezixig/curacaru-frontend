import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'cura-portrait',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './portrait.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortraitComponent {
  name = input.required<string>();
  initials = input.required<string>();
  color = computed(() => this.intToRGB(this.name()));

  /** convert two characters to a color in format #rrggbb */
  // private toColor(str: string): string {
  //   const hash = str.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  //   const color = Math.floor(Math.abs(Math.sin(hash) * 16777215) % 16777215).toString(16);
  //   return `#${color.padStart(6, '0')}`;
  // }

  // toColor(str: string): string {
  //   // Helper function to hash a string into a number
  //   const hashStringToNumber = (s: string): number => {
  //     let hash = 0;
  //     for (let i = 0; i < s.length; i++) {
  //       hash = s.charCodeAt(i) + ((hash << 5) - hash);
  //     }
  //     return hash;
  //   };

  //   // Helper function to convert a number to a 2-digit hexadecimal string
  //   const intToHex = (num: number): string => {
  //     const hex = (num & 0xff).toString(16);
  //     return hex.length === 1 ? '0' + hex : hex;
  //   };

  //   // Generate a hash from the input string
  //   const hash = hashStringToNumber(str);

  //   // Ensure RGB values are more colorful
  //   const r = (hash & 0xff0000) >> 16;
  //   const g = (hash & 0x00ff00) >> 8;
  //   const b = hash & 0x0000ff;

  //   // Normalize and brighten the colors to make them more vibrant
  //   const normalizedR = Math.floor((r / 255) * 200 + 55);
  //   const normalizedG = Math.floor((g / 255) * 200 + 55);
  //   const normalizedB = Math.floor((b / 255) * 200 + 55);

  //   // Convert RGB values to a hexadecimal color code
  //   const hexColor = `#${intToHex(normalizedR)}${intToHex(normalizedG)}${intToHex(normalizedB)}`;
  //   return hexColor;
  // }
  /** this creates more red variants */
  // toColor(stringInput: string) {
  //   let stringUniqueHash = [...stringInput].reduce((acc, char) => {
  //     return char.charCodeAt(0) + ((acc << 5) - acc);
  //   }, 0);
  //   return `hsl(${stringUniqueHash % 360}, 95%, 35%)`;
  // }

  // toColor(str: string) {
  //   let hash = 0;
  //   str.split('').forEach((char) => {
  //     hash = char.charCodeAt(0) + ((hash << 5) - hash);
  //   });
  //   let colour = '#';
  //   for (let i = 0; i < 3; i++) {
  //     const value = (hash >> (i * 8)) & 0xff;
  //     colour += value.toString(16).padStart(2, '0');
  //   }
  //   return colour;
  // }

  hashCode(str: string) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  }

  intToRGB(name: string) {
    const i = this.hashCode(name);
    const c = (i & 0x00ffffff).toString(16).toUpperCase().padStart(6, '0');
    let r = parseInt(c.substring(0, 2), 16);
    let g = parseInt(c.substring(2, 4), 16);
    let b = parseInt(c.substring(4, 6), 16);
    if (r > 235) r = 235;
    if (g > 235) g = 235;
    if (b > 235) b = 235;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

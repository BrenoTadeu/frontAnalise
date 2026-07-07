import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ImageStepperComponent } from './image-stepper.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ImageStepperComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('analiseCristal');
}

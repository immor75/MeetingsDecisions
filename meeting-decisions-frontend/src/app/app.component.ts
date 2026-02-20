// app.component.ts

import { Component } from '@angular/core';
import { DecisionGeneratorComponent } from './components/decision-generator/decision-generator.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DecisionGeneratorComponent],
  template: `
    <div class="app-container">
      <app-decision-generator></app-decision-generator>
      
      <footer class="app-footer">
        <p>&copy; 2025 - Σύστημα Διαχείρισης Συλλογικών Οργάνων</p>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding-bottom: 60px;
      position: relative;
    }

    .app-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      color: white;
      text-align: center;
      padding: 15px;
      font-size: 14px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }

    .app-footer p {
      margin: 0;
      opacity: 0.9;
    }
  `]
})
export class AppComponent {
  title = 'meeting-decisions-frontend';
}
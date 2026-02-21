import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <h1>Καλώς ήρθατε στο Σύστημα Διαχείρισης</h1>
        <p>Επιλέξτε μια από τις παρακάτω λειτουργίες για να ξεκινήσετε.</p>
      </div>

      <div class="cards-grid">
        <!-- Text Extraction Card -->
        <a routerLink="/upload" class="action-card extraction-card">
          <div class="card-icon">📄</div>
          <h2>Εξαγωγή Κειμένου &amp; Δημιουργία Απόφασης</h2>
          <p>Ανεβάστε την εισήγησή σας σε μορφή .docx, αντιστοιχίστε τις ενότητες με το πρότυπο, και παράγετε αυτόματα το προσχέδιο της απόφασης.</p>
          <div class="card-action">
            <span>Έναρξη</span> →
          </div>
        </a>

        <!-- Online Editing Card -->
        <a routerLink="/editor-setup" class="action-card editor-card">
          <div class="card-icon">✏️</div>
          <h2>Online Επεξεργασία Εγγράφου</h2>
          <p>Επεξεργαστείτε online τα έγγραφά σας με το ενσωματωμένο περιβάλλον του Collabora. Ανοίξτε υπάρχοντα έγγραφα μέσω του αναγνωριστικού τους.</p>
          <div class="card-action">
            <span>Άνοιγμα Editor</span> →
          </div>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      padding: 2rem 0;
      animation: fadeIn 0.5s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .hero-section {
      text-align: center;
      margin-bottom: 4rem;
    }

    .hero-section h1 {
      font-size: 2.5rem;
      color: #2d3748;
      margin-bottom: 1rem;
      font-weight: 700;
      letter-spacing: -0.025em;
    }

    .hero-section p {
      font-size: 1.25rem;
      color: #4a5568;
      max-width: 600px;
      margin: 0 auto;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .action-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem 2rem;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid rgba(226, 232, 240, 0.8);
    }

    .action-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 35px rgba(0, 0, 0, 0.1);
    }

    .action-card:hover::before {
      transform: scaleX(1);
    }

    .extraction-card::before {
      background: linear-gradient(90deg, #4299e1, #3182ce);
    }

    .editor-card::before {
      background: linear-gradient(90deg, #9f7aea, #805ad5);
    }

    .card-icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
    }

    .action-card h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 1rem;
    }

    .action-card p {
      color: #718096;
      line-height: 1.6;
      margin-bottom: 2rem;
      flex-grow: 1;
    }

    .card-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #4a5568;
      font-weight: 600;
      font-size: 1.1rem;
      transition: color 0.3s ease;
    }

    .extraction-card:hover .card-action {
      color: #3182ce;
    }

    .editor-card:hover .card-action {
      color: #805ad5;
    }
  `]
})
export class HomeComponent { }

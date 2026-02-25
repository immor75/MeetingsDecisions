import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EditorSetupComponent } from './editor-setup.component';

describe('EditorSetupComponent', () => {
  let component: EditorSetupComponent;
  let fixture: ComponentFixture<EditorSetupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorSetupComponent, FormsModule, RouterModule.forRoot([]), HttpClientTestingModule]
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditorSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

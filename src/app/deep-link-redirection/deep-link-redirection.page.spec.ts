import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DeepLinkRedirectionPage } from './deep-link-redirection.page';

describe('DeepLinkRedirectionPage', () => {
  let component: DeepLinkRedirectionPage;
  let fixture: ComponentFixture<DeepLinkRedirectionPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeepLinkRedirectionPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DeepLinkRedirectionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

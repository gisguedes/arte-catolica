import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HealthService],
    });
    service = TestBed.inject(HealthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should GET /api/health and map response', () => {
    const mock = {
      name: 'ArteCatolica',
      env: 'local',
      version: '12.x',
      checks: { app: true, db: true },
      timestamp: new Date().toISOString(),
    };

    service.get().subscribe((res) => {
      expect(res.checks.app).toBeTrue();
      expect(res.name).toBe('ArteCatolica');
    });

    const req = httpMock.expectOne('/api/health');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });
});

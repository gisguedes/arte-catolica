import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment'; // 👈 importa el entorno actual

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  /*  base de la API
      selecciona automáticamente la URL correcta:
      - local → http://localhost:8000/api
      - staging → https://arte-backend-staging.onrender.com/api
      - prod → https://api.arte-catolica.com/api */
  private readonly baseUrl = environment.apiUrl; 

  getHealth() {
    /*Llama al endpoint de salud del backend Laravel
        prueba simple para comprobar que el FE se conecta correctamente
     */ 
    return this.http.get(`${this.baseUrl}/health`);
  }
}

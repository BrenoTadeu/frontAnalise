import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class IaService{
    private apiUrl = 'https://api-analise-colisao.onrender.com/api/gemini/analisar';
    constructor(private http:HttpClient){}
    enviarImagens(formData : FormData): Observable<any>{
        return this.http.post(this.apiUrl, formData);
    }
}
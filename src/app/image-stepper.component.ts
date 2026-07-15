import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { IaService } from './services/ia.services';
import { AnaliseResponse } from './interfaces/ia.interface';


interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: string;
}

@Component({
  selector: 'app-image-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-stepper.component.html',
  styleUrls: ['./image-stepper.component.css']
})
export class ImageStepperComponent {
  protected readonly steps = ['Escolher Imagens ou Tirar Foto', 'Revisar Fotos', 'Enviar', 'Resposta e Orçamento'];
  protected readonly stepIndex = signal(0);
  protected readonly images = signal<UploadedImage[]>([]);
  protected readonly response = signal('Aguardando envio...');
  protected readonly orcamento = signal<string | null> (null);
  protected readonly responseReady = signal(false);
  protected readonly loading = signal(false);
  protected readonly loadingMessage = signal('');
  private readonly loadingMessages = [
    "Enviando as imagens...",
    "Verificando avarias...",
    "Identificando as peças...",
    "Calculando orçamento..."
  ];
  protected readonly typeResponse = signal('');
  protected readonly showBudget = signal(false);
  protected readonly showImages = signal(false);

  protected get currentStepName(): string {
    return this.steps[this.stepIndex()];
  }

  protected get hasImages(): boolean {
    return this.images().length > 0;
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }

    const newImages = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        file,
        id: `${Date.now()}-${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: this.formatBytes(file.size)
      }))
      .filter(newImage => !this.images().some(image => image.name === newImage.name && image.size === newImage.size));

    if (newImages.length === 0) {
      input.value = '';
      return;
    }

    this.images.update(current => [...current, ...newImages]);
    input.value = '';
  }

  protected goToStep(index: number): void {
    if (index < 0 || index >= this.steps.length) {
      return;
    }

    if (index > 0 && !this.hasImages) {
      return;
    }

    if (index === this.steps.length - 1 && !this.responseReady()) {
      return;
    }

    this.stepIndex.set(index);
  }

  protected previousStep(): void {
    if (this.stepIndex() > 0) {
      this.stepIndex.update(value => value - 1);
    }
  }

  protected nextStep(): void {
    if (this.stepIndex() < this.steps.length - 1) {
      this.stepIndex.update(value => value + 1);
    }
  }

  protected removeImage(id: string): void {
    const match = this.images().find(image => image.id === id);
    if (match) {
      URL.revokeObjectURL(match.previewUrl);
    }

    this.images.update(current => current.filter(image => image.id !== id));
  } 

  private typeWrite(text: string){
    this.typeResponse.set('');
    let index = 0;
    const interval = setInterval(() =>{
      this.typeResponse.update(value => value + text.charAt(index));
      index++;

      if(index >= text.length){
        clearInterval(interval);
        this.showBudget.set(true);
      }
    }, 20);

  }

  private startLoadingAnimation(){
    let index = 0;

    this.loadingMessage.set(this.loadingMessages[0]);
    const interval = setInterval(()=>{
      index++;
      if(index >= this.loadingMessages.length || !this.loading()){
        clearInterval(interval);
        return;
      }

      this.loadingMessage.set(this.loadingMessages[index]);
    }, 1500);
  
  };

  constructor(private iaService: IaService) {}
  protected enviarParaApi(): void {
    if (!this.hasImages) {
      return;
    }

    const formData = new FormData();

    this.loading.set(true);
    this.startLoadingAnimation();
    this.stepIndex.set(3);

    this.images().forEach(image => {
      formData.append('arquivo', image.file);
    })

    this.iaService.enviarImagens(formData).subscribe({
      next: (resposta: AnaliseResponse) =>{
        console.log(resposta);
        this.response.set(resposta.descricaoIa);
        this.typeWrite(resposta.descricaoIa);
        this.orcamento.set(resposta.valor_target?.toString() ?? null);
        this.responseReady.set(true);
        this.loading.set(false);
      },
      error: (error) =>{
        console.log(error)

        this.response.set(
          error.error?.message ??
          'Não foi possível concluir o seu orçamento, porém sua análise foi concluída'
        );
        this.responseReady.set(true);
        this.stepIndex.set(3);
      }
    })
  }

  protected trackById(_: number, item: UploadedImage): string {
    return item.id;
  }

  private formatBytes(value: number): string {
    if (value < 1024) {
      return `${value} B`;
    }
    if (value < 1024 * 1024) {
      return `${Math.round((value / 1024) * 10) / 10} KB`;
    }
    return `${Math.round((value / (1024 * 1024)) * 10) / 10} MB`;
  }
}

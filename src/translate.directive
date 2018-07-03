import {
    AfterViewInit,
    Directive,
    ElementRef,
    Inject,
    Input,
    OnInit,
    ViewContainerRef,
} from '@angular/core';
import {TranslateService} from './translate.service';


@Directive({
               selector: '[translate]',
               exportAs: 'translate'
           })
export class TranslateDirective implements OnInit, AfterViewInit {
    @Input() public param: any;
    @Input() public write: boolean;
    public key: string;
    public value: string;

    constructor(@Inject(TranslateService) private translateService: TranslateService,
                @Inject(ElementRef) private elementRef: ElementRef,
                @Inject(ViewContainerRef) private viewContainer: ViewContainerRef) {
    }

    @Input()
    set translate(value: string) {
        this.key = value;
        this.updateText();
    }

    public ngOnInit(): void {
        this.updateText();
        this.translateService.getActiveLanguageAsObservable().subscribe(() => {
            this.updateText();
        });
    }

    public ngAfterViewInit(): void {
        console.log(this);
    }

    private updateText(): void {
        this.value = this.translateService.translate(this.key, this.param);
        if (this.write) {
            (this.elementRef.nativeElement as HTMLElement).innerText = this.value;
        }
    }
}

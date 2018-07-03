import {
    ChangeDetectorRef,
    Inject,
    Pipe,
    PipeTransform,
    WrappedValue,
} from '@angular/core';
import {TranslateService} from './translate.service';

@Pipe({
          name: 'translate',
      })
export class TranslatePipe implements PipeTransform {

    constructor(@Inject(TranslateService) private translateService: TranslateService,
                @Inject(ChangeDetectorRef) private cd: ChangeDetectorRef) {
    }


    public transform(key: any, ...args: any[]): any {
        const interpolateParams: any = args[0];
        const currentValue: WrappedTranslation = new WrappedTranslation();
        currentValue.text = this.translateService.translate(key, interpolateParams);

        this.translateService.translateAsync(key, interpolateParams).subscribe((latesTextValue: string) => {
            currentValue.text = latesTextValue;
            this.cd.markForCheck();
        });
        return WrappedValue.wrap(currentValue);
    }
}

class WrappedTranslation {
    private _text: string = '';

    set text(value: string) {
        this._text = value;
    }

    get text(): string {
        return this._text;
    }

    public toString(): string {
        return this.text;
    }
}

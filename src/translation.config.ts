import {HttpClient} from '@angular/common/http';
import * as _ from 'lodash';
import {
    ITranslationAsyncLoader,
    ITranslationKeyTransformator,
    LanguageFile,
    TranslateService,
    TranslationLoaderConfig
} from './translate.service';

export const defaultTranslationLoaderConfig: TranslationLoaderConfig = {
    assetLocation: 'assets/translations/',
    languages: undefined
};

export class DefaultTranslationKeyTransformator implements ITranslationKeyTransformator {

    constructor() {
        // nothing
    }

    public transfromKey(key: any, params?: {}): string {
        return key;
    }
}

export class DefaultTranslationAsyncLoader implements ITranslationAsyncLoader {

    constructor(private translateService: TranslateService,
                private httpClient: HttpClient,
                private translationLoaderConfig: TranslationLoaderConfig) {
    }

    public loadTranslations(): () => Promise<any> {
        return (): Promise<void> => {
            return new Promise<void>((resolve: () => void, reject: (param: any) => void) => {
                if (_.isUndefined(this.translationLoaderConfig.languages)) {
                    // if there are no languages provided to load asynchronously, we skip it and therefore resolve the promise
                    resolve();
                }
                const prefix: string = this.translationLoaderConfig.assetLocation;

                let numberOfHandledRequest: number = 0;

                this.translationLoaderConfig.languages.forEach((languageFile: LanguageFile) => {
                    return this.httpClient.get(prefix + languageFile.fileName).subscribe((value: any) => {
                        const translations: Map<string, string> = new Map<string, string>();

                        if (!_.isUndefined(value)) {
                            setTranslationMap('', value, translations);
                            this.translateService.addTranslations(languageFile.language, translations);

                            if (languageFile.default) {
                                this.translateService.useLanguage(languageFile.language);
                            }
                            numberOfHandledRequest += 1;
                            if (numberOfHandledRequest === this.translationLoaderConfig.languages.length) {
                                if (_.isUndefined(this.translateService.getActiveLanguage())) {
                                    // if there was no default provided, we change the default language to the last provided languageFile
                                    this.translateService.useLanguage(languageFile.language);
                                }
                                resolve();
                                return;
                            }
                        }
                    }, (error: any) => {
                        reject(error);
                    });
                });
            });
        };
    }
}


/**
 * Recursively iterates over the result, flattens the received object and adds the 'path' and the value to the translations
 * part of the defaultAsyncLoader
 */
const setTranslationMap: any = (key: string, object: any, translations: Map<string, string>): void => {
    const OBJECT_LITERAL: string = 'object';

    for (const innerKey in object) {
        if (object.hasOwnProperty(innerKey)) {
            if (typeof object[innerKey] === OBJECT_LITERAL) {
                setTranslationMap(getConcatenatedTranslationKey(key, innerKey), object[innerKey], translations);
            } else {
                translations.set(getConcatenatedTranslationKey(key, innerKey), object[innerKey]);
            }
        }
    }
};


/**
 * builds the flattened key for translations
 */
const getConcatenatedTranslationKey: any = (key: string, innerKey: string): string => {
    return key.length === 0 ? innerKey : key + '.' + innerKey;
};

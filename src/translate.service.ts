import {
    Inject,
    Injectable,
    InjectionToken
} from '@angular/core';
import {
    BehaviorSubject,
    Observable,
    Subscriber
} from 'rxjs';
import {DefaultTranslationKeyTransformator} from './translation.config';

export class TranslationLanguage {
    public translations: Map<string, string> = new Map<string, string>();
    public language: any;

    constructor(language?: string, translations?: Map<string, string>) {
        this.translations = translations;
        this.language = language;
    }
}

export interface LanguageFile {
    language: any;
    fileName: string;
    default?: boolean;
}

export interface TranslationLoaderConfig {
    assetLocation: string;
    languages: LanguageFile[];
}

export interface ITranslationKeyTransformator {
    transfromKey(key: any, params?: {}): string;
}

export interface ITranslationAsyncLoader {

    loadTranslations(): () => Promise<void>;
}


export const TranslationLoaderConfig: InjectionToken<TranslationLoaderConfig> = new InjectionToken<TranslationLoaderConfig>('TranslationLoaderConfig');
export const TranslationKeyTransformator: InjectionToken<ITranslationKeyTransformator> = new InjectionToken<ITranslationKeyTransformator>('TranslationKeyTransformator');
export const TranslationAsyncLoader: InjectionToken<ITranslationAsyncLoader> = new InjectionToken<ITranslationAsyncLoader>('TranslationAsyncLoader');

@Injectable()
export class TranslateService {

    private readonly languageTranslationsMap: Map<string, TranslationLanguage> = new Map<string, TranslationLanguage>();
    private readonly translationsSource: BehaviorSubject<TranslationLanguage> = new BehaviorSubject<TranslationLanguage>(undefined);

    /**
     * A map for each active translationkey and its corresponding Observable. If someone is already subscribing to a specific
     * translation and another function subscribse to that same translation, we return the saved observable instead of creating
     * a second one
     *
     * @type {Map<string, Observable<string>>}
     */
    private readonly activeTranslationKeyMap: Map<string, Observable<string>> = new Map<string, Observable<string>>();

    constructor(@Inject(TranslationKeyTransformator) private translationKeyTransformator: ITranslationKeyTransformator) {
        this.validateTranslationKeyTransformator();
    }

    /**
     * This function will handle the translation. It will transform the keys by default
     * (Default transformer simply returns the key unmodified). The transformer is to be used
     * to manipulate the provided keys so they match the keys provided by the translation files.
     * (Think of enums which need to be modified to be used as textKeys)
     * You basically can defined anything as a translationkey as long as you transform it appropriately
     */
    public translate(key: any, interpolateParams?: {}): string {
        const EMPTY_STRING: string = '';

        key = this.translationKeyTransformator.transfromKey(key);
        const activeTranslationLanguage = this.translationsSource.getValue();

        if (!activeTranslationLanguage) {
            return EMPTY_STRING;
        }
        const translationsForLanguage = activeTranslationLanguage.translations;

        let value: string = translationsForLanguage.get(key);

        if (value) {
            try {
                value = this.applyMultification(value, interpolateParams);
                value = this.interpolate(value, interpolateParams);
                value = this.translateNestedKeys(value, interpolateParams);
            } catch (error) {
                error.message = 'Could not translate \'' + key + '\'\n' + error.message;
                throw error;
            }
        }
        return value;
    }

    /**
     * This function will create an observable object for a specific translation to which you can subscribe.
     * In other words, if the language gets switched you will immediatly be notified with the new value without
     * calling translateService.translate() again. you can pair this function with the angular async pipe.
     */
    public translateAsync(key: any, interpolateParams?: {}): Observable<string> {
        if (this.activeTranslationKeyMap.has(key)) {
            return this.activeTranslationKeyMap.get(key);
        }

        const translationKeyObservable: Observable<string> = Observable.create((subscriber: Subscriber<string>) => {
            this.getActiveLanguageAsObservable().subscribe(() => {
                subscriber.next(this.translate(key, interpolateParams));
            });
        });
        this.activeTranslationKeyMap.set(key, translationKeyObservable);
        return translationKeyObservable;
    }

    /**
     * LanguageKey can be anything you want as long as Map can handle them as a key
     */
    public useLanguage(languageKey: any): void {
        if (this.languageTranslationsMap.has(languageKey)) {
            this.switchLanguageTo(languageKey);
        }
    }

    /**
     * This functions adds additional translations for a specific languagekey. if the languagekey
     * already is present in the map, we add the translations to said key, otherwise we create
     * a new entry. This will not trigger any update event whatsoeveer
     */
    public addTranslations(languageKey: any, translations: Map<string, string>): void {
        const translationsForProvidedLanguage: TranslationLanguage = this.languageTranslationsMap.get(languageKey);

        if (translationsForProvidedLanguage) {
            translations.forEach((value: string, key: string) => {
                translationsForProvidedLanguage.translations.set(key, value);
            });
        } else {
            this.languageTranslationsMap.set(languageKey, new TranslationLanguage(languageKey, translations));
        }
    }

    /**
     * Returns the activeLanguage, which will provide you with the languageKey and the whole
     * translationsMap
     */
    public getActiveLanguage(): TranslationLanguage {
        return this.translationsSource.getValue();
    }

    /**
     * Register yourself to any languageswitch event.
     */
    public getActiveLanguageAsObservable(): Observable<TranslationLanguage> {
        return this.translationsSource.asObservable();
    }

    /**
     * Interpolates the string. Interpolation must be used like the following:
     * 'Lorem ipsum {yourVariable} dolor sit amen'
     * The function will cut out yourVariable, access the value provided by interpolateParams,
     * replace {yourVariable} by the actual value and return the string
     */
    private interpolate(value: string, interpolateParams: {}): string {
        // Ausgang: 'In 68 von 100 Fällen liegt Ihr Vermögen nach {jahreCount} Jahren'
        const interpolateRegex: RegExp = /{\w*}/mg; // finds '{jahreCount}'
        const matches: string[] = value.match(interpolateRegex);

        if (matches && matches !== null) {
            if (!interpolateParams) {
                throw Error('Translation needs to be interpolated but no interpolateParam Object was provided for \'' + value + '\'');
            }
            matches.forEach((interpolateParamKey: string) => {
                // the variablename gets extracted from the string '{jahreCount}' => 'jahreCount'
                const interpolateParamObjectKey = interpolateParamKey.split('{').join('').split('}').join('');

                // replace '{jahreCount}' by the value provided via interpolateParams
                // 'In 68 von 100 Fällen liegt Ihr Vermögen nach {jahreCount} Jahren' => 'In 68 von 100 Fällen liegt Ihr Vermögen nach 5 Jahren'
                if (interpolateParams.hasOwnProperty(interpolateParamObjectKey)) {
                    const interpolateParamValue: any = (interpolateParams as any)[interpolateParamObjectKey];
                    value = value.replace(interpolateParamKey, interpolateParamValue);
                } else {
                    throw Error('No interpolate value provided for \'' + value + '\'. You need to define an attribute \'' + interpolateParamObjectKey + '\' in your interpolateParam Object');
                }
            });
        }
        return value;
    }

    /**
     * This function will translate every nested translation (an already translated key now contains another translationkey which needs to be translated)
     */
    private translateNestedKeys(value: string, interpolateParams: {}): string {
        const additionalTranslationRegEx: RegExp = /{translate, .*?}/mg;

        // check for additional translations (interpolation could have inserted a string which also needs to be translated)
        const additionalTranslations: string[] = value.match(additionalTranslationRegEx);
        if (additionalTranslations !== null) {
            additionalTranslations.forEach((additionalTranslation: string) => {
                const additionalKey: string = additionalTranslation.replace('{translate, ', '').replace('}', '').trim();
                value = value.replace(additionalTranslation, this.translate(additionalKey, interpolateParams));
            });
        }
        return value;
    }

    /**
     * Applies multification. multification in a string must be used like the following:
     * 'Lorem ipsum {yourVariable, plural, one{TheStringForOne} other{TheOtherString}} dolor sit amen'
     * The function will cut out the multification part, take the variablename provided,
     * access the value provided by interpolateParams, check whether the value provided is 1,
     * replaces the whole multification string with the value for 'one' or the 'other' value and returns it
     */
    private applyMultification(value: string, interpolateParams: {}): string {
        // Ausgang: 'In 68 von 100 Fällen liegt Ihr Vermögen nach {jahreCount} {jahreCount, plural, one{Jahr} other{Jahren}} zwischen {betrag1} und {betrag2}'
        const multificationRegex: RegExp = /{\w*, plural, one{(.*?)} other{(.*?)}}/mg; // finds '{jahreCount, plural, one{Jahr} other{Jahren}}'
        const variableNameRegExp: RegExp = /{\w*,/mg; // finds '{jahreCount,'
        const singleRegEx: RegExp = /one{(.*?)}/; // finds 'one{Jahr}'
        const multiRegEx: RegExp = /other{(.*?)}/; // finds 'other{Jahren}'

        const multificationMatches: string[] = value.match(multificationRegex);
        if (multificationMatches !== null) {
            multificationMatches.forEach((multification: string) => {
                // exports 'jahreCount' from '{jahreCount,' within the multification '{jahreCount, plural, one{Jahr} other{Jahren}}'
                const variableName: string = multification.match(variableNameRegExp)[0].replace('{', '').replace(',', '');
                if (interpolateParams && (interpolateParams as any)[variableName] === 1) {
                    // replaces the '{jahreCount, plural, one{Jahr} other{Jahren}}' (multification) by 'Jahr' in the Ausgangstring
                    value = value.replace(multification, multification.match(singleRegEx)[0].replace('one{', '').replace('}', ''));
                } else {
                    // replaces the '{jahreCount, plural, one{Jahr} other{Jahren}}' (multification) by 'Jahren' in the Ausgangstring
                    value = value.replace(multification, multification.match(multiRegEx)[0].replace('other{', '').replace('}', ''));
                }
            });
        }
        return value;
    }

    /**
     * Will actively change the language to the desired language and notify every subscription
     */
    private switchLanguageTo(languageKey: any): void {
        const activeLanguage: TranslationLanguage = this.languageTranslationsMap.get(languageKey);
        if (activeLanguage) {
            this.translationsSource.next(activeLanguage);
        }
    }

    /**
     * checks if the provided TranslationKeyTransformator implements the correct interfaces. If not,
     * we assign the default transformator
     */
    private validateTranslationKeyTransformator(): void {
        if (typeof this.translationKeyTransformator.transfromKey !== 'function') {
            this.translationKeyTransformator = new DefaultTranslationKeyTransformator();
            console.warn('The provided TranslationKeyTransformator does not implement ITranslationKeyTransformator interface\nTranslationKeyTransformator now uses the default transformator');
        }
    }
}

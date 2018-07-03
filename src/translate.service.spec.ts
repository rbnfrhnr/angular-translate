import {
    ITranslationKeyTransformator,
    TranslateService,
    TranslationLanguage
} from './translate.service';

describe('app.services.translate.TranslateService', () => {
    const transformator: ITranslationKeyTransformator = {
        transfromKey: (key: any): string => {
            return key;
        }
    };

    let translateService: TranslateService;

    beforeEach(() => {
        translateService = new TranslateService(transformator);
        const deTranslations: Map<string, string> = new Map<string, string>();
        deTranslations.set('TEST.WITH_INTERPOLATION', 'Hallo {name} {nachname} du bist {alter} jahre alt');
        deTranslations.set('TEST.WITHOUT_INTERPOLATION', 'Dies ist ein Test');
        deTranslations.set('TEST.WITH_INTERPOLATION_AND_MULTIFICATION', 'In 68 von 100 Fällen liegt Ihr Vermögen nach {jahreCount} {jahreCount, plural, one{Jahr} other{Jahren}} zwischen {betrag1} und {betrag2}');
        deTranslations.set('TEST.WITH_MULTIFICATION', 'In 68 von 100 Fällen liegt Ihr Vermögen nach {jahreCount, plural, one{Jahr} other{Jahren}}');
        translateService.addTranslations('de', deTranslations);

        const enTranslations: Map<string, string> = new Map<string, string>();
        enTranslations.set('TEST.WITH_INTERPOLATION', 'Good day {name} {nachname} you are {alter} years of age');
        enTranslations.set('TEST.WITHOUT_INTERPOLATION', 'This is a test');
        translateService.addTranslations('en', enTranslations);

        translateService.useLanguage('de');
    });

    it('should translate without interpolation', () => {
        const translation: string = translateService.translate('TEST.WITHOUT_INTERPOLATION');
        expect(translation).toEqual('Dies ist ein Test');
    });


    it('should translate with interpolation', () => {
        const translation: string = translateService.translate('TEST.WITH_INTERPOLATION', {
            alter: 21,
            nachname: 'Frehner',
            name: 'Robin'
        });
        expect(translation).toEqual('Hallo Robin Frehner du bist 21 jahre alt');
    });

    it('should translate with multification and no parameter defined and evaluate other{...}', () => {
        const translation: string = translateService.translate('TEST.WITH_MULTIFICATION');
        expect(translation).toEqual('In 68 von 100 Fällen liegt Ihr Vermögen nach Jahren');
    });

    it('should translate, adapt multification and interpolate', () => {
        const translation: string = translateService.translate('TEST.WITH_INTERPOLATION_AND_MULTIFICATION', {
            betrag1: 'CHF 4000',
            betrag2: 'CHF 10000 ',
            jahreCount: 5,
        });
        expect(translation).toEqual('In 68 von 100 Fällen liegt Ihr Vermögen nach 5 Jahren zwischen CHF 4000 und CHF 10000');
    });

    it('should subscribe to a certain translation', () => {
        translateService.translateAsync('TEST.WITHOUT_INTERPOLATION').subscribe((translation: string) => {
            if (translateService.getActiveLanguage().language === 'de') {
                expect(translation).toEqual('Dies ist ein Test');
            } else if (translateService.getActiveLanguage().language === 'en') {
                expect(translation).toEqual('This is a test');
            }
        });
        translateService.useLanguage('en');
    });

    it('should react on language switch', () => {
        let notificationIndex: number = 1; // indicates how many times subscribed function gets triggered. first, initial call with current value (de) and second call on changed value (en)
        translateService.getActiveLanguageAsObservable().subscribe((activeLanguage: TranslationLanguage) => {
            if (notificationIndex === 1) {
                expect(activeLanguage.language).toEqual('de');
            } else {
                expect(activeLanguage.language).toEqual('en');
            }
            notificationIndex++;
        });
        translateService.useLanguage('en');

    });

    it('should get the currently active language', () => {
        expect(translateService.getActiveLanguage().language).toEqual('de');
    });

});

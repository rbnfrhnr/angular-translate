import {CommonModule} from '@angular/common';
import {
    HttpClient,
    HttpClientModule
} from '@angular/common/http';
import {
    APP_INITIALIZER,
    NgModule
} from '@angular/core';
import {TranslateDirective} from './translate.directive';
import {
    TranslatePipe,
} from './translate.filter';
import {
    ITranslationAsyncLoader,
    TranslateService,
    TranslationAsyncLoader,
    TranslationKeyTransformator,
    TranslationLoaderConfig
} from './translate.service';
import {
    DefaultTranslationAsyncLoader,
    DefaultTranslationKeyTransformator,
    defaultTranslationLoaderConfig,
} from './translation.config';

/**
 * TranslateModule
 *
 * Configuration/Loading
 *
 *  There are two ways to configure or load your translations
 *  1:  You can provide your own TranslationLoaderConfig, which means you define your json files which will
 *      be fetched asynchronously by the default TranslationAsyncLoader. The default TranslationAsyncLoader
 *      will only be executed if the TranslationLoaderConfig provides a list of languages. If the language
 *      list is set to undefined, async call will not be executed.
 *      After fetching the provided json files, TranslationAsyncLoader will flatten the json and add the
 *      'path' and its corresponding value to the translation service.
 *      The TranslationAsyncLoader will be executed before the Application gets bootrstrapped
 *
 *  2:  If you need to load your translations in a different way, you can define your own TranslationAsyncLoader.
 *      This way you can forget about providing your own TranslationConfig and implement your own procedure to
 *      load, transform and add your translations to the service.
 *      Your custom TranslationAsyncLoader will as well be executed before Angular boostraps your application
 *
 * TranslationKeyTransformator
 *
 *  By Default the TranslationService will apply a key transformation while translating. The Default
 *  TranslationKeyTransformator will simply return the key wihtout modification. However, if you feel the
 *  need to transform your translationkeys provided to the translate() function of the service, you can
 *  provide your own implementation of a TranslationKeyTransformator. Make sure your transformator implements
 *  the ITranslationKeyTransformator interface
 *
 */
@NgModule({
              imports: [CommonModule, HttpClientModule],
              declarations: [TranslateDirective, TranslatePipe],
              exports: [TranslateDirective, TranslatePipe],
              providers: [
                  {
                      provide: TranslationKeyTransformator,
                      useFactory: () => new DefaultTranslationKeyTransformator(),
                  },
                  {
                      provide: TranslationLoaderConfig,
                      useValue: defaultTranslationLoaderConfig
                  },
                  {
                      deps: [TranslationKeyTransformator],
                      provide: TranslateService,
                      useFactory: (translationKeyTransformator: any) => new TranslateService(translationKeyTransformator)
                  },
                  {
                      deps: [TranslateService, HttpClient, TranslationLoaderConfig],
                      provide: TranslationAsyncLoader,
                      useFactory: (translateService: any, httpClient: any, translationLoaderConfig: any) => new DefaultTranslationAsyncLoader(translateService, httpClient, translationLoaderConfig),
                  },
                  {
                      deps: [TranslationAsyncLoader],
                      multi: true,
                      provide: APP_INITIALIZER,
                      useFactory: (translationAsyncLoader: ITranslationAsyncLoader) => translationAsyncLoader.loadTranslations()
                  },
              ]
          })
export class TranslateModule {

}

# angular-translate

Angular Translate is an Angular Lib for translating your application.

# How to use

Import the TranslateModule to your NgModule. If you want to use the default for everythig, the only thing you need to configure and provide is the TranslationLoaderConfig. 
```typescript
const translationLoaderConfig: TranslationLoaderConfig = {
   assetLocation: 'assets/translations/',
    languages: [{
        default: true,
        fileName: 'de.json',
        language: 'de'
    }, {
        fileName: 'en.json',
        language: 'en'
    }]
}
```
```typescript
 providers: [{
                      provide: TranslationLoaderConfig,
                      useValue: translationLoaderConfig
                  },
              ],
```
When you are using the default configuration, your translations need to be provided like the following:
```json
{
  "showcase": {
    "helloWorld": "hello World"
  }
}
```
The default TranslationAsyncLoader will generate a key value pairs like the following:
'showcase.helloworld' => "hello World'. In other words, this is what you need to provide to the translate service.

# Custom Configuration

If you want to configure angular-translate further, you have the following options:
 - TranslationKeyTransformator
 - TranslationAsyncLoader
 
 ## TranslationKeyTransformator
 The TranslationKeyTransformator is a small service, which allows you to modify the translationkey provided to the translation service. TranformKey(key: any) will be executed everytime the translate function is invoked. If you want to translate enums for instance, you could define them in your json like this:
 ```json
 {
  "enum":{
    "myEnum":{
      "A" : "Hello",
      "B" : "world"
    }
  }
}
```
Now you can specify your TranslationKeyTransformator this way:
```typescript
public class CustomKeyTransformator implements ITranslationKeyTransformator
    public transfromKey(key: string | Enum): string {
        if (key as any instanceof Enum) {
            // Get Name of Enum
              return 'enum.' + enumName + '.' + (key as any).name;
        }   
        // ...
    }
}
```
```typescript
 providers: [{
                      provide: TranslationKeyTransformator,
                      useFactory: () => new CustomKeyTransformator()
                  },
              ],
```

## TranslationAsyncLoader
TranslationAsyncLoader is responsible of fetching the json files, generating the keys, and adding them to the translate service. If you need to load or generate differently than the default loader does it, you can very well create your own. There are a few things to pay attention to. 
  - TranslationAsyncLoader will be added to the APP_INITIALIZER.
  - Because of the aforementioned, the function in charge of fetching and generating needs to return a promise
  - The function will be executed before the application gets bootstrapped.
 An Example:
 ```typescript
 export class CustomTranslationAsyncLoader implements ITranslationAsyncLoader {

    constructor(private translateService: TranslateService,
                private httpClient: HttpClient,
                private translationLoaderConfig: TranslationLoaderConfig) {
    }

    public loadTranslations(): () => Promise<any> {
        return (): Promise<void> => {
            return new Promise<void>((resolve: () => void, reject: (param: any) => void) => {
               // ...
            });
        };
    }
}
 ```
 
 ```typescript
 providers: [ {
                      deps: [TranslateService, HttpClient, TranslationLoaderConfig],
                      provide: TranslationAsyncLoader,
                      useFactory: (translateService: TranslateService, httpClient: HttpClient, translationLoaderConfig: TranslationLoaderConfig) => new CustomTranslationAsyncLoader(translateService, httpClient, translationLoaderConfig),
                  },
              ],
```
 
 # Pipe
 angular-translate comes with a pipe to use in your angular templates. Despite the pipe being pure, it still can adapt to changes such as language switches. 
 
 

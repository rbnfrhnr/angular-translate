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
 The TranslationKeyTransformator is a small service, which allows you to modify the translationkey provided to the translation service. If you want to translate enums for instance, you could define them in your json like this:
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
now you can specify your TranslationKeyTransformator this way:
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

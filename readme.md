fis-postpackager-autojspack
===========================

基于一个简单的打包策略：不被依赖的js文件是入口文件，将其依赖树下游的文件打包到一起就可以独立运行。
在map中新增字段```aio```

```js
{
  "res" : {...},
  "pkg" : {...},
  "aio" : {
    "namespace:aio_uri" : {
      "uri"  : "uri",
      "type" : "js",
      "has"  : [...]
    }
  }
}
```

### usaage

```
fis.config.set('modules.postpackager', require('fis-postpackager-autojspack'));
```
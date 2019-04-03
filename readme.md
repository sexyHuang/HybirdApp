## HybirdApp

一个通用 HybirdApp 接口包装类。

## 特性

- Promise 的形式使用回调

## 上手

引入 `dist/HybirdApp.min.js` 到项目中：

```html
<script src="path/to/HybirdApp.min.js"></script>
<script>
  // 初始化
  var HybirdApp = new HybirdApp(configs);
  HybirdApp.runApi('apiName')(datas)
    .then(() => {
      console.log('success');
    })
    .catch(() => {
      console.log('fail');
    });
</script>
```



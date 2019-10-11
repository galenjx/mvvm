function MVVM(options) {
    //将配置对象保存到vm
    this.$options = options || {};
    //将配置对象的data保存到vm._data与变量data
    var data = this._data = this.$options.data;
    var me = this;

    // 数据代理
    //变量data所有属性
    Object.keys(data).forEach(function(key) {
        //对相应属性实现代理
        me._proxyData(key);
    });

    this._initComputed();

    observe(data, this);

    //$compile 1=========创建一个编译对象，编译和解析模板，传递了el与vm
    this.$compile = new Compile(options.el || document.body, this)
}

MVVM.prototype = {
    constructor: MVVM,
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },

    // 实现 vm.xxx -> vm._data.xxx
    _proxyData: function(key) {
        var me = this;
        //给vm添加属性名的属性
        Object.defineProperty(me, key, {
            configurable: false,//不可重新定义
            enumerable: true,
            //读vm.xxx时到他的_data下拿
            get: function proxyGetter() {
                return me._data[key];
            },
            //写vm.xxx时写到他的_data下，本身并不直接存
            set: function proxySetter(newVal) {
                me._data[key] = newVal;
            }
        });
    },

    _initComputed: function() {
        var me = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function(key) {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function' 
                            ? computed[key] 
                            : computed[key].get,
                    set: function() {}
                });
            });
        }
    }
};
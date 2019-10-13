
//observe======3
function Observer(data) {
    this.data = data;
    //开始对data的监视
    this.walk(data);
}

Observer.prototype = {
    constructor: Observer,
    walk: function(data) {
        // 保存observer实例对象
        var me = this;
        //遍历data中所有属性
        Object.keys(data).forEach(function(key) {
            //对指定的属性进行劫持，实现响应式数据绑定
            me.convert(key, data[key]);
        });
    },
    convert: function(key, val) {
        //对指定的属性进行劫持，实现响应式数据绑定
        this.defineReactive(this.data, key, val);
    },

    defineReactive: function(data, key, val) {
        //创建对应的依赖，dep对象对应data中的一个key
        //observe======4
        var dep = new Dep();
        //通过间接的递归调用实现对data中所有属性的数据劫持
        var childObj = observe(val);
        //给data重新定义属性，添加get，set
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define

            get: function() {
                //相应的watcher存在
                if (Dep.target) {
                    //建立dep与watcher的关系
                    // function Dep() {
                    //     this.id = uid++;
                    //     this.subs = [];
                    // }
                    dep.depend();
                }
                return val;
            },
            //监视key属性变化，更新界面
            //observe======5
            set: function(newVal) {
                if (newVal === val) {
                    return;
                }
                val = newVal;
                // 新的值是object的话，进行监听
                childObj = observe(newVal);
                // 通知所有相关的订阅者（watcher）
                dep.notify();
            }
        });
    }
};
//observe======2
function observe(value, vm) {
    //必须是一个对象
    if (!value || typeof value !== 'object') {
        return;
    }
    //创建对应的观察者
    return new Observer(value);
};


var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    //添加watcher到dep
    addSub: function(sub) {
        this.subs.push(sub);
    },
    
    //添加dep到watcher
    depend: function() {
        Dep.target.addDep(this);
    },

    removeSub: function(sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },
    //observe======6
    notify: function() {
        //通知所有的watcher进行更新
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }
};

Dep.target = null;
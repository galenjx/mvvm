// $compile 2=========
function Compile(el, vm) {
    //保存到vm对象compile
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);

    if (this.$el) {
        //取出el元素所有子节点保存到一个对象$fragment中
        this.$fragment = this.node2Fragment(this.$el);
        //编译fragment中所有层次子节点
        this.init();
        //将编译好的fragment添加到el中
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    constructor: Compile,
    // $compile 3=========
    node2Fragment: function(el) {
        //在内存中创建空的fragment
        var fragment = document.createDocumentFragment(),
            child;

        // 将el所有子节点转移到fragment
        while (child = el.firstChild) {
            //一个节点只能有一个父亲，所以遍历到最后只有空的el.firstChild
            fragment.appendChild(child);
        }

        return fragment;
    },
    // $compile 4=========
    init: function() {
        //编译所有层次的子节点
        this.compileElement(this.$fragment);
    },
    // $compile 5=========
    compileElement: function(el) {
        //取出最外层所有子节点
        var childNodes = el.childNodes,
        //保存对象compile
            me = this;
        //遍历所有子节点
        [].slice.call(childNodes).forEach(function(node) {
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;

            if (me.isElementNode(node)) {
                //编译指令
                me.compile(node);

                //判断节点是否为大括号格式的文本节点
            } else if (me.isTextNode(node) && reg.test(text)) {
                //编译大括号表达式的文本节点
                me.compileText(node, RegExp.$1.trim());
            }

            //如果当前节点还有子节点，递归
            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        });
    },
    // $compile 7-1=========
    compile: function(node) {
        //获取所有属性
        var nodeAttrs = node.attributes,
        //保存对象compile
            me = this;
        [].slice.call(nodeAttrs).forEach(function(attr) {
            //v-on:click
            var attrName = attr.name;
            //判断是不是指令v-
            if (me.isDirective(attrName)) {
                //拿到指令表达式hide，msg...
                var exp = attr.value;
                //去掉v-
                var dir = attrName.substring(2);
                // 事件指令有on
                if (me.isEventDirective(dir)) {
                      // $compile 7-1-1=========
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                // 普通指令
                } else {
                    // $compile 7-2-1=========
                    //对应指令找对应的方法去处理方法     dir：text exp：msg
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }
                //移除指令属性
                node.removeAttribute(attrName);
            }
        });
    },

    // $compile 6-2========={{name}}，name
    compileText: function(node, exp) {
        compileUtil.text(node, this.$vm, exp);
    },

    isDirective: function(attr) {
        return attr.indexOf('v-') == 0;
    },

    isEventDirective: function(dir) {
        return dir.indexOf('on') === 0;
    },

    isElementNode: function(node) {
        return node.nodeType == 1;
    },

    isTextNode: function(node) {
        return node.nodeType == 3;
    }
};

// $compile 6-3=========
// 解析指令处理对象 有v-text v-html v-class v-model 主要由bind去工作
var compileUtil = {
    // $compile 7-2-2=========找到的相应指令的处理函数
    text: function(node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },

    html: function(node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },

    model: function(node, vm, exp) {
        // 初始化显示并创建一个watcher
        this.bind(node, vm, exp, 'model');
        var me = this,
        // 得到表达式的值
            val = this._getVMVal(vm, exp);
            // 给当前的节点绑定input事件，内容变化即触发
        node.addEventListener('input', function(e) {
            //输入框的值
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }
            //给相应的属性设置相应的值——>对应的set——>dep——>watcher——>更新视图
            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },

    class: function(node, vm, exp) {
        this.bind(node, vm, exp, 'class');
    },

    // $compile 6-4=========
    bind: function(node, vm, exp, dir) {
        //得到更新节点的函数，在updater
        // $compile 7-2-3=========真实的处理函数
        var updaterFn = updater[dir + 'Updater'];
        //调用函数更新节点
        updaterFn && updaterFn(node, this._getVMVal(vm, exp));

        //为表达式创建一个对应的watcher，实现节点更新显示，表达式更新时回调函数执行更新
        new Watcher(vm, exp, function(value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue);
        });
    },

    // 事件处理
    // $compile 7-1-1=========
    eventHandler: function(node, vm, exp, dir) {
        //处理出事件名click
        var eventType = dir.split(':')[1],
        //拿到事件处理函数methods下面找
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            //有时间名，有处理函数，给元素绑定事件，bind强制绑定this为vm
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },

    //从vm得到表达式对应的值
    _getVMVal: function(vm, exp) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k) {
            val = val[k];
        });
        return val;
    },

    _setVMVal: function(vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function(k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
};

// $compile 6-5=========
//更新节点方法的对象 textContent innerHTML className value
var updater = {
    textUpdater: function(node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },

    htmlUpdater: function(node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },

    classUpdater: function(node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');

        var space = className && String(value) ? ' ' : '';

        node.className = className + space + value;
    },

    modelUpdater: function(node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
};
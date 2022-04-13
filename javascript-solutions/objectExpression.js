"use strict";

function Const(value) {
    this.value = value;
}
Const.prototype.toString = function() { return String(this.value); };
Const.prototype.evaluate = function() { return this.value; };

Const.prototype.isConst = function() { return true; };
Const.prototype.diff = function() { return new Const(0); };
Const.prototype.simplify = function() { return this; };
Const.prototype.prefix = function() { return this.toString(); };
Const.prototype.postfix = function() { return this.toString(); };

function Variable(name) {
    this.name = name;
}
Variable.prototype.toString = function() { return this.name; };
Variable.prototype.evaluate = function(...args) {
    return args["xyz".indexOf(this.name)];
};

Variable.prototype.isConst = function(variable) { return false; };
Variable.prototype.diff = function(variable) {
    return new Const((variable === this.name) ? 1 : 0);
};
Variable.prototype.simplify = function() { return this; };
Variable.prototype.prefix = function() { return this.toString(); };
Variable.prototype.postfix = function() { return this.toString(); };


function Operation(sign, func, /*isConst,*/ _diff, _simplify, ...args) {
    this.sign = sign;
    this.func = func;
    this._diff = _diff;
    this._simplify = _simplify;
    this.args = [...args];
}

Operation.prototype.toString = function() {
    return this.args.join(' ') + ' ' + this.sign;
};
Operation.prototype.evaluate = function(x, y, z) {
    return this.func(...this.args.map(arg => arg.evaluate(x, y, z)));
};

Operation.prototype.isConst = function() {
    return this.args.map(arg => arg.isConst()).indexOf(false) === -1;
};
Operation.prototype.diff = function(variable) {
    // if (this.isConst()) {
    //     // return new Const(this.evaluate());
    //     return new Const(0);
    // }
    // println('diff ' + this._diff(variable, ...this.args.map(arg => arg.diff(variable))));
    // return this._diff(...this.args.map(arg => arg.diff(variable))).simplify();
    let a = this._diff(...this.args.map(arg => arg.diff(variable))).simplify();
    return a;
};
Operation.prototype.simplify = function() {
    if (this.isConst()) {
        // println(this.evaluate());
        return new Const(this.evaluate());
    }
    // println(this._simplify(...this.args.map(arg => arg.simplify())));
    return this._simplify(...this.args.map(arg => arg.simplify()));
};
Operation.prototype.prefix = function() {
    return '(' + this.sign + ' ' + this.args.map(arg => arg.prefix()).join(' ') + ')';
}
Operation.prototype.postfix = function() {
    return '(' + this.args.map(arg => arg.postfix()).join(' ') + ' ' + this.sign + ')';
}

function Negate(arg1) { return new Operation(
    'negate',
    function(a) { return -a; },
    function(a) { return new Negate(a).simplify(); },
    function(a) {
        if (a.isConst()) {
            return new Const(-a.evaluate());
        }
        return new Negate(a);
    },
    arg1
)}

function Add(arg1, arg2) { return new Operation(
    '+',
    function(a, b) { return a + b; },
    function(a, b) { return new Add(a, b); },
    function(a, b) {
        if (a.isConst() && a.evaluate() === 0) {
            return b;
        } if (b.isConst() && b.evaluate() === 0) {
            return a;
        }
        return new Add(a, b);
    },
    arg1, arg2
)}

function Subtract(arg1, arg2) { return new Operation(
    '-',
    function(a, b) { return a - b; },
    function(a, b) { return new Subtract(a, b); },
    function(a, b) {
        if (a.isConst() && a.evaluate() === 0) {
            return new Negate(b);
        } if (b.isConst() && b.evaluate() === 0) {
            return a;
        }
        return new Subtract(a, b);
    },
    arg1, arg2
)}

function Multiply(arg1, arg2) { return new Operation(
    '*',
    function(a, b) { return a * b; },
    function(a, b) {
        return new Add(
            new Multiply(a, arg2),
            new Multiply(arg1, b)
        );
    },
    function(a, b) {
        if (a.isConst()) {
            switch (a.evaluate()) {
                case 0: return new Const(0);
                case 1: return b;
            }
        } if (b.isConst()) {
            switch (b.evaluate()) {
                case 0: return new Const(0);
                case 1: return a;
            }
        }
        return new Multiply(a, b);
    },
    arg1, arg2
)}

function Divide(arg1, arg2) { return new Operation(
    '/',
    function(a, b) { return a / b; },
    function(a, b) {
        if (a.isConst() && b.isConst()) {
            if (a.evaluate() === 0 && b.evaluate() === 0) {
                return new Const(0);
            }
            if (b.evaluate() === 0) {
                return new Divide(a, arg2);
            }
            return new Divide(
                new Negate(arg1),
                new Multiply(arg2, arg2)
            );
        }
        return new Divide(
            new Subtract(
                new Multiply(a, arg2),
                new Multiply(arg1, b)),
            new Multiply(arg2, arg2)
        );
    },
    function(a, b) {
        if (a.isConst() && a.evaluate() === 0) {
            return new Const(0);
        } if (b.isConst() && b.evaluate() === 1) {
            return a;
        }
        return new Divide(a, b);
    },
    arg1, arg2
)}

function Sinh(arg1) { return new Operation(
    'sinh',
    function(a) { return Math.sinh(a); },
    function(a) {
        if (a.isConst() && a.evaluate() === 0) {
            return new Const(0);
        }
        // println(new Multiply(new Cosh(arg1), a).s);
        return new Multiply(new Cosh(arg1), a);
    },
    function(a) {
        if (a.isConst() && a.evaluate() === 0) {
            return new Const(0);
        }
        return a;
    },
    arg1
)}

function Cosh(arg1) { return new Operation(
    'cosh',
    function(a) { return Math.cosh(a); },
    function(a) {
        if (a.isConst() && a.evaluate() === 0) {
            return new Const(0);
        }
        return new Multiply(new Sinh(arg1), a);
    },
    function(a) {
        if (a.isConst() && a.evaluate() === 0) {
            return new Const(0);
        }
        return a;
    },
    arg1
)}

const e = new Const(Math.E);
const pi = new Const(Math.PI);

const constants = {
    'e': e,
    'pi': pi
};
const unary = {
    'negate': Negate,
    'sinh': Sinh,
    'cosh': Cosh
};
const binary = {
    '+': Add,
    '-': Subtract,
    '*': Multiply,
    '/': Divide
};

const parse = polish => {
    let stack = [];
    for (let operand of polish.split(' ').filter(str => str.length > 0)) {
        if (operand in constants) {
            stack.push(new constants[operand]);
        } else if (operand in unary) {
            stack.push(new unary[operand](stack.pop()));
        } else if (operand in binary) {
            stack.push(new binary[operand](...stack.splice(-2)));
        } else if ('xyz'.includes(operand)) {
            stack.push(new Variable(operand));
        } else {
            stack.push(new Const(Number.parseInt(operand)));
        }
    }
    return stack.pop();
}

"use strict";

function Const(value) {
    this.value = value;
}
Const.prototype.toString = function() { return String(this.value); };
Const.prototype.evaluate = function() { return this.value; };
Const.prototype.hasOnlyConst = function() { return true; };
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
Variable.prototype.hasOnlyConst = function(variable) { return false; };
Variable.prototype.diff = function(variable) {
    return new Const((variable === this.name) ? 1 : 0);
};
Variable.prototype.simplify = function() { return this; };
Variable.prototype.prefix = function() { return this.toString(); };
Variable.prototype.postfix = function() { return this.toString(); };


function Operation() {
    this.args = [...arguments];
}
Operation.prototype.toString = function() {
    return this.args.join(' ') + ' ' + this._sign;
};
Operation.prototype.evaluate = function(x, y, z) {
    return this._func(...this.args.map(arg => arg.evaluate(x, y, z)));
};
Operation.prototype.hasOnlyConst = function() {
    return !this.args.some(arg => !arg.hasOnlyConst());
};
Operation.prototype.diff = function(variable) {
    return this._diff(...this.args.map(arg => arg.diff(variable))).simplify();
};
Operation.prototype.simplify = function() {
    if (this.hasOnlyConst()) {
        return new Const(this.evaluate());
    }
    return this._simplify(...this.args.map(arg => arg.simplify()));
};
Operation.prototype.prefix = function() {
    return '(' + this._sign + ' ' + this.args.map(arg => arg.prefix()).join(' ') + ')';
}
Operation.prototype.postfix = function() {
    return '(' + this.args.map(arg => arg.postfix()).join(' ') + ' ' + this._sign + ')';
}


function Negate(arg1) {
    Operation.call(this, arg1);
};
Negate.prototype = Object.create(Operation.prototype);
Negate.prototype._sign = 'negate';
Negate.prototype._func = function(a) { return -a; };
Negate.prototype._diff = function(a) { return new Negate(a).simplify(); };
Negate.prototype._simplify = function(a) {
    if (a.hasOnlyConst()) {
        return new Const(-a.evaluate());
    }
    return new Negate(a);
};

function Add(arg1, arg2) {
    Operation.call(this, arg1, arg2);
};
Add.prototype = Object.create(Operation.prototype);
Add.prototype._sign = '+'
Add.prototype._func = function(a, b) { return a + b; };
Add.prototype._diff = function(a, b) { return new Add(a, b); };
Add.prototype._simplify = function(a, b) {
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return b;
    } if (b.hasOnlyConst() && b.evaluate() === 0) {
        return a;
    }
    return new Add(a, b);
};

function Subtract(arg1, arg2) {
    Operation.call(this, arg1, arg2);
};
Subtract.prototype = Object.create(Operation.prototype);
Subtract.prototype._sign = '-';
Subtract.prototype._func = function(a, b) { return a - b; };
Subtract.prototype._diff = function(a, b) { return new Subtract(a, b); };
Subtract.prototype._simplify = function(a, b) {
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return new Negate(b);
    } if (b.hasOnlyConst() && b.evaluate() === 0) {
        return a;
    }
    return new Subtract(a, b);
};

function Multiply(arg1, arg2) {
    Operation.call(this, arg1, arg2);
}
Multiply.prototype = Object.create(Operation.prototype);
Multiply.prototype._sign = '*';
Multiply.prototype._func = function(a, b) { return a * b; };
Multiply.prototype._diff = function(a, b) {
    return new Add(
        new Multiply(a, this.args[1]),
        new Multiply(this.args[0], b)
    );
};
Multiply.prototype._simplify = function(a, b) {
    if (a.hasOnlyConst()) {
        switch (a.evaluate()) {
            case 0: return new Const(0);
            case 1: return b;
        }
    } if (b.hasOnlyConst()) {
        switch (b.evaluate()) {
            case 0: return new Const(0);
            case 1: return a;
        }
    }
    return new Multiply(a, b);
};

function Divide(arg1, arg2) {
    Operation.call(this, arg1, arg2);
};
Divide.prototype = Object.create(Operation.prototype);
Divide.prototype._sign = '/';
Divide.prototype._func = function(a, b) { return a / b; };
Divide.prototype._diff = function(a, b) {
    if (a.hasOnlyConst() && b.hasOnlyConst() && a.evaluate() === 0 && b.evaluate() === 0) {
        return new Const(0);
    }
    if (b.hasOnlyConst() && b.evaluate() === 0) {
        return new Divide(a, this.args[1]);
    }
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return new Divide(
            new Negate(this.args[0]),
            new Divide(
                new Multiply(this.args[1], this.args[1]),
                b
            )
        );
    }
    return new Divide(
        new Subtract(
            new Multiply(a, this.args[1]),
            new Multiply(this.args[0], b)),
        new Multiply(this.args[1], this.args[1])
    );
};
Divide.prototype._simplify = function(a, b) {
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return new Const(0);
    } if (b.hasOnlyConst() && b.evaluate() === 1) {
        return a;
    }
    return new Divide(a, b);
};

function Sinh(arg1) {
    Operation.call(this, arg1);
};
Sinh.prototype = Object.create(Operation.prototype);
Sinh.prototype._sign = 'sinh';
Sinh.prototype._func = function(a) { return Math.sinh(a); };
Sinh.prototype._diff = function(a) {
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return new Const(0);
    }
    return new Multiply(new Cosh(this.args[0]), a);
};
Sinh.prototype._simplify = function(a) {
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return new Const(0);
    }
    return new Sinh(a);
};

function Cosh(arg1) {
    Operation.call(this, arg1);
};
Cosh.prototype = Object.create(Operation.prototype);
Cosh.prototype._sign = 'cosh';
Cosh.prototype._func = function(a) { return Math.cosh(a); };
Cosh.prototype._diff = function(a) {
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return new Const(0);
    }
    return new Multiply(new Sinh(this.args[0]), a);
};
Cosh.prototype._simplify = function(a) {
    if (a.hasOnlyConst() && a.evaluate() === 0) {
        return new Const(0);
    }
    return new Cosh(a);
};

function Mean(...args) {
    Operation.call(this, ...args);
};
Mean.prototype = Object.create(Operation.prototype);
Mean.prototype._sign = 'mean';
Mean.prototype._func = function(...args) {
    let n = args.length;
    return args.reduce((a, b) => a + b) / n;
};

function Var(...args) {
    Operation.call(this, ...args);
};
Var.prototype = Object.create(Operation.prototype);
Var.prototype._sign = 'var';
Var.prototype._func = function(...args) {
    let n = args.length;
    let m = args.reduce((a, b) => a + b) / n;
    return args.map(a => (a - m) * (a - m)).reduce((a, b) => a + b) / n;
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
const multiparameter = {
    'mean': Mean,
    'var': Var
};

const parse = polish => {
    let stack = [];
    for (let operand of polish.split(' ').filter(str => str.length > 0)) {
        if (operand in unary) {
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

var parseError = function (message, str) {
    this.name = 'parseError';
    this.message = message + '\n' + str;
};

function parsePrefix(str) {
    let ind = 0;
    let balance = 0;
    let stack = [];
    
    function skipWhitespaces() {
        while (str[ind] === ' ' && ind < str.length) {
            ind++;
        }
    }
    function parseParameters(n) {
        skipWhitespaces();
        let cnt = 0;
        while (ind < str.length && str[ind] !== ')') {
            if ('xyz'.includes(str[ind])) {
                stack.push(new Variable(str[ind++]));
            } else if ('-0123456789'.includes(str[ind])) {
                let num = '';
                while (ind < str.length && '-0123456789.'.includes(str[ind])) {
                    num += str[ind++];
                }
                stack.push(new Const(Number.parseInt(num)));
            } else if (str[ind] === '(') {
                balance++;
                ind++;
                parseOperation();
            } else {
                throw new parseError('Invalid parameter', str);
            }
            cnt++;
            skipWhitespaces();
        }
        if (n !== cnt) {
            if (n === 1) {
                throw new parseError('Invalid unary (' + cnt + ' args)', str);
            } else if (n === 2) {
                throw new parseError('Invalid binary (' + cnt + ' args)', str);
            } else if (n === -1 && cnt == 0) {
                throw new parseError('Invalid multiparameter (0 args)', str);
            }
        }
        return cnt;
    }
    function parseOperation() {
        skipWhitespaces();
        let op = '';
        while (ind < str.length && !' ()'.includes(str[ind])) {
            op += str[ind];
            ind++;
        }
        if (op in unary) {
            parseParameters(1);
            stack.push(new unary[op](stack.pop()));
        } else if (op in binary) {
            parseParameters(2);
            stack.push(new binary[op](...stack.splice(-2)));
        } else if (op in multiparameter) {
            let cnt = parseParameters(-1);
            stack.push(new multiparameter[op](...stack.splice(-cnt)));
        } else if ('xyz'.includes(op)) {
            throw new parseError('Variable op', str);
        } else if ('0123456789'.includes(op)) {
            throw new parseError('Const op', str);
        } else if (op === ')') {
            throw new parseError('Empty op', str);
        } else {
            throw new parseError('Unknown operation', str);
        }
        if (str[ind] === ')') {
            if (balance == 0) {
                throw new parseError('Missing (', str);
            }
            balance--;
            ind++;
        }
    }
    function parseExpression() {
        skipWhitespaces();
        if (str[ind] === '(') {
            balance++;
            ind++;
            parseOperation();
        }
        skipWhitespaces();
    }

    parseExpression();
    if (ind < str.length && stack.length === 0) {
        parseParameters(1);
    }
    skipWhitespaces();
    if (balance !== 0) {
        throw new parseError('Missing )', str);
    }
    if (ind < str.length || stack[stack.length - 1] === undefined) {
        throw new parseError('Excessive info', str);
    }
    return stack.pop();
}

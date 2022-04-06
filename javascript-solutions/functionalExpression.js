"use strict";

const cnst = value => () => value;
const variable = name => (...variables) => variables['xyz'.indexOf(name)];

const operation = func => (...expressions) => (...variables) => func(...expressions.map(expression => expression(...variables)));
const add = operation((x, y) => (x + y));
const subtract = operation((x, y) => x - y);
const multiply = operation((x, y) => x * y);
const divide = operation((x, y) => x / y);
const negate = operation(x => -x);

const e = cnst(Math.E);
const pi = cnst(Math.PI);

const sinh = operation(x => Math.sinh(x));
const cosh = operation(x => Math.cosh(x));

const constants = {'e': e, 'pi': pi};
const unary = {'negate': negate, 'sinh': sinh, 'cosh': cosh};
const binary = {'+': add, '-': subtract, '*': multiply, '/': divide};

const parse = polish => {
    let stack = [];
    for (let operand of polish.split(' ').filter(str => str.length > 0)) {
        if (operand in constants) {
            stack.push(constants[operand]);
        } else if (operand in unary) {
            stack.push(unary[operand](stack.pop()));
        } else if (operand in binary) {
            stack.push(binary[operand](...stack.splice(-2)));
        } else if ('xyz'.includes(operand)) {
            stack.push(variable(operand));
        } else {
            stack.push(cnst(Number.parseInt(operand)));
        }
    }
    return stack.pop();
}

// let testexpr = parse("x x * 2 x * - 1 +")
// for (let i = 0; i <= 10; i++) {println(testexpr(i));}
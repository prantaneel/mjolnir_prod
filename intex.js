//globalMemory contains all the native methods which can be used
import { tokenGenerator } from "./token-gen.js";
const globalMemory = {
  echo: {
    //method to print shit
    name: "echo",
    isReserved: false,
    type: "func",
    params: [],
    body: (params) => {
      var printArray = [];
      for (element in params) {
        if (params[element].body) {
          printArray.push(params[element].body);
        } else if (typeof params[element].body === "number")
          printArray.push(params[element]);
        else printArray.push(JSON.stringify(params[element]));
      }
      for (element in printArray) console.log(printArray[element]);
    },
  },
  pb: {
    //push_back for arrays
    name: "pb",
    isReserved: true,
    type: "func",
    params: [],
    body: (params) => {
      let context = params[0]; //this params[0] = this
      let arrayVariable = params[1]; //this params[1]
      let pushVariable = params[2]; //this params[2]
      if (typeof pushVariable === "object") pushVariable = pushVariable.body;
      let newVar = context.getVariable(arrayVariable.name).body;
      newVar.push(pushVariable);
      context.memory[arrayVariable].body = newVar;
    },
  },
};

function Mjolnir(globalMemory) {
  this.memory = global;
  this.tokenIterator = 0;
  this.callStack = [];
}
Mjolnir.prototype.getVariable = function (variableName) {
  if (this.memory[variableName]) return this.memory[variableName];
  throw new Error(`${variableName} is not defined`);
};
Mjolnir.prototype.code = function (code) {
  //takes code as text input and tokenizes input
  this.tokenize(code);
  if (!this.TOKENS.length) return "";

  // return this.runCode();
};
Mjolnir.prototype.Advance = function () {
  this.tokenIterator++;
};
Mjolnir.prototype.tokenize = function (code) {
  this.TOKENS = tokenGenerator(code);
  return;
};
////////////////////////////////////////////////////////////////
Mjolnir.prototype.findExpression = function () {
  var leftTerm = this.findTerm();

  // this.Advance();
  var operator = this.TOKENS[this.tokenIterator];
  // console.log(operator);
  if (["ADD", "SUB"].includes(operator.type)) {
    this.Advance();
    var rightTerm = this.findExpression();
    if (!rightTerm) throw new Error("Unsupported syntax type");
    return {
      body: { left: leftTerm, operator: operator, right: rightTerm },
      type: "exp",
    };
  }
  return {
    body: { left: leftTerm, operator: null, right: null },
    type: "exp",
  };
};
Mjolnir.prototype.findTerm = function () {
  var leftFactor = this.findFactor();
  this.Advance();
  var operator = this.TOKENS[this.tokenIterator];
  if (["MULTIPLY", "DIVIDE", "MOD"].includes(operator.type)) {
    this.Advance();
    var rightFactor = this.findTerm();
    if (!rightFactor) throw new Error("Unsupported syntax");
    return {
      body: { left: leftFactor, operator: operator, right: rightFactor },
      type: "exp",
    };
  }
  return {
    body: { left: leftFactor, operator: null, right: null },
    type: "exp",
  };
};
Mjolnir.prototype.findFactor = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type === "IDENTIFIER") {
    if (this.TOKENS[this.tokenIterator + 1].type !== "LPAREN") return tk;
    else {
      this.Advance();
      this.Advance();
      var params = [];
      if (this.TOKENS[this.tokenIterator].type !== "RPAREN") {
        params = this.findParams();
      }
      return { body: { name: tk.name, params: params }, type: "call" };
    }
  }
  if (tk.type === "STRING" || tk.type === "NUMBER" || tk.type === "BOOLEAN") {
    return tk;
  }
  if (tk.type == "ARRAYSTART") {
    this.Advance();
    var array = this.findArray();
    // console.dir(array, { depth: null });
    if (this.TOKENS[this.tokenIterator].type === "ARRAYEND") {
      return { body: array, type: "array" };
    } else throw new Error("Unsupported syntax");
  }
  if (tk.name === "-") {
    this.Advance();
    var rightFactor = this.findFactor();
    if (!rightFactor) throw new Error("Unsupported syntax");
    return {
      body: { left: 0, operator: "-", right: rightFactor },
      type: "exp",
    };
  }
  if (tk.type === "LPAREN") {
    this.Advance();
    var expression = this.findExpression();
    // console.dir(expression, { depth: null });
    // console.log(this.TOKENS[this.tokenIterator]);
    // this.Advance();
    tk = this.TOKENS[this.tokenIterator];
    if (tk.type !== "RPAREN") throw new Error("Unsupported syntax");
    return { body: expression, type: "exp" };
  }
  //add function call code
  return undefined;
  //return undefined
};
Mjolnir.prototype.findArray = function () {
  var returnArr = [];
  var exp = this.findExpression();

  if (exp) returnArr.push(exp);
  else return returnArr;
  var entry = false;
  while (this.TOKENS[this.tokenIterator].type === "SEPARATOR") {
    this.Advance();
    exp = this.findExpression();
    if (!exp) throw new Error("Unspported syntax!");

    returnArr.push(exp);
    // this.Advance();
    entry = true;
  }
  return returnArr;
};
Mjolnir.prototype.findParams = function () {
  var returnArr = [];
  var exp = this.findExpression();
  if (exp) returnArr.push(exp);
  else return returnArr;
  while (this.TOKENS[this.tokenIterator].type === "SEPARATOR") {
    this.Advance();

    exp = this.findExpression();
    if (!exp) throw new Error("Unspported syntax!");
    returnArr.push(exp);
  }
  return returnArr;
};
//////////////////////////////findProgram///////////////////////////////

////////////////////////////////////////////////////////////////

var interpreter = new Mjolnir();
interpreter.code(`
  cool(1,2,3);
`);
console.log(interpreter.TOKENS);
var exp = interpreter.findExpression();
console.dir(exp, { depth: null });

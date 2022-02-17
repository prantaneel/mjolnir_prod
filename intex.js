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
      for (var element = 0; element < params.length; element++) {
        if (params[element].body) {
          printArray.push(params[element].body);
        } else if (typeof params[element].body === "number")
          printArray.push(params[element]);
        else printArray.push(JSON.stringify(params[element]));
      }
      var printstr = printArray.join(' ');
      // for (element in printArray) console.log(printArray[element]);
      console.log(printstr);
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
  this.memory = globalMemory;
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
  var AST = this.findProgram();
  // console.dir(AST, { depth: null});
  return this.runCode(AST);
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
  if (["ADD", "SUBTRACT"].includes(operator.type)) {
    this.Advance();
    var rightTerm = this.findExpression();
    if (!rightTerm) throw new Error("Unsupported syntax type");
    return {
      body: { left: leftTerm, operator: operator, right: rightTerm },
      type: "exp",
    };
  }
  return leftTerm;
};
Mjolnir.prototype.findTerm = function () {
  var leftFactor = this.findFactor();
  this.Advance();
  var operator = this.TOKENS[this.tokenIterator];
  if (["MULTIPLY", "DIVIDE", "MOD", "XOR", "LESS", "GREATER", "EQUAL", "NOT_EQUAL"].includes(operator.type)) {
    this.Advance();
    var rightFactor = this.findTerm();
    if (!rightFactor) throw new Error("Unsupported syntax");
    return {
      body: { left: leftFactor, operator: operator, right: rightFactor },
      type: "exp",
    };
  }
  return leftFactor;
};
Mjolnir.prototype.findFactor = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type === "IDENTIFIER") {
    // console.log(this.TOKENS[this.tokenIterator]);

    if (
      this.TOKENS[this.tokenIterator + 1].type !== "LPAREN" &&
      this.TOKENS[this.tokenIterator + 1].type !== "ARRAYSTART"
    )
      return tk;
    else {
      this.Advance();
      var p = this.TOKENS[this.tokenIterator];
      // console.log(p);

      this.Advance();
      if (p.type === "LPAREN") {
        // console.log(this.TOKENS[this.tokenIterator]);
        var params = [];
        if (this.TOKENS[this.tokenIterator].type !== "RPAREN") {
          params = this.findParams();
        }
        if (this.TOKENS[this.tokenIterator].type !== "RPAREN")
          throw new Error("Invalid Syntax");
        return { body: { name: tk.name, params: params }, type: "call" };
      } else {
        var arrayIndex = this.findExpression();
        if (this.TOKENS[this.tokenIterator].type !== "ARRAYEND")
          throw new Error("Invalid Syntax");
        return {
          body: { name: tk.name, index: arrayIndex },
          type: "arrayaccess",
        };
      }
    }
  }
  if (tk.type === "STRING" || tk.type === "NUMBER" || tk.type === "BOOLEAN") {
    var name2 = tk.name;
    if(name2[0]==="\"" && name2[name2.length-1]==="\"") tk.name = name2.substr(1, name2.length-2);
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
      body: { left: {name:'0', type: 'NUMBER'}, operator: "-", right: rightFactor },
      type: "exp",
    };
  }
  if (tk.type === "LPAREN") {
    this.Advance();
    var expression = this.findExpression();
    // console.dir(expression, { depth: null });
    // this.Advance();
    tk = this.TOKENS[this.tokenIterator];
    if (tk.type !== "RPAREN") throw new Error("Unsupported syntax");
    return expression;
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
  // console.log(this.TOKENS[this.tokenIterator]);
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
//////////////////////////////variableDeclaration///////////////////////////////
Mjolnir.prototype.findVariableKeyword = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (["num", "arr", "str", "bool", "func"].includes(tk.name)) {
    this.Advance();
    return tk.name;
  }
};
Mjolnir.prototype.findVariableName = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type === "IDENTIFIER") {
    this.Advance();
    return tk.name;
  }
};
Mjolnir.prototype.findAssignmentOperator = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type === "ASSIGNMENT") {
    this.Advance();
    return tk.name;
  }
};
Mjolnir.prototype.findVariableBody = function () {
  var compa = this.findComparison();
  if (compa) return compa;
  else throw new Error("syntax err!");
};
Mjolnir.prototype.findVariableDeclaration = function () {
  var vbk = this.findVariableKeyword();
  if (!vbk) throw new Error("syntax err!");
  var vbn = this.findVariableName();
  if (!vbn) throw new Error("syntax err!");
  var ass = this.findAssignmentOperator();
  if (!ass) throw new Error("Syntax error");
  var vb;
  if (vbk === "func") vb = this.findFunctionDeclaration();
  else vb = this.findVariableBody();
  if (!vb) throw new Error("syntax err!");
  return {
    type: "variabledeclare",
    body: { name: vbn, "variable-body": vb, "variable-type": vbk },
  };
};
////////////////////////////Function declaration//////////////////////////////////
Mjolnir.prototype.findFunctionArguments = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type === "LPAREN") {
    this.Advance();
    tk = this.TOKENS[this.tokenIterator];
    if (tk.type === "RPAREN") return [];
    else {
      var returnArr = [];
      var kw = this.findVariableKeyword();
      if (!kw) throw new Error("Syntax error");
      var name = this.findVariableName();
      if (!name) throw new Error("Syntax error");
      returnArr.push({ name: name, type: kw });
      while (this.TOKENS[this.tokenIterator].type === "SEPARATOR") {
        this.Advance();
        var kw = this.findVariableKeyword();
        if (!kw) throw new Error("Syntax error");
        var name = this.findVariableName();
        if (!name) throw new Error("Syntax error");
        returnArr.push({ name: name, type: kw });
      }
      return returnArr;
    }
  } else return undefined;
};
Mjolnir.prototype.findFunctionDeclaration = function () {
  // console.log(this.TOKENS[this.tokenIterator]);

  var funcArgs = this.findFunctionArguments();
  this.Advance();
  if (!funcArgs) throw new Error("Syntax error");
  // console.log(funcArgs);
  if (this.TOKENS[this.tokenIterator].type === "BLOCKSTART") {
    this.Advance();
    // console.log(this.TOKENS[this.tokenIterator]);
    var exp = this.findProgram();
    // console.dir(exp, { depth: null });
    if (exp.length === 0) throw new Error("Syntax error");
    if (this.TOKENS[this.tokenIterator].type !== "BLOCKEND")
      throw new Error("Syntax error");
    this.Advance();

    return { args: funcArgs, body: exp };
  }
};
//function can be evaluated using a local interpreter
///////////////////////////////Comparison///////////////////////////
Mjolnir.prototype.findComparison = function () {
  var leftTerm = this.findExpression();
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type === "LESS" || tk.type === "GREATER" || tk.type === "EQUAL") {
    this.Advance();
    var rightTerm = this.findExpression();
    if (!rightTerm) throw new Error("Syntax error");
    return {
      body: { left: leftTerm, operator: tk, right: rightTerm },
      type: "exp",
    };
  }
  return leftTerm;
};
//////////////////////Conditionals/////////////////////////////////////////
Mjolnir.prototype.findConditional = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type !== "IF_STATEMENT") return;
  this.Advance();
  if (this.TOKENS[this.tokenIterator].type !== "LPAREN")
    throw new Error("Syntax error");
  this.Advance();
  var compa = this.findComparison();
  if (!compa) throw new Error("Syntax error");
  if (this.TOKENS[this.tokenIterator].type !== "RPAREN")
    throw new Error("Syntax error");
  this.Advance();
  var ifBlock;
  if (this.TOKENS[this.tokenIterator].type === "BLOCKSTART") {
    this.Advance();
    var exp = this.findProgram();
    if (exp.length === 0) throw new Error("Syntax error");
    if (this.TOKENS[this.tokenIterator].type !== "BLOCKEND")
      throw new Error("Syntax error");
    this.Advance();
    ifBlock = { body: exp };
  } else throw new Error("Syntax error");
  tk = this.TOKENS[this.tokenIterator];
  if (tk.type !== "ELSE_STATEMENT")
    return {
      body: { compare: compa, if: ifBlock, else: null },
      type: "condition",
    };
  this.Advance();
  var elseBlock;
  if (this.TOKENS[this.tokenIterator].type === "BLOCKSTART") {
    this.Advance();
    var exp2 = this.findProgram();
    if (exp2.length === 0) throw new Error("Syntax error");
    if (this.TOKENS[this.tokenIterator].type !== "BLOCKEND")
      throw new Error("Syntax error");
    this.Advance();
    elseBlock = { body: exp2 };
    return {
      body: { compare: compa, if: ifBlock, else: elseBlock },
      type: "condition",
    };
  } else throw new Error("Syntax error");
};
///////////////////////////Assignment////////////////////////////
Mjolnir.prototype.findAssignment = function () {
  var tk = this.findVariableName();
  // console.log(tk);
  // console.log(this.TOKENS[this.tokenIterator]);
  var ass = this.findAssignmentOperator();
  if (!ass) throw new Error("Syntax error");
  var rightexp = this.findExpression();
  if (!rightexp) throw new Error("Syntax error");
  return {
    body: {
      left: {name: tk, type: "IDENTIFIER"},
      operator: { name: "=", type: "ASSIGNMENT" },
      right: rightexp,
    },
    type: "assign",
  };
};
///////////////////////////////////Loop//////////////////////////
Mjolnir.prototype.findLoop = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type === "LPAREN") {
    this.Advance();
    var vd = this.findVariableDeclaration();
    if (!vd) throw new Error("Syntax error");
    this.findLineEnd();
    var comp = this.findComparison();
    if (!comp) throw new Error("Syntax error");
    this.findLineEnd();
    var upd = this.findAssignment();
    if (!upd) throw new Error("Syntax error");
    if (this.TOKENS[this.tokenIterator].type !== "RPAREN")
      throw new Error("Syntax error");
    this.Advance();
    var lpd = [];
    if (this.TOKENS[this.tokenIterator].type === "BLOCKSTART") {
      this.Advance();
      lpd = this.findProgram();
      if (lpd.length === 0) throw new Error("Syntax error");
      if (this.TOKENS[this.tokenIterator].type !== "BLOCKEND")
        throw new Error("Syntax error");
      this.Advance();

      return {
        body: {
          loopVariableDeclaration: vd,
          loopComparison: comp,
          loopAssignment: upd,
          loopBody: lpd,
        },
        type: "loop",
      };
    } else throw new Error("Syntax error");
  } else throw new Error("Syntax error");
};
//////////////////////////////Program////////////////////////////
Mjolnir.prototype.findLineEnd = function () {
  var tk = this.TOKENS[this.tokenIterator];
  if (tk.type !== "LINEEND") throw new Error("Syntax error");
  this.Advance();
};
Mjolnir.prototype.findProgram = function () {
  var AST = [];
  while (this.tokenIterator < this.TOKENS.length) {
    var tk = this.TOKENS[this.tokenIterator];
    if (["num", "arr", "func", "bool", "str"].includes(tk.name)) {
      var vardecl = this.findVariableDeclaration();
      if (!vardecl) throw new Error("Syntax error");
      // console.log(this.TOKENS[this.tokenIterator]);
      this.findLineEnd();
      AST.push(vardecl);
      continue;
    }
    if (tk.type === "IF_STATEMENT") {
      var cond = this.findConditional();
      if (!cond) throw new Error("Syntax error");
      // console.log(this.TOKENS[this.tokenIterator]);
      this.findLineEnd();
      AST.push(cond);
      continue;
    }
    if (tk.type === "IDENTIFIER") {
      if (this.TOKENS[this.tokenIterator + 1].type === "LPAREN") {
        //this is a funciton that
        var call = this.findExpression();
        if (!call) throw new Error("Syntax error");
        this.findLineEnd();
        AST.push(call);
        continue;
      }
      var assign = this.findAssignment();
      if (!assign) throw new Error("Syntax error");
      this.findLineEnd();

      AST.push(assign);
      continue;
    }
    if (tk.type === "RETURN") {
      this.Advance();
      var ret = this.findExpression();
      if (!ret) throw new Error("Syntax error");
      this.findLineEnd();
      AST.push({ body: ret, type: "return" });
      continue;
    }
    if (tk.type === "LOOP_STATEMENT") {
      this.Advance();
      var lp = this.findLoop();
      if (!lp) throw new Error("Syntax error");
      AST.push(lp);
    }
    if (tk.type === "BLOCKEND" || tk.type === "ENDOFCODE") break;
    this.findLineEnd();
  }

  return AST;
}; //add advance at last};
////////////////////////////////////////////////////////////////
Mjolnir.prototype.runCode=function(AST){
  for(var i = 0;i < AST.length; i++){
    //run the Program
    var ast_node = AST[i];
    if(ast_node.type === "variabledeclare"){
      this.declareVariable(ast_node);
    }
    else if(ast_node.type === "loop"){
      var ret = this.executeLoop(ast_node);
      if(ret!==undefined){} return ret;
    }
    else if(ast_node.type === "condition"){
      var ret = this.executeConditional(ast_node);
      if(ret!==undefined) return ret;
    }
    else if(ast_node.type === "assign"){
      this.assignVariable(ast_node);
    }
    else if(ast_node.type === "call"){
      var ret = this.getFunctionCall(ast_node);
      if(ret!==undefined) return ret;
    }
    else if(ast_node.type === "return"){
      var ret = this.returnCall(ast_node);
      // console.log(ast_node);
      // console.log(ret);
      return ret;
    }
    else throw new Error("Unidentified type of syntax.")
  }
}
Mjolnir.prototype.evaluate = function(a, op, b){

  if(typeof a !== typeof b) throw new Error("Type conversion not possible.");
  if(typeof a === "object") throw new Error("Can't perfor artithmetic operation on objects.");
  if(typeof a === "string") {
      if(op.type==="ADD") return a + b;
      if(op.type==="NOT_EQUAL") return a!==b;
      else throw new Error("Syntax error")
  }
  var t = op.type;
  if(t==="ADD") return a + b;
  if(t==="SUBTRACT") return a - b;
  if(t==="MULTIPLY") return a * b;
  if(t==="DIVIDE") return a / b;
  if(t==="MOD") return a % b;
  if(t==="XOR") return a ^ b;
  if(t==="LESS") return Number(a < b);
  if(t==="GREATER") return Number(a > b);
  if(t==="EQUAL") return Number(a === b);
  if(t==="NOT_EQUAL") return Number(a !== b);
}
Mjolnir.prototype.makeArray = function(x){
  var retArr = [];
  var ogArr = x.body;
  for(var i = 0; i < ogArr.length; i++){
      retArr.push(this.findExp(ogArr[i]));
  }
  return retArr;
}
Mjolnir.prototype.getArrayAccess = function(x){
  var arName = x.body.name;
  var ind = this.findExp(x.body.index);
  if(!this.memory[arName]) throw new Error("varible Not found");
  if(this.memory[arName].type!="arr") throw new Error("Not an array");
  return this.memory[arName].body[ind];
}
Mjolnir.prototype.getFunctionCall = function(x){
  var localMemory = Object.assign({}, this.memory);
  var funcName = x.body.name;
  var params = x.body.params; //input to the function call
  var paramsArray = [];
  if(funcName==="echo"){
    //is a local function call?
    for(var i = 0; i < params.length; i++){
      paramsArray[i] = this.findExp(params[i]);
      //add support for bool
    }
    this.memory.echo.body(paramsArray);
    return;
  }
  if(!this.memory[funcName]) throw new Error("Function declaration not found!");
  var funcArgs = this.memory[funcName].args; //function definition parameters
  if(params.length!==funcArgs.length) throw new Error("number of input doesn't equate to params");
  for(var i = 0; i < funcArgs.length; i++){
      var p = params[i], ar = funcArgs[i];
      paramsArray[i] = this.findExp(p);
      // console.log(paramsArray[i]);
      if((ar.type==="num" && typeof paramsArray[i] === "number")||
      (ar.type==="str" && typeof paramsArray[i] === "string")||
      (ar.type==="arr" && typeof paramsArray[i] === "object")){
          localMemory[ar.name] = {
              isNative: false,
              name: ar.name,
              type: ar.type,
              args: [],
              body: paramsArray[i],
          };
      }
      //add support for bool
  }
  var Interpreter_local = new Mjolnir(localMemory);
  var localAST = this.memory[funcName].body;
  var ret = Interpreter_local.runCode(localAST);
  if(ret!==undefined) return ret;

}
Mjolnir.prototype.returnCall = function(x){
  return this.findExp(x.body);
}
Mjolnir.prototype.declareVariable = function(x){
  var bd = x.body;
  var name = bd.name;
  if(this.memory[name]) throw new Error("Already declared Variable!!")
  if(bd["variable-type"]!=="func"){
    // console.dir(bd["variable-body"], { depth: null})
      var body = this.findExp(bd["variable-body"]);
      this.memory[name] = {
          isNative: false,
          name: name,
          type: bd["variable-type"],
          args: [],
          body: body
      }
      return;
  }
  if(bd["variable-type"]==="func"){
      this.memory[name] = {
          isNative: false,
          name: name,
          type: bd["variable-type"],
          args: bd["variable-body"].args,
          body: bd["variable-body"].body
      }
      return;
  }
  throw new Error("Syntax error check declareVariable");
}
Mjolnir.prototype.assignVariable = function(x){
  var left = x.body.left.name
  if(!this.memory[left]) throw new Error("Syntax error")
  var exp = this.findExp(x.body.right);
  var typ = this.memory[left].type;
  if(typ==="func") throw new Error("Functions cant be redeclared");
  if((typ==="num" && typeof exp === "number")||
      (typ==="str" && typeof exp === "string")||
      (typ==="arr" && typeof exp === "object")){
      this.memory[left].body = exp;
  }
}
Mjolnir.prototype.executeLoop = function(x){
  var localMemory = Object.assign({}, this.memory);
  var interpreter2 = new Mjolnir(localMemory);
  interpreter2.declareVariable(x.body.loopVariableDeclaration);
  interpreter2.memory["loopComparison"] = x.body.loopComparison;
  interpreter2.memory["loopAssignment"] = x.body.loopAssignment;
  while(interpreter2.findExp(interpreter2.memory["loopComparison"])!=0){
    // console.log(x.body.loopBody);
      interpreter2.runCode(x.body.loopBody);
      interpreter2.assignVariable(interpreter2.memory["loopAssignment"]);
      // console.log(this.findExp(interpreter2.memory["loopComparison"]));
  }
}
Mjolnir.prototype.executeConditional = function(x){
  var body = x.body;
  var cond = this.findExp(body.compare);
  var localMemory = Object.assign({}, this.memory);
  var interpreter2 = new Mjolnir(localMemory);
  var ret;
  if(cond){
      //execute if block
      ret = interpreter2.runCode(body.if.body);
  }
  else{
      //execute else block
      if(body.else) ret = interpreter2.runCode(body.else.body);
  }
  if(ret!==undefined) return ret;
}
Mjolnir.prototype.findExp = function(x){
  // console.dir(x, { depth: null});
  if(x.type === "IDENTIFIER"){
      if(!this.memory[x.name]) throw new Error("Variable Not declared");
      return this.memory[x.name].body;
  }
  if(x.type === "arrayaccess") return this.getArrayAccess(x);
  if(x.type==="call") {
    var ret = this.getFunctionCall(x);
    // console.log(ret);
    return ret;
  }
  if(x.type==="NUMBER") return parseFloat(x.name);
  if(x.type==="STRING") return x.name;
  if(x.type==="array") return this.makeArray(x);
  if(x.type==="exp"){
      return this.evaluate(this.findExp(x.body.left),x.body.operator, this.findExp(x.body.right));
  }
}


var interpreter = new Mjolnir(globalMemory);
interpreter.code(`

  func fn = (num a)<<
    if(a==0)<<->0;>>;
    if(a==1)<<->0;>>;
    ->fn(a-1)+fn(a-2);
  >>;
  num a = fn(20);
  echo(a);

`);
// console.log(interpreter.TOKENS);
// var exp = interpreter.findProgram();
// console.dir(interpreter.memory, { depth: null });
// console.log(interpreter.TOKENS[interpreter.tokenIterator]);

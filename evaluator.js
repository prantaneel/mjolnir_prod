function evaluate(a, op, b){

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
    if(t==="LESS") return number(a < b);
    if(t==="GREATER") return number(a > b);
    if(t==="EQUAL") return number(a === b);
    if(t==="NOT_EQUAL") return number(a !== b);
}
function makeArray(x){
    var retArr = [];
    var ogArr = x.body;
    for(var i = 0; i < ogArr.length; i++){
        retArr.push(findExp(ogArr[i]));
    }
    return retArr;
}
function getArrayAccess(x){
    var arName = x.body.name;
    var ind = findExp(x.body.index);
    if(!memory[arName]) throw new Error("varible Not found");
    if(memory[arName].type!="arr") throw new Error("Not an array");
    return memory[arName].body[ind];
}
function getFunctionCall(x){
    var localMemory = memory
    var funcName = x.body.name;
    var params = x.body.params; //input to the function call
    if(!memory[funcName]) throw new Error("Function declaration not found!");
    var funcArgs = memory[funcName].args; //function definition parameters
    if(params.length!==funcArgs.length) throw new Error("number of input doesn't equate to params");
    for(var i = 0; i < funcArgs.length; i++){
        var p = params[i], ar = funcArgs[i];
        p = findExp(p);
        if((ar.type==="num" && typeof p === "number")||
        (ar.type==="str" && typeof p === "string")||
        (ar.type==="arr" && typeof p === "object")){
            localMemory[ar.name] = {
                isNative: false,
                name: ar.name,
                type: ar.type,
                args: [],
                body: p,
            };
        }
        //add support for bool
    }
    var Interpreter_local = new Mjolnir(localMemory);
    var localAST = memory[funcName].body;
    var ret = Interpreter_local.runCode(localAST);
    if(ret) return ret;

}
function returnCall(x){
    return findExp(x.type);
}
function declareVariable(x){
    var bd = x.body;
    var name = bd.name;
    if(memory[name]) throw new Error("Already declared Variable!!")
    if(bd["variable-type"]!=="fn"){
        var body = findExp(bd["variable-body"]);
        memory[name] = {
            isNative: false,
            name: name,
            type: bd["variable-type"],
            args: [],
            body: body
        }
        return;
    }
    if(bd["variable-type"]==="fn"){
        memory[name] = {
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
function assignVariable(x){
    var left = x.body.left.name
    if(!memory[left]) throw new Error("Syntax error")
    var exp = findExp(x.body.right);
    var typ = memory[left].type;
    if(typ==="fn") throw new Error("Functions cant be redeclared");
    if((typ==="num" && typeof exp === "number")||
        (typ==="str" && typeof exp === "string")||
        (typ==="arr" && typeof exp === "object")){
        memory[left].body = exp;
    }
}
function executeLoop(x){
    var localMemory = memory;
    var interpreter2 = new Mjolnir(localMemory);
    declareVariable(x.body.loopVariableDeclration);
    interpreter2.memory[loopComparison] = x.body.loopComparison;
    interpreter2.memory[loopAssignment] = x.body.loopAssignment;
    while(findExp(interpreter2.memory[loopComparison])!=0){
        interpreter2.runCode(x.body.loopBody);
        assignVariable(interpreter2.memory[loopAssignment]);
    }
}
function executeConditional(x){
    var body = x.body;
    var cond = findExp(body.compare);
    var localMemory = memory;
    var interpreter2 = new Mjolnir(localMemory);
    if(cond){
        //execute if block
        interpreter2.runCode(body.if.body);
    }
    else{
        //execute else block
        if(body.else) interpreter2.runCode(body.else.body);
    }
}
function findExp(x){
    // console.dir(x, { depth: null});
    if(x.type === "IDENTIFIER"){
        if(!memory[x.name]) throw new Error("Variable Not declared");
        return memory[x.name].body;
    }
    if(x.type === "arrayaccess") return getArrayAccess(x);
    if(x.type==="call") return getFunctionCall(x);
    if(x.type==="NUMBER") return parseFloat(x.name);
    if(x.type==="STRING") return x.name;
    if(x.type==="array") return makeArray(x);
    if(x.type==="exp"){
        return evaluate(findExp(x.body.left),x.body.operator, findExp(x.body.right));
    }
}

var x = {
    "body-name": "cool"
}
console.log(x["body-name"]);
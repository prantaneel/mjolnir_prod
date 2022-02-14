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
    if(t==="LESS") return Number(a < b);
    if(t==="GREATER") return Number(a > b);
    if(t==="EQUAL") return Number(a === b);
    if(t==="NOT_EQUAL") return Number(a !== b);
}
function makeArray(x){
    var retArr = [];
    var ogArr = x.body;
    for(var i = 0; i < ogArr.length; i++){
        retArr.push(findExp(ogArr[i]));
    }
    return retArr;
}
function findExp(x){
    // console.dir(x, { depth: null});
    if(x.type === "IDENTIFIER"){
        if(!memory[x.name]) throw new Error("Variable Not declared");
        return memory[x.name].body;
    }
    if(x.type==="call") return getFunctionCall(x);
    if(x.type==="NUMBER") return parseFloat(x.name);
    if(x.type==="STRING") return x.name;
    if(x.type==="array") return makeArray(x);
    if(x.type==="exp"){
        return evaluate(findExp(x.body.left),x.body.operator, findExp(x.body.right));
    }
}

var x = {
    body: [
      { name: '1', type: 'NUMBER' },
      { name: '2', type: 'STRING' },
      { name: '3', type: 'NUMBER' }
    ],
    type: 'array'
  }

console.log(findExp(x));
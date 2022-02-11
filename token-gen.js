const UNI_KW = {
  "(": "LPAREN",
  ")": "RPAREN",
  ";": "LINEEND",
  "<<": "BLOCKSTART",
  ">>": "BLOCKEND",
  "\n": "NEWLINE",
  "[": "ARRAYSTART",
  "]": "ARRAYEND",
  ",": "SEPARATOR",
  "+": "ADD",
  "-": "SUBTRACT",
  "*": "MULTIPLY",
  "/": "DIVIDE",
  "%": "MOD",
  "^": "XOR",
  " ": "WHITESPACE",
  "|": "OR",
  "&": "AND",
  "=": "ASSIGNMENT",
  "<": "LESS",
  ">": "GREATER",
  "==": "EQUAL",
  "!=": "NOT_EQUAL",
  "->": "RETURN",
  num: "NUMBER_TYPE",
  arr: "ARRAY_TYPE",
  str: "STRING_TYPE",
  bool: "BOOLEAN_TYPE",
  func: "FUNCTION_TYPE",
  if: "IF_STATEMENT",
  else: "ELSE_STATEMENT",
  bool: "BOOLEAN_TYPE",
  loop: "LOOP_STATEMENT",
};
function KW(ch) {
  if (UNI_KW[ch]) return UNI_KW[ch];
  if (!isDigit(ch)) return "IDENTIFIER";
  else return "DIGIT";
}
function isDigit(ch) {
  return ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."].includes(ch);
}
var code_length = 0;
var ITER = 0;
var CODE = "";
var CH = "";
var TOKEN = [];

function findNumber() {
  var num = "";
  while (isDigit(CH)) {
    num += CH;
    Advance();
  }
  return num;
}
function findString() {
  var st = "";
  while (CH != '"') {
    st += CH;
    Advance();
  }
  Advance();
  return st;
}
function tokenGen(code) {
  code_length = code.length;
  CODE = code;
  return TokenHandler();
}
function Advance() {
  return (CH = CODE[++ITER]);
}
function TokenHandler() {
  while (ITER < code_length) {
    CH = CODE[ITER];
    /////Identifier Handling:
    if (KW(CH) === "WHITESPACE" || KW(CH) === "NEWLINE") {
      Advance();
      continue;
    }
    if (CODE.substr(ITER, 2) === "if") {
      TOKEN.push({ name: "if", type: UNI_KW["if"] });
      ITER += 2;
      CH = CODE[ITER];
      continue;
    }
    if (CODE.substr(ITER, 2) == "->") {
      TOKEN.push({ name: "->", type: UNI_KW["->"] });
      ITER += 2;
      CH = CODE[ITER];
      continue;
    }
    if (
      CODE.substr(ITER, 4) === "else" ||
      CODE.substr(ITER, 4) === "bool" ||
      CODE.substr(ITER, 4) === "true"
    ) {
      var cd = CODE.substr(ITER, 4);
      if (cd === "else") TOKEN.push({ name: "else", type: UNI_KW["else"] });
      if (cd === "true") TOKEN.push({ name: "true", type: "BOOLEAN" });
      if (cd === "bool") TOKEN.push({ name: "bool", type: UNI_KW["bool"] });

      ITER += 4;
      CH = CODE[ITER];
      continue;
    }
    if (CODE.substr(ITER, 5) === "false") {
      TOKEN.push({ name: "false", type: "BOOLEAN" });

      ITER += 5;
      CH = CODE[ITER];
      continue;
    }
    if (KW(CH) !== "IDENTIFIER" && KW(CH) !== "DIGIT") {
      var kw = "";
      kw = CH;
      Advance();
      if (
        KW(CH) !== "WHITESPACE" &&
        KW(CH) !== "IDENTIFIER" &&
        KW(CH) !== "DIGIT" &&
        KW(CH) !== "NEWLINE"
      ) {
        var kw2 = kw + CH;
        if (UNI_KW[kw2]) {
          TOKEN.push({ name: kw2, type: UNI_KW[kw2] });
          Advance();
          continue;
        }
      }
      TOKEN.push({ name: kw, type: UNI_KW[kw] });
      continue;
    }
    var num = findNumber();
    if (num !== "") {
      TOKEN.push({ name: num, type: "NUMBER" });
      continue;
    }
    var identifier = "";
    var isIdent = false;
    if (CH === '"') {
      Advance();
      TOKEN.push({ name: `"${findString()}"`, type: "STRING" });
      continue;
    }
    while (KW(CH) === "IDENTIFIER" || (isDigit(CH) && CH !== ".")) {
      isIdent = true;
      identifier += CH;
      Advance();
    }
    if (isIdent) {
      if (UNI_KW[identifier])
        TOKEN.push({ name: identifier, type: UNI_KW[identifier] });
      else TOKEN.push({ name: identifier, type: "IDENTIFIER" });
    }
  }
  TOKEN.push({ name: "///", type: "ENDOFCODE" });
  return TOKEN;
}

export const tokenGenerator = tokenGen;

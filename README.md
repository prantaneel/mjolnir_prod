# Mjolnir
Mjolnir is a simple, lightweight programming language. It follows **ENBF grammar** and the interpreter is completely written in javascript. Although its easy to read, its a strongly typed language and supports inline functions as well as recursion blocks.
## Grammar
```
1. [] => optional 0/1
2. {} => occurs 0-n times
3. program::= variable-declaration | conditional | loop | expression [program]
4. variable-declaration::= variable-keyword variable-name assignment-operator variable-body
5. variable-keyword::= “func” | “num” | “arr”  | “bool” | “str”
6. variable-name::= identifier
7. assignment-operator::= “=”
8. variable-body::= function-declaration | expression | comparison
9. function-declaration::= function-arguments wrapper function-block wrapper
10. function-arguments::= “(“ [{ variable-keyword variable-name “,” }] “)”
11. array::= “[“ [{expression “,”}] “]” 
12. function-block::= program
13. conditional::= “if”comparison wrapper program wrapper  [{“else if”...} | “else” wrapper program wrapper]
14. comparison::= expression [comparison-operator expression]
15. comparison-operator::= “==”
16. expression::= term {“+” | “-” }[expression]
17. term::= factor {“*” | “/” | “%”}[term]
18. factor::= string | number | array | boolean | identifier | “-” factor | “(“ expression “)” | function-call

19. function-call::= identifier “(“ [ {expression “,”} ] “)”

23. identifier::= {char}
24. number::= {digit} [“.” {digit}]
25. string::= `”[{*}]”`
26. boolean::= “true” | “false”
27. char::= “a” | “b” |...”Y” | “Z”
28. digit::= “1” | “2” | “3” |...| ”9” | “0”
29. wrapper::= “<<” | “>>”
```

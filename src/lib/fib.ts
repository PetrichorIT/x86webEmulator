export const fib = `
.text:

@export fib:
	mov eax, [esp + 8]
    mov ebx, 0
    mov ecx, 1
    
fib_loop:
	mov edx, ebx
    add ebx, ecx
    mov ecx, edx
    dec eax
    jnz fib_loop
    
    ret
`;
export default fib;

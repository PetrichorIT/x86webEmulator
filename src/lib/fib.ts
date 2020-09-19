export const fib = `
@export fib:
    setcorespeed 1
	mov eax, [esp + 8]
    mov ebx, 0
    mov ecx, 1
    
fib_loop:
	mov edx, ebx
    add ebx, ecx
    mov ecx, edx
    dec eax
    jnz fib_loop
    
    setcorespeed
    ret
`;
export default fib;

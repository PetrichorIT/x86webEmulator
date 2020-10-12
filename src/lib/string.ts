export const string = `
; EXPORT
; Expects:
; push lhs
; push rhs
; push &result
@export strcmp:
	mov eax, [esp + 12]	; lhsOperand 
    mov ebx, [esp + 16]	; rhsOperand
    
strcmp_loop:
	mov cl, [eax]
    mov dl, [ebx]
    cmp cl, dl
    jne strcmp_false
    cmp cl, 0
    jz strcmp_true
    inc eax
    inc ebx
    jmp strcmp_loop
    
    
strcmp_true:
	cmp dl, 0
    jz strcmp_true_conf
strcmp_true_err:
    mov [esp + 8], 0
    ret
strcmp_true_conf:
    mov [esp + 8], 1
    ret
    
strcmp_false:
    mov [esp + 8], 0
    ret

; EXPORT
; Expects
; push lhs (org)
; push rhs (suffix)
@export strcat:
	mov ebx, [esp + 8] ; Suffix
    mov eax, [esp + 12] ; Prefix
    
strcat_pre_end:
	mov cl, [eax]
    cmp cl, 0
    je strcat_copy
    inc eax
    jmp strcat_pre_end
    
strcat_copy:
	mov cl, [ebx]
    mov [eax], cl
    inc eax
    inc ebx
    cmp cl, 0
    jne strcat_copy
    
    ret
	
; EXPORT
; Expects
; push operand
; puhs &result
@export strlen:
	mov eax, [esp + 12] ; operand
    mov ebx, 0
    
strlen_loop:
	mov cl, [eax]
    inc eax
    inc ebx
    cmp cl, 0
    jne strlen_loop
    
    dec ebx
    mov [esp + 8], ebx
    ret

; Expects
; push <dest>
; push <src>
; push <num>
@export strncat:
    mov eax, [esp + 16] ; <dest>
    
    push eax
    push 0
    call strlen
    pop eax
    pop ecx 
    
    add eax, [esp + 16] ; <dest> end
    mov ebx, [esp + 12] ; <src> start
    mov ecx, [esp + 8]
    
    push eax
    push eax
    push ebx
    push ecx
    call memcpy

    pop ecx; EAX
    pop ecx
    pop ecx
    pop eax
    
    add eax, [esp + 8]
    mov cl, 0
    mov [eax], cl
    
    ret


; Expects
; push <dest>
; push <src>
@export strcpy:
    mov eax, [esp + 8] ; SRC
    mov ebx, [esp + 12] ; DEST
    mov cl, [eax]
    
    cmp cl, 0
    je strcpy_end
    
strcpy_loop:
    mov cl, [eax]
    mov [ebx], cl
    inc eax
    inc ebx
    cmp cl, 0
    jne strcpy_loop
    
strcpy_end:
    ret

; Expects
; push <dest>
; push <src>
; push <length>
@export memcpy:
    mov eax, [esp + 8]
    mov ebx, [esp + 12]
    mov ecx, [esp + 16]
    
    cmp eax, 0
    je memcpy_end
    
memcpy_loop:
    mov dl, [ebx]
    mov [ecx], dl
    inc ecx
    inc ebx
    dec eax
    jnz memcpy_loop

memcpy_end:
    ret

; Expect
; push <string>
; push <substring>
; push <&result = void * || null>
@export strstr:
	mov eax, [esp + 16]
    mov ebx, [esp + 12]
    mov edx, 0

strstr_loop:
	mov cl, [eax]
    mov ch, [ebx]
    
    cmp cl, 0
    je strstr_end
    
    cmp cl, ch
    je strstr_subloop
   
    inc eax
    jmp strstr_loop

strstr_subloop:
    push eax
    push ebx
    inc eax
    inc ebx

strstr_subloop_l:
	mov cl, [eax]
    mov ch, [ebx]
    
    cmp ch, 0
    je strstr_subloop_succ
    
    cmp cl, ch
    jne strstr_subloop_fail
   
    inc eax
    inc ebx
    
    jmp strstr_subloop_l
    
strstr_subloop_fail:
	pop ebx
    pop eax
    inc eax
    jmp strstr_loop

strstr_subloop_succ:
	pop ebx
    pop edx
    jmp strstr_end

strstr_end:
	mov [esp + 8], edx
    ret

; Expect
; push <string>
; push <char>
; push <&result = void * || null>
@export strrchr:
	mov eax, [esp + 16]
    mov ebx, [esp + 12]
    mov edx, 0
    
strrchr_loop:
	mov cl, [eax]
    cmp cl, bl
    jne strrchr_loop_ne
    mov edx, eax
    
strrchr_loop_ne:
	cmp cl, 0
    je strrchr_end
    inc eax
    jmp strrchr_loop
   
strrchr_end:
	mov [esp + 8], edx
    ret

; Expect
; push <string>
; push <char>
; push <&result = void * || null>
@export strchr:
	mov eax, [esp + 16]
    mov ebx, [esp + 12]
    
strchr_loop:
	mov cl, [eax]
    cmp cl, bl
    je strchr_succ
 	cmp cl, 0
    je strchr_fail
    inc eax
    jmp strchr_loop
 
strchr_succ:
	mov [esp + 8], eax
    ret
    
strchr_fail:
	mov [esp + 8], 0x0
    ret
`;

export const stringEntryPoints = [ 'strcmp', 'strcat', 'strlen', 'strcpy', 'memcpy', 'strncat' ];

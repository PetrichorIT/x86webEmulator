export const string = `
; EXPORT
; Expects:
; push lhs
; push rhs
; push &result
@export strcmp:
    setcorespeed 5
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
    setcorespeed
    ret
strcmp_true_conf:
    mov [esp + 8], 1
    setcorespeed
    ret
    
strcmp_false:
    mov [esp + 8], 0
    setcorespeed
    ret

; EXPORT
; Expects
; push lhs (org)
; push rhs (suffix)
@export strcat:
    setcorespeed 5
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
    
    setcorespeed
    ret
	
; EXPORT
; Expects
; push operand
; puhs &result
@export strlen:
    setcorespeed 5
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
    setcorespeed
    ret

; Expects
; push <dest>
; push <src>
; push <num>
@export strncat:
    setcorespeed 5
    mov eax, [esp + 16] ; <dest>
    
    push eax
    push 0
    call strlen
    setcorespeed 5
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
    setcorespeed 5
    pop ecx; EAX
    pop ecx
    pop ecx
    pop eax
    
    add eax, [esp + 8]
    mov cl, 0
    mov [eax], cl
    
    setcorespeed
    ret


; Expects
; push <dest>
; push <src>
@export strcpy:
    setcorespeed 5
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
    setcorespeed
    ret

; Expects
; push <dest>
; push <src>
; push <length>
@export memcpy:
    setcorespeed 5
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
    setcorespeed
    ret
`;

export const stringEntryPoints = [ 'strcmp', 'strcat', 'strlen', 'strcpy', 'memcpy', 'strncat' ];

export const string = `
; EXPORT
; Expects:
; push lhs
; push rhs
; push &result
strcmp:
    _setinstrdelay 5
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
    _setinstrdelay 100
    ret
strcmp_true_conf:
    mov [esp + 8], 1
    _setinstrdelay 100
    ret
    
strcmp_false:
    mov [esp + 8], 0
    _setinstrdelay 100
    ret

; EXPORT
; Expects
; push lhs (org)
; push rhs (suffix)
strcat:
    _setinstrdelay 5
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
    
    _setinstrdelay 100
    ret
	
; EXPORT
; Expects
; push operand
; puhs &result
strlen:
    _setinstrdelay 5
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
    _setinstrdelay 100
    ret

`;

export const stringEntryPoints = [ 'strcmp', 'strcat', 'strlen' ];

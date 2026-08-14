const N8N_WEBHOOK_URL = 'http://localhost:5678/webhook/ia_hotel';

// Gerencia o ID de sessão único do usuário compatível com o n8n
let sessaoId = localStorage.getItem('elfsong_chat_sessao');
if (!sessaoId) {
    sessaoId = 'sessao_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('elfsong_chat_sessao', sessaoId);
}

async function enviarMensagem(event) {
    event.preventDefault();
    const input = document.getElementById('input-mensagem');
    const btn = document.getElementById('btn-enviar');
    const chatBox = document.getElementById('chat-box');
    const texto = input.value.trim();

    if (!texto) return;

    // Renderiza a mensagem enviada pelo usuário
    chatBox.innerHTML += `
        <div class="chat-message user shadow-sm">
            ${escapeHtml(texto)}
        </div>
    `;
    
    input.value = '';
    input.disabled = true;
    btn.disabled = true;
    chatBox.scrollTop = chatBox.scrollHeight;

    // Indicador visual de processamento
    const loadingId = 'loading-' + Date.now();
    chatBox.innerHTML += `
        <div class="chat-message bot shadow-sm" id="${loadingId}">
            <em>Processando solicitação...</em>
        </div>
    `;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        // Envia usando as chaves "mensagem" e "sessao_id" exigidas pelo workflowIA_n8n_2.json
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mensagem: texto,
                sessao_id: sessaoId 
            })
        });

        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();

        if (response.ok) {
            const data = await response.json();
            // Lê a chave "resposta" enviada pelo nó Respond to Webhook1 do n8n
            const respostaIA = data.resposta || data.output || data.text || "Operação realizada com sucesso.";
            
            chatBox.innerHTML += `
                <div class="chat-message bot shadow-sm">
                    <strong>Atendente Virtual:</strong><br>
                    ${escapeHtml(respostaIA).replace(/\n/g, '<br>')}
                </div>
            `;
        } else {
            chatBox.innerHTML += `
                <div class="chat-message bot shadow-sm text-danger">
                    Ocorreu um erro ao processar sua solicitação no servidor de IA.
                </div>
            `;
        }
    } catch (error) {
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();
        
        chatBox.innerHTML += `
            <div class="chat-message bot shadow-sm text-danger">
                Não foi possível conectar ao servidor do n8n. Verifique se o workflow está ativo.
            </div>
        `;
    } finally {
        input.disabled = false;
        btn.disabled = false;
        input.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}
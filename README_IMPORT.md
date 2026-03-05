# Instruções de Importação de Perguntas

Para importar as 50 perguntas de Gênesis/Criação para o seu banco de dados Supabase, siga estes passos:

### 1. Configurar Variáveis de Ambiente
Certifique-se de que as seguintes variáveis estão configuradas no seu painel de **Secrets** do AI Studio ou no arquivo `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

### 2. Executar o Script de Importação
Abra o terminal e execute o seguinte comando:

```bash
npx -y tsx import_questions.cjs genesis_creation_50.json
```

### 3. Verificar no App
Após a execução bem-sucedida, as perguntas estarão disponíveis na tabela `questions` com o status `approved`. Você pode visualizá-las no painel administrativo do app em `/admin/perguntas`.

---
**Nota:** O script `import_questions.cjs` já inclui validações para garantir que os dados estejam no formato correto antes de serem inseridos.

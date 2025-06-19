# Guia de Instalação - ALEXDEVELOPER30

## Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## Passo a Passo

### 1. Extrair e Preparar
```bash
# Extrair o backup
tar -xzf ALEXDEVELOPER30.tar.gz
cd ALEXDEVELOPER30_BACKUP

# Instalar dependências
npm install
```

### 2. Configurar Banco de Dados
```bash
# Criar banco
createdb valecashback_db

# Importar dados
psql valecashback_db < backup_alexdeveloper30_database.sql
```

### 3. Configurar Ambiente
```bash
# Copiar configurações
cp .env.example .env

# Editar .env com suas configurações
nano .env
```

**Configurar no .env:**
```
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/valecashback_db
SESSION_SECRET=gere_uma_chave_secreta_aleatoria
```

### 4. Executar Sistema
```bash
npm run dev
```

O sistema estará disponível em:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Credenciais de Teste

**Admin:** admin@valecashback.com / senha123
**Cliente:** cliente@valecashback.com / senha123  
**Lojista:** lojista@valecashback.com / senha123

```bash
docker build -t valecash-app .
docker run -d -p 3000:3000 --name valecash valecash-app
docker stop valecash

docker rm -f valecash
docker build -t valecash-app .
docker run -d -p 3000:3000 --name valecash valecash-app

docker logs -f valecash
docker ps -a | grep valecash

docker rm -f valecash
docker build -t valecash-app .
docker run -d -p 3000:3000 --name valecash valecash-app

# run http://localhost:3000
```

## Verificação

Teste as seguintes funcionalidades:
1. Login com credenciais acima
2. Sistema de indicações (código INVITE002)
3. Processamento de transações
4. Relatórios administrativos
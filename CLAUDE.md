@AGENTS.md


# Plant Monitor — CLAUDE.md

## Visão geral do projeto

Monitor ambiental para cultivo focado em **VPD (Vapor Pressure Deficit)**.
O ESP32 coleta temperatura, umidade do ar e umidade do solo em tempo real,
envia para uma API Next.js, que salva no Supabase e exibe num dashboard
com histórico, gráficos e alertas de VPD.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Banco de dados | Supabase (PostgreSQL) |
| Deploy | Vercel |
| Gráficos | Recharts |
| Estilização | Tailwind CSS |
| Firmware | Arduino (ESP32 DevKit V1) |

---

## Estrutura de pastas

```
plant-monitor/
├── app/
│   ├── api/
│   │   └── readings/
│   │       └── route.ts        # POST (ESP32) e GET (dashboard)
│   ├── dashboard/
│   │   └── page.tsx            # página principal
│   └── layout.tsx
├── components/
│   ├── VpdGauge.tsx            # indicador VPD atual + zona ideal
│   ├── TemperatureChart.tsx    # histórico de temperatura
│   ├── HumidityChart.tsx       # histórico de umidade do ar
│   ├── SoilChart.tsx           # histórico de umidade do solo
│   └── StatusBadge.tsx         # badge: zona ideal / alerta
├── lib/
│   ├── supabase.ts             # cliente Supabase
│   └── vpd.ts                  # cálculo de VPD e zonas
├── firmware/
│   └── main.ino                # sketch ESP32
├── .env.local                  # credenciais (não commitar)
├── CLAUDE.md                   # este arquivo
└── package.json
```

---

## Banco de dados (Supabase)

### Tabela `readings`

```sql
CREATE TABLE readings (
  id          BIGSERIAL PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  temperature FLOAT NOT NULL,        -- °C
  humidity    FLOAT NOT NULL,        -- % umidade do ar
  soil        INT NOT NULL,          -- 0-100% umidade do solo
  vpd         FLOAT NOT NULL         -- kPa calculado no backend
);
```

### Índice para queries de histórico

```sql
CREATE INDEX idx_readings_created_at ON readings (created_at DESC);
```

---

## Cálculo de VPD

Arquivo: `lib/vpd.ts`

Fórmula:
```
SVP = 0.6108 * e^(17.27 * T / (T + 237.3))   -- pressão de vapor saturado (kPa)
VPD = SVP * (1 - RH / 100)                    -- déficit de pressão de vapor
```

### Zonas por fase da planta

| Fase | VPD ideal (kPa) | Cor |
|---|---|---|
| Muda / início vegetativo | 0.4 – 0.8 | vermelho claro |
| Final vegetativo / início floração | 0.8 – 1.2 | verde |
| Meio e final da floração | 1.2 – 1.6 | laranja claro |

A função `getVpdZone(vpd, phase)` retorna: `'low' | 'ideal' | 'high'`

---

## API Routes

### POST /api/readings
Recebe dados do ESP32.

**Body esperado (JSON):**
```json
{
  "temperature": 24.0,
  "humidity": 62.0,
  "soil": 45
}
```

**Lógica:**
1. Valida os campos recebidos
2. Calcula o VPD no backend usando `lib/vpd.ts`
3. Salva no Supabase
4. Retorna `{ success: true, vpd: 1.04 }`

**Autenticação:** API Key simples via header `x-api-key`.
A key é definida em variável de ambiente `API_SECRET_KEY`.

### GET /api/readings
Retorna histórico para o dashboard.

**Query params:**
- `limit` — número de registros (default: 100)
- `from` — timestamp ISO (opcional)

---

## Dashboard — componentes principais

### VpdGauge
- Exibe o VPD atual em destaque (número grande)
- Indicador visual da zona: baixo / ideal / alto
- Seletor de fase da planta (muda / vegetativo / floração)
- Atualiza a cada 30 segundos (polling simples)

### TemperatureChart / HumidityChart / SoilChart
- Gráfico de linha com Recharts
- Eixo X: tempo (últimas 24h por padrão)
- Filtro de período: 1h / 6h / 24h / 7 dias
- Tooltip com valor exato ao passar o mouse

### StatusBadge
- Badge colorido mostrando status atual do VPD
- Verde: zona ideal | Vermelho: VPD baixo | Laranja: VPD alto

---

## Firmware ESP32 (firmware/main.ino)

**Sensores:**
- DHT11 no pino D4 — temperatura e umidade do ar
- YL-38 (AO) no pino A0 (GPIO34) — umidade do solo

**Fluxo:**
1. Conecta ao WiFi
2. A cada 30 segundos lê os sensores
3. Monta JSON com os valores
4. Faz HTTP POST para `https://seu-dominio.vercel.app/api/readings`
5. Inclui header `x-api-key` para autenticação
6. Aguarda resposta e loga no Serial

**Configurações no topo do sketch:**
```cpp
const char* WIFI_SSID     = "sua_rede";
const char* WIFI_PASSWORD = "sua_senha";
const char* API_URL       = "https://seu-dominio.vercel.app/api/readings";
const char* API_KEY       = "sua_api_key";
const int   INTERVALO_MS  = 30000; // 30 segundos
```

---

## Variáveis de ambiente (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
API_SECRET_KEY=
```

---

## Ordem de implementação

1. Configurar projeto Next.js + Tailwind + Supabase
2. Criar tabela `readings` no Supabase
3. Implementar `lib/vpd.ts` com cálculo e zonas
4. Implementar `POST /api/readings` com validação e auth
5. Implementar `GET /api/readings` com filtros
6. Criar componente `VpdGauge`
7. Criar gráficos de histórico
8. Criar `StatusBadge` e layout do dashboard
9. Escrever firmware do ESP32
10. Testar integração end-to-end

---

## Observações

- O DHT11 tem resolução de 1°C e 1% — suficiente para VPD aproximado
- O YL-38 retorna valor analógico bruto (0–4095 no ESP32); mapear para 0–100%
- O VPD é calculado sempre no backend, nunca no ESP32
- Não usar `use client` desnecessariamente — preferir Server Components onde possível
- Recharts requer `use client` nos componentes de gráfico
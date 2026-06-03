-- ============================================================
-- SISTEMA: EspaçoJá Real
-- CONSULTAS SQL v2 - Atualizadas para o novo diagrama
-- ============================================================

USE espacoja;

-- ============================================================
-- CONSULTA 1
-- Descrição: Obter o total arrecadado por tipo de espaço,
-- considerando apenas pagamentos aprovados, ordenado do
-- tipo que mais gerou receita para o que menos gerou.
-- Tabelas: tipo_espaco, espaco, reserva, nota, pagamento
-- ============================================================

SELECT
  te.nome                        AS tipo_espaco,
  COUNT(p.id_pagamento)          AS total_pagamentos,
  SUM(p.valor_pagamento)         AS total_arrecadado
FROM tipo_espaco te
JOIN espaco      e  ON e.id_tipo    = te.id_tipo
JOIN reserva     r  ON r.id_espaco  = e.id_espaco
JOIN nota        n  ON n.id_reserva = r.id_reserva
JOIN pagamento   p  ON p.id_nota    = n.id_nota
WHERE p.status = 'APROVADO'
GROUP BY te.id_tipo, te.nome
ORDER BY total_arrecadado DESC;

/*
Resultado esperado (amostra):
+------------------+------------------+-------------------+
| tipo_espaco      | total_pagamentos  | total_arrecadado  |
+------------------+------------------+-------------------+
| Salão de Festas  | 3                | R$ 3.180,00       |
| Auditório        | 1                | R$ 1.500,00       |
| Casa             | 1                | R$   720,00       |
| Quadra Esportiva | 1                | R$   320,00       |
| Espaço Coworking | 1                | R$   180,00       |
+------------------+------------------+-------------------+
*/


-- ============================================================
-- CONSULTA 2
-- Descrição: Obter a média das avaliações por espaço,
-- exibindo apenas espaços com pelo menos 1 avaliação,
-- ordenado da melhor para a pior média.
-- Tabelas: espaco, usuario, avaliacao
-- ============================================================

SELECT
  e.nome                        AS espaco,
  u.nome                        AS proprietario,
  COUNT(a.id_avaliacao)         AS total_avaliacoes,
  ROUND(AVG(a.nota), 2)         AS media_nota
FROM espaco    e
JOIN usuario   u  ON u.id_usuario   = e.id_proprietario
JOIN avaliacao a  ON a.id_espaco    = e.id_espaco
GROUP BY e.id_espaco, e.nome, u.nome
HAVING COUNT(a.id_avaliacao) >= 1
ORDER BY media_nota DESC;

/*
Resultado esperado (amostra):
+-------------------+--------------+------------------+------------+
| espaco            | proprietario | total_avaliacoes | media_nota |
+-------------------+--------------+------------------+------------+
| Quadra Arena Sul  | Carlos Mendes| 1                | 5.00       |
| Auditório Central | Ana Souza    | 1                | 5.00       |
| Salão Jardins     | Carlos Mendes| 1                | 5.00       |
| Salão Estrela     | Carlos Mendes| 1                | 4.00       |
| Coworking StartHub| Roberto Lima | 1                | 4.00       |
| Casa da Serra     | Roberto Lima | 1                | 3.00       |
+-------------------+--------------+------------------+------------+
*/


-- ============================================================
-- CONSULTA 3
-- Descrição: Obter o total de reservas e o valor total
-- movimentado por mês, considerando reservas confirmadas
-- ou finalizadas, para análise do volume mensal do sistema.
-- Tabelas: reserva, espaco, tipo_espaco
-- ============================================================

SELECT
  DATE_FORMAT(r.data_hora_inicio, '%m/%Y') AS mes_ano,
  COUNT(r.id_reserva)                       AS total_reservas,
  SUM(r.valor_total)                        AS valor_movimentado
FROM reserva     r
JOIN espaco      e  ON e.id_espaco = r.id_espaco
JOIN tipo_espaco te ON te.id_tipo  = e.id_tipo
WHERE r.status IN ('CONFIRMADA', 'FINALIZADA')
GROUP BY
  DATE_FORMAT(r.data_hora_inicio, '%m/%Y'),
  YEAR(r.data_hora_inicio),
  MONTH(r.data_hora_inicio)
ORDER BY
  YEAR(r.data_hora_inicio),
  MONTH(r.data_hora_inicio);

/*
Resultado esperado (amostra):
+---------+----------------+--------------------+
| mes_ano | total_reservas | valor_movimentado  |
+---------+----------------+--------------------+
| 03/2026 | 1              | R$   780,00        |
| 04/2026 | 2              | R$   900,00        |
| 05/2026 | 2              | R$ 2.800,00        |
| 06/2026 | 5              | R$ 3.630,00        |
| 07/2026 | 2              | R$   990,00        |
+---------+----------------+--------------------+
*/

-- ============================================================
-- FIM DAS CONSULTAS v2
-- ============================================================

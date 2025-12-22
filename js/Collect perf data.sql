-- 1. Wait Statistics
SELECT TOP 20
    wait_type,
    wait_time_ms,
    wait_time_ms * 100.0 / SUM(wait_time_ms) OVER() AS percentage,
    signal_wait_time_ms,
    wait_time_ms - signal_wait_time_ms AS resource_wait_ms
FROM sys.dm_os_wait_stats
WHERE wait_type NOT LIKE 'SLEEP%'
ORDER BY wait_time_ms DESC;

-- 2. Top Requêtes Lentes
SELECT TOP 20
    qs.execution_count,
    qs.total_elapsed_time / 1000 / qs.execution_count AS avg_duration_ms,
    qs.total_worker_time / 1000 / qs.execution_count AS avg_cpu_ms,
    qs.total_logical_reads / qs.execution_count AS avg_reads,
    SUBSTRING(qt.text, (qs.statement_start_offset/2)+1, 
        ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(qt.text)
        ELSE qs.statement_end_offset END - qs.statement_start_offset)/2)+1) AS query_text
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY qs.total_elapsed_time / qs.execution_count DESC;

-- 3. Index Manquants
SELECT 
    OBJECT_NAME(mid.object_id, mid.database_id) AS table_name,
    mid.equality_columns,
    mid.inequality_columns,
    mid.included_columns,
    migs.user_seeks,
    migs.avg_user_impact,
    'CREATE INDEX IX_' + OBJECT_NAME(mid.object_id, mid.database_id) + '_Missing ON ' +
    OBJECT_NAME(mid.object_id, mid.database_id) + 
    ' (' + ISNULL(mid.equality_columns, '') + ') INCLUDE (' + ISNULL(mid.included_columns, '') + ')'
FROM sys.dm_db_missing_index_details mid
JOIN sys.dm_db_missing_index_groups mig ON mid.index_handle = mig.index_handle
JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
WHERE migs.avg_user_impact > 50
ORDER BY migs.avg_user_impact DESC;

-- Sauvegarder tous les résultats dans un fichier .txt